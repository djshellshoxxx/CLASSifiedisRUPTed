# Command-line setup

ClassRup is a browser application with user-held keys and local browser storage. The terminal builds and serves public assets; it does not create accounts, unlock vaults or hold private keys. No relay, paid service, Docker, database or global ClassRup installation is required.

Required toolchain: Node **22.18.0 or newer**, pinned **pnpm 10.28.0**, and Git. Use `corepack pnpm` to select the version recorded in `package.json`; do not update the lockfile during installation. Node 22.18.0 distributions include Corepack. On Node distributions without Corepack, install Corepack using your existing package-management policy, or use the Node bootstrap below.

**Use `pnpm run setup` and `pnpm run doctor`.** Bare `pnpm setup` and `pnpm doctor` are pnpm's built-in toolchain commands. Package scripts cannot safely override them. The project exposes its setup and diagnostic scripts through the explicit `run` interface.

## Prerequisites without system-wide application installation

These optional bootstrap commands install Node 22.18.0 under your user directory. Existing supported Node installations can skip this section. Download sources are the official Node distribution service. Git must already be available (`git --version`); install Git through your operating system's usual software manager if absent.

Windows PowerShell (x64):

```powershell
$NodeVersion = '22.18.0'
$NodeParent = Join-Path $env:LOCALAPPDATA 'ClassRupToolchain'
New-Item -ItemType Directory -Force $NodeParent | Out-Null
$NodeZip = Join-Path $NodeParent 'node.zip'
Invoke-WebRequest "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip" -OutFile $NodeZip
Expand-Archive $NodeZip -DestinationPath $NodeParent -Force
$env:PATH = "$(Join-Path $NodeParent "node-v$NodeVersion-win-x64");$env:PATH"
node --version
corepack pnpm --version
```

macOS or Linux (bash; requires curl and tar):

```bash
NODE_VERSION=22.18.0
case "$(uname -s)" in Darwin) NODE_OS=darwin ;; Linux) NODE_OS=linux ;; *) exit 1 ;; esac
case "$(uname -m)" in x86_64) NODE_ARCH=x64 ;; arm64|aarch64) NODE_ARCH=arm64 ;; *) exit 1 ;; esac
NODE_PARENT="$HOME/.local/share/classrup-toolchain"
mkdir -p "$NODE_PARENT"
curl --fail --location "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-$NODE_OS-$NODE_ARCH.tar.gz" -o "$NODE_PARENT/node.tar.gz"
tar -xzf "$NODE_PARENT/node.tar.gz" -C "$NODE_PARENT"
export PATH="$NODE_PARENT/node-v$NODE_VERSION-$NODE_OS-$NODE_ARCH/bin:$PATH"
node --version
```

PATH additions above apply to the current terminal. Add the same directory to your user PATH to reuse it in new terminals. They need no administrator access. OS/bootstrap downloads are documented instructions, not evidence of execution on Windows or macOS.

## Clone, install, configure, start

The commands below work in PowerShell, macOS and Linux shells once Git and Node are installed:

```text
git clone https://github.com/djshellshoxxx/CLASSifiedisRUPTed.git
cd CLASSifiedisRUPTed
corepack pnpm install --frozen-lockfile
corepack pnpm run setup --non-interactive
corepack pnpm run doctor
corepack pnpm dev
```

Until the alpha branch is merged, check out its exact reviewed branch or commit before installing. Use the source SHA recorded in the milestone handoff; the repository's default branch may not contain this implementation.

Open the URL printed by `dev` (default `http://127.0.0.1:4173/`). Create/unlock identity in the browser. `dev` rebuilds once at startup; restart it after editing source. Stop with Ctrl+C. If pnpm's pinned executable is already on PATH, the `corepack` prefix is optional.

Configuration is `.classrup/local.json`, ignored by Git. Setup writes a complete file atomically and never overwrites existing settings. Repeat setup is safe. No secrets belong in this file. To choose settings at first initialization:

```text
corepack pnpm run setup --host 127.0.0.1 --port 4180 --base /classrup/ --non-interactive
corepack pnpm run setup --help
```

Allowed hosts: `localhost`, `127.0.0.1`, `::1` (loopback), `0.0.0.0`, `::` (explicit LAN binding). Ports: 1–65535. Base paths start/end with `/` and contain only letters, digits, `_` and `-` per segment. Existing configuration is preserved even when conflicting flags are supplied; that invocation fails with an explanation. Intentional later changes use `corepack pnpm run configure --port 4181` (or `--host` / `--base`), then `doctor`. Configure validates and atomically replaces only the non-secret settings; concurrent updates fail clearly.

## Build and static hosting

```text
corepack pnpm build
corepack pnpm preview
```

`dist/` contains the production public assets. `preview` serves this build locally; it is **not hardened production hosting**. Publish `dist/` to an HTTPS static host at the configured base path. Assets use relative paths, and the local server serves the configured prefix. The application entry is `index.html`; no server-side routing fallback is required for hash-based navigation. Browser cryptography and service workers require a secure context: localhost is supported for development; ordinary LAN HTTP is not.

The application has no mandatory relay configuration. File-based signed exchange works independently of a relay when available in the app. This installer does not provision or claim support for a live relay service. Do not copy `.classrup/`, browser profiles or private exports into public hosting.

## Updating and troubleshooting

Export browser data using the application's recovery flow before a substantial application update. Update the checkout using your normal reviewed Git workflow, then rerun frozen dependency installation, setup, doctor and build. Setup never clears browser storage. Keep using the same browser profile and exact origin (scheme/host/port): changing from `localhost` to `127.0.0.1`, changing ports, or moving hosts creates a different browser storage origin.

- Unsupported toolchain: use Node >=22.18.0 and `corepack pnpm` (10.28.0).
- Missing dependencies: run `corepack pnpm install --frozen-lockfile`.
- Missing config: run `corepack pnpm run setup`.
- Invalid config: correct the reported non-secret field; setup deliberately preserves the file.
- Port occupied: stop that process or run `corepack pnpm run configure --port 4181`.
- Interrupted setup: rerunning completes initialization. Unused `.setup-*.tmp` files are not read as configuration.
- Permission failure: use a writable user-owned checkout. Normal setup does not need root.
- Missing build: run `corepack pnpm build`; compilation errors are blocking and propagate nonzero.

## Verification evidence

| Environment | Source | Checks | Status |
| --- | --- | --- | --- |
| Linux, Node 24.22.1 | Working tree based on `3694395272e880d929fcb53693ddd70e14bc47bf` | `node --test tests/cli/*.test.mjs` | 15 passed during implementation |
| Windows / macOS | Same intended source | CI matrix `.github/workflows/cli-setup.yml` | Not yet executed locally; do not count as passed |
| Linux actual app | Integrated source required | `node tests/cli/browser-smoke.mjs` | Production build and 8 Firefox native-browser journeys passed; Chromium smoke blocked as detailed below |

The CLI unit suite covers paths with spaces, repeat/concurrent/interrupted setup, invalid/missing settings, unsupported runtime detection, occupied ports, safe public serving, traversal rejection, security headers and nonzero failure exits. The separate browser smoke starts actual `dev` and `preview`, checks real page rendering, reload and offline shell loading in Chromium, and cleans up processes. It does not replace the milestone's full multi-principal browser journeys or Firefox/WebKit verification.

The service worker caches only a fixed set of public shell assets. Builds derive a content hash from those assets and the worker; a new worker waits until old tabs close before activation. Activation removes only old caches for the same ClassRup scope. Private runtime requests, exports and vault records are never cached by the worker. Offline vault operations remain subject to the domain and browser evidence in the milestone handoff.

Browser download limitation observed here: Playwright Chromium download returned an invalid empty archive. A system Chromium fallback also failed with `socket() failed: Operation not permitted` in this execution sandbox. Browser smoke is therefore not claimed passed from these attempts. Where a supported system browser is available, `CLASSRUP_CHROMIUM_EXECUTABLE` may select its executable for the smoke script. No administrator install is required for ordinary app setup.
