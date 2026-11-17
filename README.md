# IanGit Mobile

A local-first, mobile-oriented GitHub workspace for Ian West. This first milestone includes a connection screen, encrypted token vault, dashboard with assigned issues and review requests, GitHub search, and a searchable, filterable paginated repository list for `ianwest09`. Read-only repository details include README, files, open issues, pull requests, Actions runs, commits, and branches. The console is an opt-in, restricted runner; The Agent Mode page offers a local prompt library and a link to Arena. File create/edit commits, branch creation and pull-request creation are available behind review-and-confirm screens. The console does not provide arbitrary shell access.

The dashboard shows up to 10 review requests and 10 assigned issues across the connected `ianwest09` account. GitHub search supports repositories, code, issues/PRs, users and organizations, showing up to 30 results per query. Search requires network access and may be rate-limited. Project activity checks up to the five most recently updated cached repositories: the latest 20 Actions runs, up to 20 open Dependabot alerts, and five recent commits per repository. It is not a complete account-wide feed, and unavailable sources are reported separately. Dependabot alerts require appropriate read permission and enabled GitHub features; no alerts shown is not a security guarantee. Code scanning and secret scanning alerts are not yet included.

## Termux setup

Install Termux from F-Droid or its official GitHub releases (do not mix Termux and plugin installation sources). On ARM64 Termux with Python 3.14, the following approach uses the official Termux `python-cryptography` package and a prebuilt `pydantic-core` wheel from the community-maintained Termux User Repository (TUR). TUR is a **separate third-party package source**; review and trust it before installing. This setup has not yet been verified on Ian's phone.

```sh
pkg update
pkg install python nodejs git python-cryptography
# In the project directory, using Termux's system Python:
python -m venv --system-site-packages .venv-termux
. .venv-termux/bin/activate
# Download only the pinned pydantic-core wheel from TUR; do not build from source.
python -m pip install --only-binary=:all: --no-deps --index-url https://termux-user-repository.github.io/pypi/ 'pydantic-core==2.50.4'
python -m pip install --only-binary=:all: -r backend/requirements-termux.txt
python -m pip check
python -c 'import cryptography, pydantic_core, fastapi; print("Imports OK", cryptography.__version__, pydantic_core.__version__)'
cd frontend && npm ci && npm run build && cd ..
```

Stop at the first failure; don't proceed to the next step until it is resolved. `--system-site-packages` exposes all Termux system Python packages to this virtual environment, not just cryptography. The native cryptography version must satisfy the pinned range; Termux and TUR are rolling repositories and compatible packages might change. Never install or run unknown packages without reviewing their source. Other platforms can use `backend/requirements.txt` in a normal venv instead.

To start the already-installed app, from the project directory:

```sh
. .venv-termux/bin/activate
# Choose a separate local access passphrase (at least 12 characters):
read -rs IANGIT_ACCESS_PASSPHRASE; export IANGIT_ACCESS_PASSPHRASE
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --no-access-log
```

Open `http://127.0.0.1:8000` in the phone's browser and enter that local access passphrase. It is separate from your token vault passphrase. The local session is kept in browser memory and resets on refresh or server restart. Stop the server with Ctrl+C. Keep Termux running while using the app. The backend only permits loopback hostnames and same-origin browser requests. The local access passphrase protects the API from unauthenticated local requests, but is not a defense against a compromised device, browser extensions, or another process with access to your environment or memory. Never expose the server on a network or use a tunnel. For development, start the backend as above, then run `cd frontend && npm run dev` and open `http://127.0.0.1:5173`. The interface uses system fonts and does not load third-party font resources.

### Android permissions

This milestone needs internet access, normally provided to Termux by Android. It does not require shared-storage access, Termux:API, or Termux:Boot. If a later approved feature needs shared storage, `termux-setup-storage` requests Android permission; do not grant it unless needed. Android battery management may stop Termux in the background.

## GitHub token

Create a **fine-grained personal access token** in GitHub settings, select `ianwest09` as resource owner and select only repositories needed. Metadata read access is automatically granted; public repositories are also listed. For private repositories, select the relevant repositories. Classic tokens require the broad `repo` scope to read private repositories; prefer fine-grained tokens. Read-only views do not need write, workflow-write, or deletion access. To use the optional write actions, Contents write is needed for files and branches, and Pull requests write for pull requests; grant these only if you approve the additional access. Fine-grained tokens may need Contents read for files, commits and branches, Issues read for issues, Pull requests read for pull requests, and Actions read for workflow runs. Grant only the views you need. Other owners' repositories are intentionally excluded. GitHub's `open_issues_count` includes pull requests, so it is labelled accordingly; separate PR counts and watcher/subscriber counts are not yet provided.

Paste the token on the connection screen and choose a passphrase of at least 12 characters. The backend validates the token with GitHub, derives an encryption key using scrypt, and stores a Fernet-encrypted vault under `~/.iangit-mobile/` with restrictive file permissions. The passphrase is not stored; losing it means reconnecting with a new token. While unlocked, the token is held in backend memory and sent to GitHub over HTTPS. It is also sent from the browser to the loopback backend during connection. Never put it in a URL, command, issue, screenshot, or chat. Fine-grained permissions are not returned by GitHub's OAuth scope header; inspect them in GitHub token settings. Classic scope information is shown when GitHub supplies it.

Disconnect deletes the local encrypted token and cached repository metadata (but retains the local audit log), but **does not revoke the token on GitHub**; revoke it separately in GitHub settings. Local cache contains unencrypted repository metadata, including private names and descriptions; it is stored with restrictive permissions but is not an encrypted cache. A rooted, compromised, or shared device can expose local data, browser memory, or unlocked process memory. The server must run only on a trusted phone. Close the server when not in use. The unlock operation currently validates online; once unlocked, a failed refresh can show the last cached list. Offline unlock is not yet supported. This prototype is not a substitute for a security audit.

## Confirmed GitHub writes and local audit

From a repository, use New file, edit a file from its Files view, New branch, or New pull request. Each opens a form followed by a review screen; nothing is sent until **Confirm on GitHub**. File edits use the loaded file SHA to detect conflicts. Branches start at a full 40-character commit SHA shown in GitHub; pull requests specify head and base branches. GitHub branch protection and token permissions still apply. If a network request times out, check GitHub before retrying because its outcome may be unknown. No deletes, repository management, or workflow triggers are implemented.

Write attempts are recorded in `~/.iangit-mobile/audit.jsonl` with action, repository, target and outcome, but not file contents or PR bodies. The log is local and unencrypted; do not put secrets in file paths or branch names. This log does not yet include read API calls and is not tamper-proof. The current interface does not expose audit entries; you may inspect the local file directly.

## Restricted Termux console

The console is disabled by default. To opt in, choose an existing trusted workspace directory and start the server with that directory fixed for the session, for example:

```sh
# Set and export IANGIT_ACCESS_PASSPHRASE first, as above.
IANGIT_CONSOLE_ROOT="$HOME/my-project" python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --no-access-log
```

Open Termux Console in the app. The only accepted commands are exact forms `pwd`, `ls`, `git status`, and `git status --short`; arguments, pipes and shell syntax are not accepted. Every run requires a review and confirmation. The process runs without a shell, times out after 10 seconds, and caps output at 64 KiB. Git global/system configuration and inherited Git environment variables are ignored; filesystem monitor and optional Git locks are disabled. Output and history shown in the page are held in browser memory until cleared or the page is closed; command, directory, and result are written to the local audit log. Output can contain private filenames; review before copying.

This is **not a sandbox**. Commands run with Termux's permissions, and the selected workspace and its repository configuration must be trusted. Do not expose the server on a network. Installing packages, changing directories, and git pull/push are not implemented. They need a separate design and approval. Termux:API is not needed for this restricted runner.

## Python script editor and runner

This feature is independently disabled by default. Create a trusted scripts directory yourself, then set `IANGIT_SCRIPTS_ROOT` to its existing path when starting the server. To enable both features, for example:

```sh
# Set and export IANGIT_ACCESS_PASSPHRASE first, as above.
IANGIT_CONSOLE_ROOT="$HOME/my-project" IANGIT_SCRIPTS_ROOT="$HOME/my-scripts" python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --no-access-log
```

The editor only handles simple `.py` files directly inside that directory (no subdirectories or symlinks), up to 100 KB. Review and confirm each save. Replacing a file requires loading it first; changes detected before replacement are rejected. Saves through this service are serialized, but external editors do not participate in its lock, so a concurrent external change can still be overwritten. Avoid editing the same file simultaneously elsewhere. Review and confirm the entire saved source before running. The backend checks its SHA-256 and runs that exact snapshot through the server's Python interpreter using `-I -`, with the scripts directory as working directory. This means `__file__` is `<stdin>` and interactive input is unavailable. stdout and stderr are combined; output is limited to 64 KiB and execution to 10 seconds. Output and command history shown in the browser are local, not automatically uploaded.

**Scripts are arbitrary code, not sandboxed:** they run with Termux's permissions and can modify any accessible files, read environment secrets, start processes, or use the network. Timeout and output limits are not security boundaries. Never run untrusted code. Audit records the path, hash, interpreter, and outcome locally, but not source or output. Scripts and audit entries are unencrypted on disk. These features have not yet been tested on an Android device.

## Agent Mode

The Agent Mode page provides eight prompt templates, optional repository and file context, and a place to enter an error or issue. Select a template, review the assembled prompt, and use **Copy prompt**. Open [Arena](https://arena.ai/) using the link, select Agent Mode if available, and paste it yourself. This app does not automatically send or prefill any data in Arena. Clipboard access depends on browser support. Do not include tokens or private content unless you decide to share them. Arena does not have automatic access to the phone's shell; review and approve any proposed commands separately.

## Local regression tests

After installing backend dependencies, run `python -m unittest discover -s tests -v` from the project root. The tests use mock GitHub responses and do not execute scripts or contact GitHub. Termux and live GitHub integration still require separate testing.

## Troubleshooting

- **Connection refused:** confirm the server is running in Termux and use the address and port above on the same phone.
- **GitHub rejects token:** check its expiration, owner, repository selection, and permissions in GitHub settings. Do not share it when asking for help.
- **Missing private repositories:** connect as `ianwest09`, and check that the token is authorized for those repositories. GitHub may require organization authorization in other contexts.
- **Offline or rate-limited:** retry refresh later. A previously fetched cache is shown on refresh failure while unlocked.
- **Build or install fails:** update Termux packages and check Python/Node versions and available storage. Check that the Termux native cryptography package version meets the Termux requirements, that the venv was created with `--system-site-packages`, and that TUR has a compatible pinned pydantic-core wheel. Do not silently fall back to an unreviewed source build.
- **Port in use:** choose another loopback port and use that port in the browser.

## Next milestones for individual approval

1. Install dependencies and run local tests.
2. Test repository views with a real, read-only token on Termux.
3. Add explicitly confirmed GitHub write actions.
4. Add the approval-based Termux bridge, then the script editor and runner.
5. Add the Agent Mode prompt library, richer dashboard, search and audit log.

## License

MIT; see LICENSE.
