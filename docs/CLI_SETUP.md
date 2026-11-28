# Command-line setup

ClassRup is a browser application with user-held keys and local browser storage. The terminal builds and serves public assets, verifies explicitly selected signed public files, and lists or searches their public listings. It does not create accounts, unlock vaults or hold private keys. No relay, paid service, Docker, database or global ClassRup installation is required.

Required toolchain: Node **22.18.0 or newer**, pinned **pnpm 10.28.0**, and Git. Use `corepack pnpm` to select the version recorded in `package.json`; do not update the lockfile during installation. Node 22.18.0 distributions include Corepack. On Node distributions without Corepack, install Corepack using your existing package-management policy, or use the Node bootstrap below.

**Use `pnpm run setup` and `pnpm run doctor`.** Bare `pnpm setup` and `pnpm doctor` are pnpm's built-in toolchain commands. Package scripts cannot safely override them. The project exposes its setup and diagnostic scripts through the explicit `run` interface.

## Check the checkout version

With Node available, these commands work before dependency installation or setup:

```text
node tools/cli/classrup.mjs --version
node tools/cli/classrup.mjs --version --json
```

The tracked root `package.json` is the single version source. The current value,
`0.0.0-development`, describes an **unreleased checkout**. This development value
can span several commits; record the exact Git SHA separately when reporting a
source-specific problem. Standalone executable packaging remains planned.

Human output is one line on stdout:

```text
ClassRup 0.0.0-development (unreleased checkout)
```

JSON output is one schema-version-1 object on stdout:

```json
{"schemaVersion":1,"command":"version","ok":true,"name":"classrup","version":"0.0.0-development","releaseStatus":"unreleased"}
```

Both forms exit `0` and leave stderr empty. `--json` may occur once after
`--version`; other arguments in that position exit `2` with `USAGE`. Missing or
invalid checkout metadata exits `3` with `INFRASTRUCTURE_FAILURE`. JSON failures
retain `schemaVersion: 1`, `command: "version"`, `ok: false` and an
`error: {code, message}` object on stdout; human failures use stderr. Errors are
fixed messages and do not echo argument values, metadata contents or paths.

The existing help precedence is preserved: `--version --help` displays help and
exits `0`, even without the version metadata. Version and help need no installed
dependencies, package-manager selection or local configuration. The script finds
its checkout metadata from its own location, so an absolute script path also
works from another working directory, including paths containing spaces. Version
reporting performs no network, child-process, key or persistent-write operations.

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
`record verify --help` displays usage. The public listing/search commands below
provide the next files-only slice. Private vault operations, persisted-cache
access and complete UI/CLI parity remain planned in the
[domain CLI specification](future-cli-spec.md).

## List, show and search public listing files

F1b reads explicitly selected signed public files and builds a temporary view
using the same retention and search handlers as the PWA. Each `--file` selects
one existing public listing or signed withdrawal. Repeat it for additional
files; the command does not scan directories, discover files or contact relays.
Setup and an open browser vault are unnecessary.

```text
node tools/cli/classrup.mjs listing list --file "bicycle.json" --file "boots.json" --json
node tools/cli/classrup.mjs search --file "bicycle.json" --file "boots.json" --query "winter" --region c2b2 --json
node tools/cli/classrup.mjs search --file "bicycle.json" --currency CAD --min-price 1000 --max-price 3000 --barter-only
```

To show one listing, copy its exact `author` and `listing.listingId` values from
the JSON listing result and supply them as `--owner DID --id UUID`:

```text
node tools/cli/classrup.mjs listing show --file "bicycle.json" --owner "DID_FROM_LIST_RESULT" --id "UUID_FROM_LIST_RESULT" --json
```

The two quoted selector values above are placeholders. Both selectors are
required because different authors can use the same listing ID. `show` includes
an unavailable publication, but a supplied valid withdrawal suppresses its
listing. `list` and `search` exclude unavailable listings unless
`--include-unavailable` is present. An empty list/search succeeds with exit 0;
`show` returns exit 4 if the selected subject has no current publication in the
supplied files. This says nothing about unseen files or another user's vault.

### Verification, revisions and limits

Every selected record must pass the existing envelope verifier and shared public
payload, author-binding and expiry checks before any result is emitted. An
invalid, unsupported, expired or tampered file fails the whole invocation,
including when its text would not match the search. Expired historical files
are not silently accepted into this view: select the supported, unexpired
publications and withdrawals you intend to inspect. Expiry uses one local
check time for the invocation and retains the existing five-minute future-clock
allowance for envelope timestamps.

The view deduplicates verified CIDs and applies revisions in deterministic
owner/listing/revision order through the shared PWA handlers. Repeating a file
or supplying a second copy of the same signed record does not duplicate its
listing. A valid higher revision replaces the earlier selected publication.
A signed withdrawal suppresses its own owner's subject and, when a prior record
is selected, must target that record's CID. A standalone withdrawal has no
independently established target history. Same-revision forks and inconsistent
withdrawal targets fail the whole invocation with `HISTORY_CONFLICT`; the CLI
does not pick one side of a conflict. It does not verify author-stream continuity,
revocation or unseen later revisions, and cannot establish present ownership or
trust. A different owner's signed withdrawal cannot suppress another owner.

The supported input is at most **128 files**, at most **1,048,576 bytes per
file**, and at most **16,777,216 bytes in total**. Repeated files count toward
both limits. Each selected file uses the same regular-file, descriptor, UTF-8,
size and local-path checks as `record verify`. Only transient memory is written:
no public cache, import history, browser storage, configuration, keys or other
persistent state is created. The original files remain unchanged. Already
mounted filesystems retain their normal filesystem behavior; these commands
make no network requests themselves.

### Search options

Search uses the PWA's substring matching and public-listing filters. It is not a
remote search, taxonomy expansion, full-text index or proof of exact distance.

| Option | Meaning |
| --- | --- |
| `--query TEXT` | Case-insensitive substring across title, description and tags; maximum 120 characters. Omit it or use an empty string for all eligible listings. |
| `--region CELL` | Lowercase 4–5 character geohash prefix of the published coarse region. |
| `--category UUID` | Exact category UUID, without descendant expansion. |
| `--kind KIND` | `sell`, `wanted` or `giveaway`. |
| `--condition CONDITION` | `new`, `like_new`, `good`, `fair`, `poor` or `for_parts`. |
| `--currency CODE` | Match the declared currency; no conversion or settlement inference. |
| `--min-price N`, `--max-price N` | Inclusive decimal-string minor-unit bounds, up to 78 digits; require `--currency`. Zero is supported; leading zeros and negative values are rejected. |
| `--barter-only` | Require the signed publication's barter opt-in. |
| `--include-unavailable` | Include unavailable publications; also supported by `listing list`. Withdrawals remain excluded. |

### Pagination and output

List/search results sort by owner DID and then listing UUID in ascending code-unit
order, independent of argument order, filesystem order and locale. They accept
`--limit N` (1–100, default 20) and `--offset N` (0–128, default 0). The response
reports the total eligible subjects and `nextOffset`, or `null` at the end.
An offset beyond the result set returns an empty successful page.

For successive pages, repeat the same file selections and search options, use
the reported `nextOffset`, and pass `--snapshot HASH` with the preceding
`source.snapshot`. The snapshot binds the unique signed CIDs, command and
query/selector options; it is independent of file names, duplicate copies,
argument order, page size and offset. Changed records or query options fail with
`SNAPSHOT_CHANGED`, rather than silently continuing a different view. Each page
still rechecks the selected files and their expiry against its local clock.

JSON mode writes one schema-version-1 object to stdout on success or failure.
Human failures use stderr and leave stdout empty. Errors contain fixed messages,
without selected paths, native error details or input excerpts.

| JSON field | Contract in schema version 1 |
| --- | --- |
| `schemaVersion`, `command`, `ok` | Version `1`; command `listing.list`, `listing.show` or `search`; success discriminator. Invalid listing subcommands use the fixed command name `listing`. |
| `source` | Success only: `kind: "explicit-public-files"`, `filesRead`, `uniqueRecords`, and query-bound `snapshot`. |
| `verification` | Success only: the local `checkedAt`, valid signature/hash/payload/author binding, unexpired selected listings, `history: "selected-files-only"`, unchecked chain/revocation, unestablished ownership/trust and `persistence: "none"`. |
| `items` | List/search success only: the requested page of public projections. |
| `item` | Show success only: the selected public projection. |
| `pagination` | List/search success only: `offset`, `limit`, `total`, `nextOffset`. |
| `excludedSubjects` | List/search success only: selected subjects excluded by withdrawal, availability or search filters; not an estimate of unseen records. |
| `error` | Failure only: stable `code` and fixed `message`. |

Each item contains `cid`, `author`, `createdAt`, `sequence`, `previousCid` and
the verified public `listing` payload. This includes the signed description,
tags, declared value and coarse region. Extension fields, raw envelopes, input
paths and local observation metadata are omitted. Human text escapes terminal
controls and directional formatting. JSON escapes those characters without
changing the values produced by a JSON parser.

| Exit | Meaning for listing/search |
| --- | --- |
| `0` | Successful view, including an empty list or search result. |
| `2` | Invalid arguments/input, rejected record, conflicting history, exceeded limits or changed snapshot. |
| `3` | Input read failure, runtime/dependency failure or inability to evaluate the temporary view. |
| `4` | `listing show` has no matching current publication in the supplied files. |

Stable errors are `USAGE`, `FILE_INVALID`, `FILE_TOO_LARGE`, `FILE_UNREADABLE`,
`INVALID_JSON`, `INVALID_RECORD`, `INPUT_LIMIT`, `HISTORY_CONFLICT`,
`SNAPSHOT_CHANGED`, `NOT_FOUND`, `QUERY_FAILED` and `INFRASTRUCTURE_FAILURE`.
The files-only F1b slice does not read a PWA retained-cache export, browser vault,
encrypted backup or private working copy. Those adapters and mutation commands
remain separate future work.

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
