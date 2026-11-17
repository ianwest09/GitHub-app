"""Loopback-only IanGit local service. No token or request body is logged."""
import base64
import json
import os
import secrets
import hmac
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from fastapi import FastAPI, HTTPException, Request as IncomingRequest
from pydantic import BaseModel, Field

DATA = Path(os.environ.get('IANGIT_DATA_DIR', str(Path.home() / '.iangit-mobile')))
VAULT = DATA / 'vault.json'
CACHE = DATA / 'repositories.json'
app = FastAPI(title='IanGit Mobile', docs_url=None, redoc_url=None)
# The API is same-origin only; the optional Vite proxy preserves browser origin.
_sessions = set()
_token = None
_profile = None
_permissions = None

@app.middleware('http')
async def local_only(request: IncomingRequest, call_next):
    host = request.headers.get('host', '').split(':')[0].lower()
    origin = request.headers.get('origin')
    allowed_origins = {f'http://{request.headers.get("host")}'}
    if host not in ('localhost', '127.0.0.1', '[::1]') or (origin and origin not in allowed_origins):
        return __import__('fastapi').responses.JSONResponse({'detail': 'Only local requests are allowed.'}, status_code=403)
    if request.method == 'POST' and request.headers.get('X-IanGit-Request') != '1':
        return __import__('fastapi').responses.JSONResponse({'detail': 'Missing local request header.'}, status_code=403)
    if request.url.path.startswith('/api/') and request.url.path != '/api/session':
        session = request.headers.get('X-IanGit-Session', '')
        if not session or session not in _sessions:
            return JSONResponse({'detail':'Unlock local access first.'}, status_code=401)
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response

@app.exception_handler(RequestValidationError)
async def validation_error(request, exc):
    # Never reflect submitted values, including tokens, in validation responses.
    return JSONResponse({'detail': 'Invalid request. Check the supplied fields.'}, status_code=422)

class LocalAccess(BaseModel):
    passphrase: str = Field(min_length=1, max_length=1024)

@app.post('/api/session')
def create_session(body: LocalAccess):
    configured = os.environ.get('IANGIT_ACCESS_PASSPHRASE', '')
    if len(configured) < 12:
        raise HTTPException(503, 'Local access is not configured. Set IANGIT_ACCESS_PASSPHRASE to at least 12 characters before starting the server.')
    if not hmac.compare_digest(configured.encode(), body.passphrase.encode()):
        raise HTTPException(401, 'Incorrect local access passphrase.')
    session = secrets.token_urlsafe(32)
    # Invalidate older browser sessions when access is unlocked again.
    _sessions.clear()
    _sessions.add(session)
    return {'session': session}

class Connect(BaseModel):
    token: str = Field(min_length=1, max_length=1024)
    passphrase: str = Field(min_length=12, max_length=1024)

class Unlock(BaseModel):
    passphrase: str = Field(min_length=1, max_length=1024)

def key(passphrase, salt):
    return base64.urlsafe_b64encode(Scrypt(salt=salt, length=32, n=2**14, r=8, p=1).derive(passphrase.encode()))

def write_private(path, value):
    DATA.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(DATA, 0o700)
    fd, tmp = tempfile.mkstemp(dir=DATA, prefix='.tmp-')
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, 'w') as f:
            json.dump(value, f)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)

def github(path, token):
    req = Request('https://api.github.com' + path, headers={'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'IanGit-Mobile'})
    try:
        with urlopen(req, timeout=20) as response:
            return json.load(response), dict(response.headers)
    except HTTPError as e:
        if e.code == 401: raise HTTPException(401, 'GitHub rejected the token. Check or replace it.')
        if e.code == 403: raise HTTPException(403, 'GitHub denied the request or the rate limit was reached. Check token permissions and try again later.')
        if e.code == 404: raise HTTPException(404, 'Not found on GitHub, or your token cannot access it.')
        if e.code == 422: raise HTTPException(422, 'GitHub could not process this request. Check the query or repository state.')
        raise HTTPException(502, f'GitHub returned HTTP {e.code}.')
    except (URLError, TimeoutError, OSError):
        raise HTTPException(503, 'GitHub is unreachable. Check your connection.')

def identify(token):
    user, headers = github('/user', token)
    # GitHub does not expose fine-grained token permission details through this header.
    scopes = next((v for k, v in headers.items() if k.lower() == 'x-oauth-scopes'), None)
    return {k: user.get(k) for k in ('login', 'avatar_url', 'html_url', 'name')}, scopes

@app.get('/api/status')
def status():
    return {'connected': bool(_token), 'vault_exists': VAULT.exists(), 'profile': _profile, 'scopes': _permissions}

@app.post('/api/connect')
def connect(body: Connect):
    global _token, _profile, _permissions
    token = body.token.strip()
    profile, scopes = identify(token)
    salt = secrets.token_bytes(16)
    encrypted = Fernet(key(body.passphrase, salt)).encrypt(token.encode()).decode()
    write_private(VAULT, {'version': 1, 'salt': base64.b64encode(salt).decode(), 'ciphertext': encrypted})
    _token, _profile, _permissions = token, profile, scopes
    return status()

@app.post('/api/unlock')
def unlock(body: Unlock):
    global _token, _profile, _permissions
    try:
        vault = json.loads(VAULT.read_text())
        token = Fernet(key(body.passphrase, base64.b64decode(vault['salt']))).decrypt(vault['ciphertext'].encode()).decode()
    except (OSError, ValueError, KeyError, InvalidToken):
        raise HTTPException(400, 'Could not unlock the vault. Check your passphrase.')
    profile, scopes = identify(token)
    _token, _profile, _permissions = token, profile, scopes
    return status()

@app.post('/api/disconnect')
def disconnect():
    global _token, _profile, _permissions
    _token = _profile = _permissions = None
    VAULT.unlink(missing_ok=True)
    # The cache may contain private repository metadata; remove it on disconnect.
    CACHE.unlink(missing_ok=True)
    return status()

def pages(path, token):
    result = []
    for page in range(1, 101):
        items, _ = github(path + ('&' if '?' in path else '?') + f'per_page=100&page={page}', token)
        result.extend(items)
        if len(items) < 100: return result
    raise HTTPException(502, 'Repository pagination limit reached; results were not cached.')

def clean_repo(r):
    return {'name': r['name'], 'full_name': r['full_name'], 'description': r.get('description'), 'private': r['private'], 'language': r.get('language'), 'stars': r['stargazers_count'], 'forks': r['forks_count'], 'watchers': r.get('subscribers_count'), 'updated_at': r['updated_at'], 'pushed_at': r.get('pushed_at'), 'open_issues_count': r['open_issues_count'], 'default_branch': r['default_branch'], 'html_url': r['html_url'], 'archived': r['archived']}

@app.get('/api/repositories')
def repositories(refresh: bool = False):
    if not _token: raise HTTPException(401, 'Connect or unlock your GitHub account first.')
    if not refresh and CACHE.exists():
        try:
            cached = json.loads(CACHE.read_text())
            if cached.get('account') == _profile['login']:
                return {**cached, 'cached': True}
        except (ValueError, OSError): pass
    try:
        public = pages('/users/ianwest09/repos?type=owner', _token)
        accessible = pages('/user/repos?affiliation=owner&visibility=all', _token) if _profile['login'].lower() == 'ianwest09' else []
        repos = {r['full_name'].lower(): clean_repo(r) for r in public + accessible if r['owner']['login'].lower() == 'ianwest09'}
        data = {'account': _profile['login'], 'repositories': list(repos.values()), 'cached_at': datetime.now(timezone.utc).isoformat()}
        write_private(CACHE, data)
        return {**data, 'cached': False}
    except HTTPException as exc:
        if CACHE.exists():
            try:
                cached = json.loads(CACHE.read_text())
                if cached.get('account') == _profile['login']:
                    return {**cached, 'cached': True, 'warning': f'Could not refresh: {exc.detail} Showing saved data.'}
            except (ValueError, OSError): pass
        raise

# Read-only repository views. Owner and repository name are checked against GitHub's
# allowed character set so paths cannot escape the intended API endpoints.
import re
from urllib.parse import quote

def repo_path(name):
    if not re.fullmatch(r'[A-Za-z0-9_.-]{1,100}', name) or name in ('.', '..'):
        raise HTTPException(400, 'Invalid repository name.')
    if not _token:
        raise HTTPException(401, 'Connect or unlock your GitHub account first.')
    return '/repos/ianwest09/' + quote(name, safe='')

def encoded_file_path(path):
    if not path or any(part in ('', '.', '..') for part in path.split('/')):
        raise HTTPException(400, 'Invalid file path.')
    return '/'.join(quote(part, safe='') for part in path.split('/'))

@app.get('/api/repo/{name}/overview')
def repo_overview(name: str):
    base = repo_path(name)
    repo, _ = github(base, _token)
    return clean_repo(repo)

@app.get('/api/repo/{name}/readme')
def repo_readme(name: str):
    data, _ = github(repo_path(name) + '/readme', _token)
    return decode_file(data)

def decode_file(data):
    if data.get('type') not in (None, 'file') or data.get('encoding') != 'base64' or data.get('content') is None:
        raise HTTPException(422, 'This file is too large or cannot be displayed as text.')
    try:
        raw = base64.b64decode(data['content'], validate=False)
        if len(raw) > 512_000 or b'\x00' in raw:
            raise ValueError()
        text = raw.decode('utf-8')
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(422, 'This file is binary, too large, or not UTF-8 text.')
    return {'name': data.get('name'), 'path': data.get('path'), 'text': text, 'html_url': data.get('html_url'), 'sha': data.get('sha')}

@app.get('/api/repo/{name}/files')
def repo_files(name: str, path: str = ''):
    base = repo_path(name) + '/contents'
    if path:
        base += '/' + encoded_file_path(path)
    data, _ = github(base, _token)
    if isinstance(data, list):
        return {'type': 'directory', 'entries': [{'name': x['name'], 'path': x['path'], 'type': x['type'], 'size': x.get('size')} for x in data]}
    return {'type': 'file', **decode_file(data)}

@app.get('/api/repo/{name}/issues')
def repo_issues(name: str):
    items = pages(repo_path(name) + '/issues?state=open', _token)
    return [{'number': x['number'], 'title': x['title'], 'html_url': x['html_url'], 'created_at': x['created_at'], 'user': x['user']['login'], 'comments': x['comments']} for x in items if 'pull_request' not in x]

@app.get('/api/repo/{name}/pulls')
def repo_pulls(name: str):
    items = pages(repo_path(name) + '/pulls?state=open', _token)
    return [{'number': x['number'], 'title': x['title'], 'html_url': x['html_url'], 'created_at': x['created_at'], 'user': x['user']['login'], 'draft': x.get('draft', False)} for x in items]

@app.get('/api/repo/{name}/actions')
def repo_actions(name: str):
    data, _ = github(repo_path(name) + '/actions/runs?per_page=50', _token)
    return [{'id': x['id'], 'name': x.get('name'), 'status': x['status'], 'conclusion': x.get('conclusion'), 'branch': x.get('head_branch'), 'created_at': x['created_at'], 'html_url': x['html_url']} for x in data.get('workflow_runs', [])]

@app.get('/api/repo/{name}/commits')
def repo_commits(name: str):
    data, _ = github(repo_path(name) + '/commits?per_page=30', _token)
    return [{'sha': x['sha'], 'message': x['commit']['message'], 'author': x['commit']['author']['name'] if x['commit'].get('author') else 'Unknown', 'date': x['commit']['author']['date'] if x['commit'].get('author') else None, 'html_url': x['html_url']} for x in data]

@app.get('/api/repo/{name}/branches')
def repo_branches(name: str):
    items = pages(repo_path(name) + '/branches', _token)
    return [{'name': x['name'], 'protected': x['protected'], 'sha': x['commit']['sha']} for x in items]

# All writes require a separate, explicit client confirmation. File contents and
# issue bodies are deliberately excluded from the local audit log.
class FileWrite(BaseModel):
    path: str = Field(min_length=1, max_length=1000)
    content: str = Field(max_length=500_000)
    message: str = Field(min_length=1, max_length=500)
    branch: str = Field(min_length=1, max_length=255)
    sha: str | None = Field(default=None, max_length=100)
    confirmed: bool = False

class BranchWrite(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    source_sha: str = Field(pattern=r'^[0-9a-fA-F]{40}$')
    confirmed: bool = False

class PullWrite(BaseModel):
    title: str = Field(min_length=1, max_length=256)
    body: str = Field(default='', max_length=50000)
    head: str = Field(min_length=1, max_length=255)
    base: str = Field(min_length=1, max_length=255)
    confirmed: bool = False

def require_confirmation(confirmed):
    if not confirmed: raise HTTPException(400, 'Explicit confirmation is required.')

def audit(action, repo, target, outcome):
    # Avoid recording file contents, PR bodies, tokens, or raw API errors.
    DATA.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(DATA, 0o700)
    path = DATA / 'audit.jsonl'
    fd = os.open(path, os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o600)
    with os.fdopen(fd, 'a') as f:
        f.write(json.dumps({'at': datetime.now(timezone.utc).isoformat(), 'action': action, 'repository': 'ianwest09/' + repo, 'target': target, 'outcome': outcome}) + '\n')

def github_write(path, method, payload):
    req = Request('https://api.github.com' + path, data=json.dumps(payload).encode(), method=method, headers={'Accept':'application/vnd.github+json', 'Content-Type':'application/json', 'Authorization':'Bearer ' + _token, 'X-GitHub-Api-Version':'2022-11-28', 'User-Agent':'IanGit-Mobile'})
    try:
        with urlopen(req, timeout=30) as response: return json.load(response)
    except HTTPError as e:
        if e.code == 401: raise HTTPException(401, 'GitHub rejected the token.')
        if e.code == 403: raise HTTPException(403, 'GitHub denied the action. Check token permissions and branch protection.')
        if e.code == 404: raise HTTPException(404, 'Repository or resource not found, or token access is missing.')
        if e.code in (409, 422): raise HTTPException(e.code, 'GitHub rejected the change. Check the branch, file SHA, and repository state.')
        raise HTTPException(502, f'GitHub returned HTTP {e.code}.')
    except (URLError, TimeoutError, OSError):
        raise HTTPException(503, 'GitHub could not be reached. The outcome may be unknown; check GitHub before retrying.')

def perform_write(name, action, target, endpoint, method, payload):
    repo_path(name) # validates owner-scoped name and connection
    try:
        result = github_write(endpoint, method, payload)
    except HTTPException:
        try: audit(action, name, target, 'failed or unknown')
        except OSError: pass
        raise
    try: audit(action, name, target, 'success')
    except OSError: result['_audit_warning'] = 'Action succeeded, but the local audit log could not be written.'
    return result

@app.post('/api/repo/{name}/file-write')
def file_write(name: str, body: FileWrite):
    require_confirmation(body.confirmed)
    endpoint = repo_path(name) + '/contents/' + encoded_file_path(body.path)
    payload = {'message': body.message, 'content': base64.b64encode(body.content.encode('utf-8')).decode(), 'branch': body.branch}
    if body.sha: payload['sha'] = body.sha
    result = perform_write(name, 'edit file' if body.sha else 'create file', body.path, endpoint, 'PUT', payload)
    return {'commit_sha': result.get('commit', {}).get('sha'), 'html_url': result.get('content', {}).get('html_url'), 'audit_warning': result.get('_audit_warning')}

@app.post('/api/repo/{name}/branch-write')
def branch_write(name: str, body: BranchWrite):
    require_confirmation(body.confirmed)
    if not body.name.strip() or any(c in body.name for c in ('\n','\r')): raise HTTPException(400, 'Invalid branch name.')
    endpoint = repo_path(name) + '/git/refs'
    result = perform_write(name, 'create branch', body.name, endpoint, 'POST', {'ref': 'refs/heads/' + body.name, 'sha': body.source_sha})
    return {'ref': result.get('ref'), 'audit_warning': result.get('_audit_warning')}

@app.post('/api/repo/{name}/pull-write')
def pull_write(name: str, body: PullWrite):
    require_confirmation(body.confirmed)
    endpoint = repo_path(name) + '/pulls'
    result = perform_write(name, 'create pull request', body.head + ' → ' + body.base, endpoint, 'POST', {'title':body.title, 'body':body.body, 'head':body.head, 'base':body.base})
    return {'number': result.get('number'), 'html_url': result.get('html_url'), 'audit_warning': result.get('_audit_warning')}

@app.get('/api/audit')
def audit_log():
    if not _token: raise HTTPException(401, 'Connect or unlock your GitHub account first.')
    path = DATA / 'audit.jsonl'
    if not path.exists(): return []
    try:
        return [json.loads(line) for line in path.read_text().splitlines()[-100:]][::-1]
    except (OSError, ValueError): raise HTTPException(500, 'Could not read the local audit log.')

# Restricted, opt-in console. It never starts a shell and only runs exact argv
# sequences from this table; a user-controlled workspace is fixed at startup.
import subprocess
import selectors
import time

CONSOLE_COMMANDS = {'pwd': ['pwd'], 'ls': ['ls'], 'git status': ['git', '-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', 'status'], 'git status --short': ['git', '-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', 'status', '--short']}
class ConsoleRun(BaseModel):
    command: str = Field(max_length=100)
    confirmed: bool = False

def console_root():
    configured = os.environ.get('IANGIT_CONSOLE_ROOT')
    if not configured: return None
    root = Path(configured).expanduser().resolve()
    return root if root.is_dir() else None

@app.get('/api/console')
def console_status():
    root = console_root()
    return {'enabled': root is not None, 'cwd': str(root) if root else None, 'commands': list(CONSOLE_COMMANDS)}

def console_audit(command, root, outcome):
    DATA.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(DATA, 0o700)
    fd = os.open(DATA / 'audit.jsonl', os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o600)
    with os.fdopen(fd, 'a') as f:
        f.write(json.dumps({'at': datetime.now(timezone.utc).isoformat(), 'action':'console command', 'command':command, 'working_directory':str(root), 'outcome':outcome}) + '\n')

def run_restricted(argv, root, input_bytes=None):
    env = os.environ.copy()
    # Do not allow inherited Git environment variables to redirect Git operations.
    for name in list(env):
        if name.startswith('GIT_'): env.pop(name)
    env.update({'GIT_CONFIG_NOSYSTEM':'1', 'GIT_CONFIG_GLOBAL':os.devnull, 'GIT_OPTIONAL_LOCKS':'0', 'GIT_TERMINAL_PROMPT':'0', 'PAGER':'cat', 'GIT_PAGER':'cat', 'LC_ALL':'C'})
    input_file = None
    try:
        if input_bytes is not None:
            input_file = tempfile.TemporaryFile()
            input_file.write(input_bytes)
            input_file.seek(0)
        proc = subprocess.Popen(argv, cwd=str(root), env=env, stdin=input_file if input_file else subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, start_new_session=True)
    except OSError:
        if input_file: input_file.close()
        raise HTTPException(500, 'Could not start command. Check that the required tool is installed.')
    selector = selectors.DefaultSelector()
    selector.register(proc.stdout, selectors.EVENT_READ)
    output = bytearray(); deadline = time.monotonic() + 10; truncated = False; timed_out = False
    try:
        while selector.get_map():
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                timed_out = True; break
            for key, _ in selector.select(remaining):
                chunk = os.read(key.fileobj.fileno(), min(8192, 65537-len(output)))
                if not chunk:
                    selector.unregister(key.fileobj); break
                output.extend(chunk)
                if len(output) > 65536:
                    truncated = True; break
            if truncated: break
        if timed_out or truncated:
            import signal
            os.killpg(proc.pid, signal.SIGKILL)
        try:
            proc.wait(timeout=max(0.1, deadline-time.monotonic()))
        except subprocess.TimeoutExpired:
            import signal
            timed_out = True
            os.killpg(proc.pid, signal.SIGKILL)
            proc.wait()
    finally:
        selector.close()
        proc.stdout.close()
        if input_file: input_file.close()
    return {'output': bytes(output[:65536]).decode('utf-8', errors='replace'), 'exit_code': proc.returncode, 'timed_out': timed_out, 'truncated': truncated}

@app.post('/api/console/run')
def console_run(body: ConsoleRun):
    require_confirmation(body.confirmed)
    root = console_root()
    if root is None: raise HTTPException(403, 'Console is disabled. Set IANGIT_CONSOLE_ROOT to an existing workspace before starting the server.')
    argv = CONSOLE_COMMANDS.get(body.command)
    if argv is None: raise HTTPException(400, 'Command is not on the exact allowlist.')
    try:
        result = run_restricted(argv, root)
    except HTTPException:
        try: console_audit(body.command, root, 'failed to start')
        except OSError: pass
        raise
    try: console_audit(body.command, root, 'timed out' if result['timed_out'] else 'output limited' if result['truncated'] else 'exit ' + str(result['exit_code']))
    except OSError: result['audit_warning'] = 'Command completed, but the local audit log could not be written.'
    return result

# Script editing and execution are a second, independent opt-in. Only direct
# .py children are accepted; directory-relative no-follow operations block
# traversal and symlink targets. Scripts have full Termux process permissions.
import hashlib
import sys
import threading
_script_save_lock = threading.Lock()

class ScriptSave(BaseModel):
    name: str = Field(min_length=4, max_length=120)
    content: str = Field(max_length=100_000)
    expected_sha256: str | None = None
    confirmed: bool = False

class ScriptRun(BaseModel):
    name: str = Field(min_length=4, max_length=120)
    sha256: str = Field(pattern=r'^[0-9a-f]{64}$')
    confirmed: bool = False

def scripts_root():
    value = os.environ.get('IANGIT_SCRIPTS_ROOT')
    if not value: return None
    root = Path(value).expanduser().resolve()
    return root if root.is_dir() else None

def script_name(name):
    if not re.fullmatch(r'[A-Za-z0-9_-][A-Za-z0-9_.-]{0,115}\.py', name) or name.startswith('.'):
        raise HTTPException(400, 'Use a simple .py filename with no directories.')
    return name

def read_script_at(root, name):
    name = script_name(name)
    directory = os.open(root, os.O_RDONLY | os.O_DIRECTORY)
    try:
        try:
            fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory)
        except FileNotFoundError: raise HTTPException(404, 'Script not found.')
        except OSError: raise HTTPException(400, 'Cannot read this file; symlinks are not allowed.')
        with os.fdopen(fd, 'rb') as f:
            import stat
            if not stat.S_ISREG(os.fstat(f.fileno()).st_mode): raise HTTPException(400, 'Only regular files are supported.')
            content = f.read(100_001)
        if len(content) > 100_000: raise HTTPException(413, 'Script exceeds the 100 KB limit.')
        try: text = content.decode('utf-8')
        except UnicodeDecodeError: raise HTTPException(422, 'Script must be UTF-8 text.')
        return {'name': name, 'content': text, 'sha256': hashlib.sha256(content).hexdigest()}
    finally: os.close(directory)

def script_audit(action, root, name, digest, outcome):
    DATA.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(DATA, 0o700)
    fd = os.open(DATA / 'audit.jsonl', os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o600)
    with os.fdopen(fd, 'a') as f:
        f.write(json.dumps({'at':datetime.now(timezone.utc).isoformat(), 'action':action, 'path':str(root / name), 'sha256':digest, 'interpreter':sys.executable if action == 'run script' else None, 'outcome':outcome})+'\n')

@app.get('/api/scripts')
def scripts_status():
    root = scripts_root()
    if not root: return {'enabled':False, 'directory':None, 'scripts':[], 'interpreter':None}
    return {'enabled':True, 'directory':str(root), 'interpreter':sys.executable, 'scripts':sorted(p.name for p in root.iterdir() if p.name.endswith('.py') and not p.is_symlink() and p.is_file() and re.fullmatch(r'[A-Za-z0-9_-][A-Za-z0-9_.-]{0,115}\.py',p.name))}

@app.get('/api/scripts/file')
def script_read(name: str):
    root = scripts_root()
    if not root: raise HTTPException(403, 'Scripts are disabled.')
    return read_script_at(root, name)

@app.post('/api/scripts/save')
def script_save(body: ScriptSave):
    with _script_save_lock:
        return _script_save_locked(body)

def _script_save_locked(body: ScriptSave):
    require_confirmation(body.confirmed)
    root = scripts_root()
    if not root: raise HTTPException(403, 'Scripts are disabled.')
    name = script_name(body.name)
    content = body.content.encode('utf-8')
    if len(content) > 100_000: raise HTTPException(413, 'Script exceeds the 100 KB limit.')
    try: existing = read_script_at(root, name)
    except HTTPException as e:
        if e.status_code != 404: raise
        existing = None
    if existing and existing['sha256'] != body.expected_sha256: raise HTTPException(409, 'File exists or changed. Reload it before replacing.')
    if not existing and body.expected_sha256: raise HTTPException(409, 'File no longer exists. Reload before saving.')
    directory = os.open(root, os.O_RDONLY | os.O_DIRECTORY)
    temp_name = '.iangit-' + secrets.token_hex(16)
    try:
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW
        fd = os.open(temp_name, flags, 0o600, dir_fd=directory)
        with os.fdopen(fd, 'wb') as f: f.write(content)
        # Never overwrite a symlink, even if it was swapped after validation.
        try:
            import stat
            current = os.stat(name, dir_fd=directory, follow_symlinks=False)
            if not stat.S_ISREG(current.st_mode): raise HTTPException(409, 'Destination is not a regular file.')
            if existing is None: raise HTTPException(409, 'File appeared during save. Reload it first.')
            if read_script_at(root, name)['sha256'] != body.expected_sha256: raise HTTPException(409, 'File changed during save. Reload it first.')
        except FileNotFoundError:
            if existing: raise HTTPException(409, 'File disappeared during save. Reload it first.')
        os.replace(temp_name, name, src_dir_fd=directory, dst_dir_fd=directory)
    finally:
        try: os.unlink(temp_name, dir_fd=directory)
        except FileNotFoundError: pass
        os.close(directory)
    digest=hashlib.sha256(content).hexdigest()
    try: script_audit('save script', root, name, digest, 'success'); warning = None
    except OSError: warning = 'File was saved, but the local audit log could not be written.'
    return {'name':name, 'sha256':digest, 'audit_warning':warning}

@app.post('/api/scripts/run')
def script_run(body: ScriptRun):
    require_confirmation(body.confirmed)
    root = scripts_root()
    if not root: raise HTTPException(403, 'Scripts are disabled.')
    script = read_script_at(root, body.name)
    if script['sha256'] != body.sha256: raise HTTPException(409, 'Script changed since review. Reload and review it again.')
    # Execute the exact reviewed snapshot via stdin, not a path that can change.
    try: result = run_restricted([sys.executable, '-I', '-'], root, script['content'].encode('utf-8'))
    except HTTPException:
        try: script_audit('run script', root, body.name, script['sha256'], 'failed to start')
        except OSError: pass
        raise
    try: script_audit('run script', root, body.name, script['sha256'], 'timed out' if result['timed_out'] else 'output limited' if result['truncated'] else 'exit '+str(result['exit_code']))
    except OSError: result['audit_warning'] = 'Script completed, but the local audit log could not be written.'
    return result

# Read-only GitHub search and dashboard. Search input is encoded as a query,
# never interpolated into the API path.
from urllib.parse import urlencode

@app.get('/api/search')
def search_github(q: str, kind: str = 'repositories'):
    if not _token: raise HTTPException(401, 'Connect or unlock your GitHub account first.')
    if kind not in ('repositories', 'code', 'issues', 'users', 'organizations'):
        raise HTTPException(400, 'Unsupported search category.')
    if not q.strip() or len(q) > 256: raise HTTPException(400, 'Enter a search query of at most 256 characters.')
    endpoint = 'users' if kind == 'organizations' else kind
    query = q.strip() + (' type:org' if kind == 'organizations' else '')
    data, _ = github('/search/' + endpoint + '?' + urlencode({'q':query, 'per_page':30}), _token)
    results = []
    for item in data.get('items', []):
        if kind == 'repositories':
            results.append({'title':item.get('full_name'), 'description':item.get('description'), 'url':item.get('html_url'), 'meta':f"{item.get('stargazers_count', 0)} stars · {item.get('language') or 'No language'}"})
        elif kind == 'code':
            results.append({'title':item.get('path'), 'description':item.get('repository',{}).get('full_name'), 'url':item.get('html_url'), 'meta':'Code'})
        elif kind == 'issues':
            results.append({'title':item.get('title'), 'description':f"#{item.get('number')} · {item.get('state')}", 'url':item.get('html_url'), 'meta':'Pull request' if item.get('pull_request') else 'Issue'})
        else:
            results.append({'title':item.get('login'), 'description':item.get('html_url'), 'url':item.get('html_url'), 'meta':item.get('type')})
    return {'items':results, 'total_count':data.get('total_count',0), 'incomplete':data.get('incomplete_results',False)}

@app.get('/api/dashboard')
def dashboard():
    if not _token: raise HTTPException(401, 'Connect or unlock your GitHub account first.')
    if not _profile or _profile['login'].lower() != 'ianwest09':
        return {'reviews':[], 'assigned':[], 'warnings':['Dashboard issue and review queries require connecting as ianwest09.']}
    data = {'reviews':[], 'assigned':[], 'warnings':[]}
    for key, query in [('reviews','is:pr is:open review-requested:ianwest09'), ('assigned','is:issue is:open assignee:ianwest09')]:
        try:
            response, _ = github('/search/issues?' + urlencode({'q':query,'per_page':10,'sort':'updated','order':'desc'}), _token)
            data[key] = [{'title':x.get('title'), 'url':x.get('html_url'), 'number':x.get('number'), 'updated_at':x.get('updated_at'), 'repository':x.get('repository_url','').split('/repos/')[-1]} for x in response.get('items',[])]
        except HTTPException as exc: data['warnings'].append(key.capitalize() + ': ' + str(exc.detail))
    return data

@app.get('/api/dashboard/repository-activity')
def dashboard_repository_activity(repos: str = ''):
    if not _token: raise HTTPException(401, 'Connect or unlock your GitHub account first.')
    names = [name for name in repos.split(',') if name]
    if len(names) > 5 or len(set(names)) != len(names):
        raise HTTPException(400, 'Select up to five distinct repositories.')
    for name in names: repo_path(name)
    result = {'repositories': names, 'runs': [], 'alerts': [], 'commits': [], 'warnings': []}
    for name in names:
        base = repo_path(name)
        try:
            runs, _ = github(base + '/actions/runs?per_page=20', _token)
            for run in runs.get('workflow_runs', []):
                if run.get('status') in ('queued','in_progress','waiting','requested','pending') or run.get('conclusion') in ('failure','timed_out','action_required'):
                    result['runs'].append({'repository':name, 'name':run.get('name') or 'Workflow run', 'status':run.get('conclusion') or run.get('status'), 'date':run.get('created_at'), 'url':run.get('html_url')})
        except HTTPException as exc: result['warnings'].append(f'{name} · Actions: {exc.detail}')
        try:
            alerts, _ = github(base + '/dependabot/alerts?state=open&per_page=20', _token)
            for alert in alerts:
                advisory = alert.get('security_advisory') or {}
                dep = alert.get('dependency') or {}
                result['alerts'].append({'repository':name, 'title':advisory.get('summary') or (dep.get('package') or {}).get('name') or 'Dependabot alert', 'severity':advisory.get('severity') or 'unknown', 'date':alert.get('created_at'), 'url':alert.get('html_url')})
        except HTTPException as exc: result['warnings'].append(f'{name} · Dependabot alerts unavailable: {exc.detail}')
        try:
            commits, _ = github(base + '/commits?per_page=5', _token)
            for item in commits:
                commit = item.get('commit') or {}; author = commit.get('author') or {}
                result['commits'].append({'repository':name, 'sha':item.get('sha',''), 'message':(commit.get('message') or '').split('\n')[0], 'author':author.get('name') or 'Unknown', 'date':author.get('date'), 'url':item.get('html_url')})
        except HTTPException as exc: result['warnings'].append(f'{name} · Commits: {exc.detail}')
    for key in ('runs','alerts','commits'):
        result[key].sort(key=lambda x: x.get('date') or '', reverse=True)
    return result

# Built frontend, if present. API routes above take precedence.
from fastapi.staticfiles import StaticFiles
DIST = Path(__file__).resolve().parent.parent / 'frontend' / 'dist'
if DIST.is_dir():
    app.mount('/', StaticFiles(directory=DIST, html=True), name='frontend')
