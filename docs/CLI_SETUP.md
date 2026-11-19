# Command-line setup

ClassRup is a browser application with user-held keys and local browser storage. The terminal builds and serves public assets and verifies explicitly selected signed public files. It does not create accounts, unlock vaults or hold private keys. No relay, paid service, Docker, database or global ClassRup installation is required.

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

The default `main` branch now contains the runnable development alpha. Use `git switch main` for that baseline, or check out an exact reviewed candidate SHA when reproducing a particular test result. Consult [current project status](status/PROJECT_STATUS.md) for the evidence and remaining qualification of that candidate.

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

## Verify a public signed file

After the frozen dependency installation, run either command without setup or an open browser vault:

```text
node tools/cli/classrup.mjs record verify --file "listing.json"
node tools/cli/classrup.mjs record verify --file "withdraw-listing.json" --json
```

This F1a domain-CLI slice accepts the existing `classrup.bazaar.listing/v1` and
`classrup.alpha.tombstone/v1` formats only. It verifies the content hash, native
Ed25519 signature, strict public payload, owner/author binding and listing expiry
using the same payload checks as the PWA's retained-listing command. A listing
whose expiry equals or precedes the local clock fails. The envelope's existing
five-minute future-clock allowance is unchanged. A standalone withdrawal can be
verified without its target file, but its target and prior chain are not checked.

Only an explicitly named regular file of at most **1,048,576 bytes** is read.
Final symbolic links, directories, devices, FIFO streams, URLs, UNC paths and
stdin (`-`) are rejected. Relative paths use the terminal's current directory.
The reader checks the opened descriptor and enforces the byte limit while
reading, including if the file grows. Files selected through an already-mounted
filesystem use that filesystem; the command itself makes no network requests.
It creates no configuration, vault, keys, import history or other persistent
state and does not change the input file.

Successful output includes only verified envelope metadata: type, CID, author,
listing ID, revision, creation time, sequence and previous CID. It omits the
payload and extension fields, including listing descriptions. Human output is
the default. `--json` emits one versioned JSON object on stdout for either
success or failure, with no duplicate error output. In human mode, a failure
prints its fixed diagnostic on stderr and leaves stdout empty.
Errors use fixed messages and never print the selected path, input content or
native parser/cryptography details.

| JSON field | Contract in schema version 1 |
| --- | --- |
| `schemaVersion` | `1` |
| `command` | `record.verify` |
| `ok` | Boolean; selects the success or error shape |
| `record` | Success only: authenticated public metadata listed above |
| `verification` | Success only: local check time, signature/hash/payload/author checks, expiry result and explicit limits |
| `error` | Failure only: stable `code` and fixed `message` |

The success result always labels chain, retained history and revocation
`unchecked`; current ownership and trust are `not-established`, and vault
admission is `not-performed`. A valid file does not prove current availability,
possession, trusted identity, payment, unseen later revisions or an unrevoked
signing key. The PWA still applies its retained-history, conflict, quota and
workflow checks when importing. Other signed record types are rejected rather
than reported as supported public verification.

| Exit | Meaning for `record verify` |
| --- | --- |
| `0` | The supported standalone public record passed the stated checks |
| `2` | Invalid arguments/file type, too-large input, invalid JSON or rejected public record |
| `3` | File could not be read or the required runtime/dependencies are unavailable |

Version 1 error codes are `USAGE`, `FILE_INVALID`, `FILE_TOO_LARGE`,
`FILE_UNREADABLE`, `INVALID_JSON`, `INVALID_RECORD` and
`INFRASTRUCTURE_FAILURE`. Existing setup-tool exit behavior is unchanged.
`record verify --help` displays usage. Listing/search commands, private vault
operations and complete UI/CLI parity remain planned in the
[domain CLI specification](future-cli-spec.md).

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

## Historical verification evidence

The table below records the original CLI implementation checkpoint. Later platform and browser results are recorded with their source commits in [current project status](status/PROJECT_STATUS.md); the historical entries are not the present qualification summary.

| Environment | Source | Checks | Status |
| --- | --- | --- | --- |
| Linux, Node 24.22.1 | Working tree based on `3694395272e880d929fcb53693ddd70e14bc47bf` | `node --test tests/cli/*.test.mjs` | 15 passed during implementation |
| Windows / macOS | Same intended source | CI matrix `.github/workflows/cli-setup.yml` | Not yet executed locally; do not count as passed |
| Linux actual app | Integrated source required | `node tests/cli/browser-smoke.mjs` | Production build and 8 Firefox native-browser journeys passed; Chromium smoke blocked as detailed below |

The CLI unit suite covers paths with spaces, repeat/concurrent/interrupted setup, invalid/missing settings, unsupported runtime detection, occupied ports, safe public serving, traversal rejection, security headers and nonzero failure exits. The separate browser smoke starts actual `dev` and `preview`, checks real page rendering, reload and offline shell loading in Chromium, and cleans up processes. It does not replace the milestone's full multi-principal browser journeys or Firefox/WebKit verification.

The service worker caches only a fixed set of public shell assets. Builds derive a content hash from those assets and the worker; a new worker waits until old tabs close before activation. Activation removes only old caches for the same ClassRup scope. Private runtime requests, exports and vault records are never cached by the worker. Offline vault operations remain subject to the domain and browser evidence in the milestone handoff.

Browser download limitation observed here: Playwright Chromium download returned an invalid empty archive. A system Chromium fallback also failed with `socket() failed: Operation not permitted` in this execution sandbox. Browser smoke is therefore not claimed passed from these attempts. Where a supported system browser is available, `CLASSRUP_CHROMIUM_EXECUTABLE` may select its executable for the smoke script. No administrator install is required for ordinary app setup.
