# Project status

## November 16, 2026 archive recovery and owner pagination continuation

Continues from `edcb583` (PR #40, stacked on owner-history PR #39). New archives
have owner-only lifecycle evidence, an exact 90-day restore deadline, revision
checks and atomic archived/restored events. Draft and published listings can now
be archived directly. Published archive creates and verifies a chained signed
withdrawal in the same transaction; a bad signer or active inventory hold blocks
the action without committing changes. Restoring preserves listing data and
history, returns the listing as unpublished, and never republishes automatically.
Publishing again continues from the withdrawal's signed chain position.

The PWA exposes archive confirmation and restore actions. Published archive
explicitly downloads the withdrawal for sharing. Archive evidence is included in
encrypted backups; restore validates lifecycle dates and ownership before any
records commit. Owner listing pages now show the newest 50 first with Previous
and Next controls. Pagination resets on lock and draft creation; queued duplicate
navigation callbacks cannot advance from a stale page. Owner-scoped cursors are
validated by the kernel repository.

This remains a bounded F01.S01.M04 implementation. Automatic expiry, close reasons,
auto-archive/purge sweeps, release-holds confirmation and complete account deletion
are unfinished. Legacy archived listings have no dated recovery record and do not
acquire an invented restore deadline. Existing archive output now follows the
specified archiveRecordId/restoreUntil shape. Archive records use UUIDv7 IDs;
prior compound-key history storage is unchanged. The 90-day deadline is based on
the local clock and cannot provide a trusted wall clock against device tampering.
The historical 51-row planning security tracker remains open.

Verification so far: 22 listing/discovery tests and 3 production archive-backup
tests passed; 32 CLI/tooling tests passed. Typecheck, build, dependency checks and
strict specification checks (148 modules, zero errors/warnings) pass. The first
full domain run was terminated by the host (exit 137), so it is not a pass. A
memory-bounded fork-pool full retry passed all 520 tests with zero failures/skips. Two browser journeys were added
for signed archive/backup/recovery and pagination beyond 50 listings. Playwright
loads their definitions, but local execution fails before any assertion because
the pinned Chromium executable is unavailable; its download returned corrupt
archives. Candidate CI must qualify the final head before merge. Candidate PR #41 at `b2363bf` passed its Linux CLI smoke matrix on Node 22/24;
Alpha browser qualification is still in progress. Predecessor PR #39's Alpha
workflow passed, but its CLI matrix has a cancelled macOS Node 22 job and a queued
macOS Node 24 job. No merge is represented as qualified while these gates remain open.

## November 16, 2026 owner listing history continuation

PR #39 continues from encrypted-storage PR #38, which passed Alpha verification
43912138849 and CLI setup 43912139045 and merged at `32c9d7e`. Listing publication now
records an append-only snapshot of publishable fields. Later public-field edits
of an unpublished listing that has previously been published record immutable
local revisions; draft and private-only edits do not create snapshots. The
owner-only history list/get queries verify hashes, canonical compound keys and
ownership before returning data. The PWA exposes lazy, paginated history with
safe text rendering and separate labels for published snapshots and saved,
unpublished edits. Private notes never enter history, hashes or edited events.

History, listing updates and content-free edited events commit together. There
are at most 100 snapshots per listing and 20 public-field owner edits per hour;
limit failures roll back the attempted listing change. Unpublish/archive remain
available at the history limit. A canonical backup-key callback prevents duplicate
logical history revisions under different record IDs; restore checks it before
and after normalization. History is included in the encrypted alpha backup with
hash and owner validation. Other registered backup scopes remain compatible.

This is an alpha history slice, not the complete F01.S01.M02 contract. It uses
compound local storage IDs instead of canonical revision UUIDs; existing alpha
command input/output shapes remain. Published editing is disabled pending policy
and offer reconfirmation wiring. Sell-term/variant sibling ports, buyer notices,
canonical signed hash binding, full evidence retention/purge and historical
backfill remain unfinished. Declared value changes are marked material in the
alpha; separate sell-term pricing is not implemented. A local snapshot is owner
asserted evidence, not proof of peer acceptance or real-world handover.

Full local verification passed 511/511 domain/integration tests on the serial
retry. The first run passed 510/511 with an unchanged currency benchmark failure
(0.06595 ms against 0.05 ms); its isolated 23-test suite and the full retry passed
without changing assertions or thresholds. GitHub Alpha verification 43914550908
passed on `3f814c0`, including its browser journeys. CLI platform verification
43914550773 remains a separate merge gate. Focused verification passed 21
listing/vault tests, including history privacy,
owner authorization, pagination, rate/cap rollback, corrupt-read rejection and
canonical-key restore failures. Review found and fixed publication-status labels,
missing read-side hash checks and post-normalization backup-key validation; final
review reported no additional high-confidence defects. The generated inventory now reports 31/148 runtime modules, 10/688 exact
specified interfaces and 442/4510 requirements with passing mapped tests. These
counts are traceability measures, not a completion percentage.

## November 16, 2026 encrypted persistence continuation

Consolidation PR #37 at `a189787` passed Alpha verification run 43889531898 and
CLI setup run 43889532000, and merged into `main` at `3fd5fdb`. These checks apply
to that predecessor, not to the encrypted-storage implementation below.

The new candidate adds production vault domain encryption: AES-GCM row payloads,
HKDF-separated encryption/address keys, opaque HMAC row addresses, and an encrypted
inventory that rejects partial row deletion or ciphertext replacement. Identity
headers carry an authenticated format marker inside a sealed v2 wrapper. Legacy
plaintext migration follows identity verification and replaces rows and their
keys atomically with the wrapped identity/key header/inventory. New creates and
restores commit those components together. The low-level kernel IndexedDB adapter
remains a general unencrypted adapter; production `openVault` adds protection.

The implementation preserves the synchronous decrypted working-set API, per-vault
writer lock/fence, rollback on persistence/encryption failures, backup codecs and
post-unlock retention. No cryptography dependency was added. Existing alpha record
backups remain supported; older app versions cannot read the upgraded on-disk
identity. Table names/counts/lengths and identity timestamps remain visible. Whole
store rollback, historical plaintext copies, physical erasure, key rotation and
complete recovery are not solved by authenticated row encryption.

Local verification: 504/504 domain and integration tests passed, including 11
storage protection regressions; 32/32 CLI/tooling tests passed. Typecheck, production
build, setup/doctor, dependency checks, whitespace checks and strict specifications
passed (148 modules, zero errors/warnings). A new browser journey inspects raw
IndexedDB keys and contents, then verifies lock/unlock recovery. Local execution
could not launch because the pinned Chromium executable is absent. Candidate CI
must qualify all browser engines before merge; predecessor CI is not reused as
new-feature evidence. Review found and corrected raw-key disclosure, a missing-header
downgrade path and silent partial-row deletion; the follow-up review reported no
additional high-confidence defects.
This is a scoped storage improvement; the project remains an alpha with the other
unfinished workflows below. Historical status entries describe their own heads.

## November 16, 2026 inbox, import and editor continuation

Continues PR #37 from `ca26646` without merging or deleting historical branches. The PWA now exposes a local inbox, unread/all pagination, individual/bulk read actions, barter preferences, encrypted-backup codecs, and 30-day retention on unlock/activity. Newly accepted signed barter evidence emits a content-free event with verified participant and author identifiers. Duplicate files, rejected signatures, self-actions and session-blocked peers do not create new alerts. Alerts describe local evidence acceptance, not completed settlement. Other notification channels and quiet hours remain unfinished.

The browser rerun exposed a separate application defect: a second file selection during a pending action was silently ignored. Actions now run in order, import handlers capture each selected file immediately, and queued UI callbacks are rejected after their vault is destroyed. Failed unlock attempts clear the passphrase field. Notification failures never undo an already saved domain operation; Refresh retries due delivery, and retry/dead-letter state remains visible across quiet outbox passes.

The PWA now edits draft and unpublished listings through the existing revision-checked command. It preserves exact minor-unit prices, currency, tags and locale; private notes stay out of signed files. Valid drafts without optional location/value/condition are editable without adding those fields. Cancel and lock clear the editor. All queued workspace actions are bound to their original unlocked session. Published listing editing, immutable revision history, material-change notices and the full canonical F01.S01.M02 contract remain unfinished.

Verification: the latest full local domain/integration run passed 493/493 tests, including the unchanged discovery performance threshold. Typecheck, build, 32 CLI/tooling tests, strict specifications (148 modules, zero errors/warnings), and dependency checks pass. At `c4656a6`, GitHub domain checks passed and 30/33 browser journeys passed; all three failures were the same exact-label lookup for the notification dropdown. Its label is now explicitly associated without including option text. GitHub Alpha verification run 43887686293 at `28a6345` then passed, including all 36 browser journeys in Chromium, Firefox and WebKit. This verifies the label fix and listing editor; the later vault-entry changes require their own final-head checks. CLI platform jobs for that predecessor remained queued. No rerun of an unchanged failing head is represented as a fix.

A follow-up closes two vault-entry races: restoring into a vault whose writer is already held now clears the restore passphrase/file, and duplicate queued create/unlock/restore attempts cannot replace or tear down an active session. Restore inputs are captured when submitted. Focused vault/queue tests (5), typecheck and build pass; the browser suite now contains 39 cases including duplicate submission and failed restore acquisition.

Generated inventory: 31/148 module paths contain runtime/compatibility code, 8/688 exact specified interfaces are found, and 442/4510 requirements have passing mapped tests. The additional module path is the separate compatibility diagnostic; this is not a new completed product module.

The original WebKit vault-creation failure remains under investigation. The pinned browser has an upstream Ed25519 fixed-width encoding defect, but the failing operation from that original run was not captured. Separate diagnostics in [WEBKIT_CRYPTO_DIAGNOSTIC_20261116.md](WEBKIT_CRYPTO_DIAGNOSTIC_20261116.md) preserve this distinction. Native cryptography and acceptance tests are unchanged; no browser result is claimed from the local host, which cannot create Chromium's required socket.

This remains an alpha with the substantial feature and security gaps listed below. No full-project completion claim is made.

## November 16, 2026 continuation

Work continues on `codex/classrup-completion-20261116` and PR #37, from the reviewed runnable `d16abee` baseline. This remains a development alpha, not a completed implementation or production release.

### Integrated functionality

- Consolidated reviewed coarse location/filter, governance taxonomy/prohibited goods, moderation rate/limits/signals, privacy classification/metadata, local notification/preferences, and change-aware CI branches.
- Wired supported retained-listing filters and bundled ranking through the public query and accessible PWA Apply/Reset controls. Coarse-radius results indicate regional overlap, not exact distance. Search fields clear on lock.
- Added local notification bus composition and encrypted-backup codecs. External notification delivery remains unconfigured; real PWA notification routing needs verified participant/actor event adapters and inbox UI.
- Preserved current main security reports, the 51-finding planning tracker, and newer planning contracts without replacing implemented contracts with draft specifications.
- Resolved all 33 duplicate-error specification warnings using canonical ownership and direct dependencies. No requirement was marked implemented by this cleanup.

### Fixed defects and regression coverage

1. Older supported vault backups now restore after new module codecs are registered; unknown scopes/records remain rejected.
2. Barter evidence saturation cannot consume the slot required for authenticated terminal withdrawal and inventory-hold release.
3. Bazaar signer callbacks must return the requested sequence and previous CID before records/events change.
4. Rate-limit telemetry failures cannot turn a denied request into fail-open permission; backward wall-clock recovery cannot grant duplicate refill.
5. Imported rate policies are validated and copied rather than retaining caller-mutable state.
6. Notification grants reject future-dated issuance; relay withdrawal binds the stored user/channel; revocation bypasses daily change limits and paginates beyond 500 historical records.
7. PNG sanitation rejects malformed critical chunk structure instead of marking nonempty IEND/duplicate IHDR clean.
8. Storage rejects transactions queued behind close, with regressions for both memory and IndexedDB while preserving work queued before closure.
9. Category expansion enforces its bound across roots; out-of-range date cutoffs return validation failures.

### Verification of this continuation

- Combined domain/integration suite: 479 passed, zero failed/skipped. The subsequently added storage-close regression and latest rate regressions passed in a 28-test targeted run.
- Final TypeScript check passed with `GOMEMLIMIT=512MiB GOMAXPROCS=2 pnpm typecheck --singleThreaded`. Default concurrent native compiler attempts exceeded host resources; they are not recorded as passes.
- CLI: 18 passed. Tooling: 14 passed with Node test concurrency limited to one after a resource-failed concurrent attempt.
- Production build, setup/doctor, dependency check, whitespace checks and strict specifications pass. Specifications: 148/148, zero errors and zero warnings.
- Generated source/test mapping: 30/148 modules with runtime code and 442/4510 requirements with mapped passing tests. These are inventory/traceability counts, not product completion percentages.
- Browser and cross-platform execution remains unverified for this candidate. GitHub checks were queued/pending when recorded; only the actual final-head results can qualify merging.

### Release limits

The repository still has substantial missing runtime features: purchase offers/negotiation, settlement evidence/receipts, private messaging, identity/device recovery, encrypted domain storage, canonical federation/relay delivery, and major services/auctions/rentals workflows. The audit notes are not all resolved. See `docs/status/SECURITY_REVIEW_20261116.md` for branch dispositions and scope. No full-project completion percentage or comprehensive security certification is claimed.

Local browser execution is blocked: the pinned Chromium download returned an invalid archive; installed Chromium cannot create its required socket under this host. Browser assertions were added, but are not reported as passing. GitHub browser/platform checks must qualify the final remote head before merging or release. No historical branches were deleted.


## November 12, 2026 continuation

This candidate combines the parked ranking and i18n work from PR [#27](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/27) at `de8f44d` and [#28](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/28) at `a0f9422`. Both descend from the consolidation at `75d4bf5`. Its [alpha checks](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42935421212) and [six CLI jobs](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/42935421115) passed.

- Local and imported listing cards now show their declared CAD value in the viewer’s locale. Signed listings in currencies with an unknown exponent show their currency code and exact minor units.
- Discovery exposes the reviewed ranking functions. New-seller slot placement preserves relevance order. Paid listings retain their labels and the seller cap relaxes only when one seller remains. A vault reads its own bundled configuration. Relay publication and rollback use the production signer.
- The i18n package exposes exact currency formatting, locale-aware input parsing and catalog-backed translation. The PWA still uses its existing English interface. On older Intl engines, fractional names that cannot be determined reliably use the currency code.
- The combined tree passed 263 domain and integration tests, 18 CLI tests, eight tooling tests, type checking, dependency checks, setup, doctor and the production build. Specification validation reports 148 modules, zero errors and 33 existing warnings. The [generated status](FEATURE_STATUS.md) uses the passing test report.
- Next, review the coarse-location and filter modules in [#26](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/26) before connecting ranking to retained-listing search. Reconcile the newer requirements on [#8](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/8) at `a403614` separately. Other parked work is listed in [the handoff](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/34).

## November 11 consolidation baseline

The following record describes the earlier integration head `75d4bf5`.

### Release readiness

**Development alpha. Not release-ready.** The branch builds, passes its automated checks and runs
the local journeys below, but it implements a small part of the specification and has open
confidentiality limits (see Release blockers).

### Completion against the specification

Generated by `pnpm run status` into [FEATURE_STATUS.md](FEATURE_STATUS.md):

| Measure | Value | Meaning |
|---|---|---|
| Modules with runtime code | 14 / 148 | Module has command, query or subscriber definitions, or its catalog code path exists |
| Specified commands and queries present | 5 / 688 | Names from `module.spec.yaml` that exist in non-test source |
| Requirements with a passing mapped test | 99 / 4510 | Requirement has a `TEST-PS-…` test that passed in this run |

The alpha uses its own command names and experimental statement types for several flows, so
working behaviour (listings, signed file exchange, barter coordination) is larger than the middle
row suggests, and smaller than a finished feature. The three fully traced modules are the kernel
bus, storage and observability.

### Verification of the baseline

Linux, Node 22.23.4, pnpm 10.28.0, run locally on the tree that was pushed:

| Check | Result |
|---|---|
| `corepack pnpm install --frozen-lockfile` | Passed, lockfile unchanged |
| `corepack pnpm typecheck` | Passed |
| `corepack pnpm spec:check` | 148/148 modules specified, 0 errors, 33 warnings (unresolved) |
| `corepack pnpm deps:check` | 0 errors |
| `corepack pnpm test` | 168 passed, 0 failed, 0 skipped (69 files) |
| `corepack pnpm run test:cli` | 18 passed, 0 failed, 0 skipped |
| `corepack pnpm run test:tooling` | 8 passed, 0 failed, 0 skipped |
| `corepack pnpm run setup --non-interactive`, `doctor`, `build` | Passed |
| `playwright test --project=chromium` | 10 passed (2-, 3- and 4-party barter, backup restore, tab exclusion, mobile layout, no-script guard) |
| Firefox, WebKit, Windows, macOS | Not run locally; covered only by GitHub Actions on the pushed head |

## Lanes

| Lane | Branch namespace | Scope |
|---|---|---|
| Integration (this branch) | `integration/classrup-completion`, `agents/*` | Consolidation, new domain modules, product workflows, status |
| ChatGPT zero-Codex | `chatgpt/zero-codex/*` | One test-first slice per hour, stacked on the alpha head |
| Sibling Claude session | `claude/difficult-project-parts-dcqlup` | Foundation slices (federation, identity, vault, money) |

Branch and pull-request disposition: [BRANCH_LEDGER.md](BRANCH_LEDGER.md).

### Review findings in the baseline

Seven stacked fixes (PRs #16, #17, #19–#23) were read line by line before merging. No defect was
found in them. Two observations, neither blocking:

- The symlink tests skip on runners that cannot create symbolic links; a skip is not a pass.
- The log sanitizer replaces any message that is not a dotted event identifier with `[redacted]`.
  Callers must pass event identifiers, not prose.

### Release blockers recorded at the baseline

1. Local domain records are stored unencrypted in IndexedDB; only signing keys and backups are encrypted.
2. No purchase-offer, deal, receipt, messaging, moderation or notification runtime exists.
3. Device rotation, revocation and recovery, canonical federation streams and relay delivery are not implemented.
4. 33 specification warnings are unresolved.
5. No manual assistive-technology review has been done.
6. Firefox, WebKit, Windows and macOS evidence exists only from CI, and only for the heads CI ran.

### Resuming the baseline

```sh
git switch integration/classrup-completion
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck && corepack pnpm spec:check && corepack pnpm deps:check
corepack pnpm test --reporter=json --outputFile=test-results/domain.json
corepack pnpm run status --results test-results/domain.json --write
corepack pnpm run test:cli && corepack pnpm run test:tooling
corepack pnpm run test:browser
```

Run `status` before the browser tests: Playwright clears `test-results/`.
