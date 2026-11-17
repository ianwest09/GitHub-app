"""Offline security regression tests; never contact GitHub or execute scripts."""
import asyncio
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from fastapi import HTTPException
import backend.app as app

async def asgi_request(path, method='GET', headers=None, body=None):
    body = json.dumps(body).encode() if body is not None else b''
    event = [{'type': 'http.request', 'body': body, 'more_body': False}]
    async def receive():
        if event: return event.pop(0)
        await asyncio.sleep(60)
        return {'type': 'http.disconnect'}
    messages = []
    async def send(message): messages.append(message)
    raw_headers = [(b'host', b'localhost:8000'), (b'content-type', b'application/json')]
    raw_headers += [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()]
    scope = {'type':'http', 'asgi':{'version':'3.0'}, 'http_version':'1.1', 'method':method, 'scheme':'http', 'path':path, 'raw_path':path.encode(), 'query_string':b'', 'headers':raw_headers, 'client':('127.0.0.1', 1234), 'server':('localhost',8000), 'root_path':''}
    await app.app(scope, receive, send)
    status = next(m['status'] for m in messages if m['type']=='http.response.start')
    response = b''.join(m.get('body', b'') for m in messages if m['type']=='http.response.body')
    return status, response

class SecurityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old_data = app.DATA
        app.DATA = Path(self.temp.name) / 'data'
        self.env = patch.dict(os.environ, {'IANGIT_ACCESS_PASSPHRASE':'a-long-local-passphrase', 'IANGIT_SCRIPTS_ROOT':self.temp.name})
        self.env.start()
        app._sessions.clear()

    def tearDown(self):
        app._sessions.clear()
        app.DATA = self.old_data
        self.env.stop()
        self.temp.cleanup()

    def req(self, *args, **kwargs): return asyncio.run(asgi_request(*args, **kwargs))

    def session(self):
        code, response = self.req('/api/session', 'POST', {'X-IanGit-Request':'1'}, {'passphrase':'a-long-local-passphrase'})
        self.assertEqual(code, 200)
        return json.loads(response)['session']

    def test_session_and_origin_required(self):
        self.assertEqual(self.req('/api/status')[0], 401)
        self.assertEqual(self.req('/api/session','POST',{'X-IanGit-Request':'1', 'Origin':'http://localhost:5173'},{'passphrase':'a-long-local-passphrase'})[0],403)
        self.assertEqual(self.req('/api/session','POST',{'X-IanGit-Request':'1'},{'passphrase':'wrong'})[0],401)
        session = self.session()
        self.assertEqual(self.req('/api/status',headers={'X-IanGit-Session':session})[0],200)
        self.assertEqual(self.req('/api/disconnect','POST',{'X-IanGit-Session':session})[0],403)
        self.session()
        self.assertEqual(self.req('/api/status',headers={'X-IanGit-Session':session})[0],401)

    def test_invalid_token_not_reflected(self):
        session=self.session()
        token='SENSITIVE-'+('X'*1100)
        code, response=self.req('/api/connect','POST',{'X-IanGit-Request':'1','X-IanGit-Session':session},{'token':token,'passphrase':'a-long-vault-passphrase'})
        self.assertEqual(code,422)
        self.assertNotIn(b'SENSITIVE',response)

    def test_script_conflict_and_no_execution(self):
        result=app.script_save(app.ScriptSave(name='test.py',content='first',confirmed=True))
        (Path(self.temp.name)/'test.py').write_text('changed')
        with self.assertRaises(HTTPException) as error:
            app.script_save(app.ScriptSave(name='test.py',content='replace',expected_sha256=result['sha256'],confirmed=True))
        self.assertEqual(error.exception.status_code,409)
        with patch.object(app,'run_restricted') as runner:
            with self.assertRaises(HTTPException): app.script_run(app.ScriptRun(name='test.py',sha256=result['sha256'],confirmed=True))
            runner.assert_not_called()
        (Path(self.temp.name)/'link.py').symlink_to(Path(self.temp.name)/'test.py')
        with self.assertRaises(HTTPException): app.script_read('link.py')

    def test_audit_failure_does_not_hide_success(self):
        app._token='fake'
        with patch.object(app,'github_write',return_value={'commit':{'sha':'abc'},'content':{}}), patch.object(app,'audit',side_effect=OSError('disk full')):
            result=app.file_write('repo',app.FileWrite(path='file.txt',content='x',message='message',branch='main',confirmed=True))
        self.assertEqual(result['commit_sha'],'abc')
        self.assertIn('succeeded',result['audit_warning'])
        app._token=None

if __name__=='__main__': unittest.main()
