# Project status

## November 18, 2026 public-record CLI continuation

The F1a command `node tools/cli/classrup.mjs record verify --file FILE [--json]`
verifies existing signed public listing and withdrawal files. The CLI and PWA
share strict payload, author-binding and expiry checks. The command reads one
bounded regular file, returns fixed redacted errors and creates no private keys,
vaults or persistent records. JSON success and failure results use stdout; human
errors use stderr. The [CLI guide](../CLI_SETUP.md#verify-a-public-signed-file)
defines the exact output and exit contracts.

Standalone verification leaves chain history and revocation unchecked. It does
not establish current ownership, trusted identity or vault admission. Listing
search, encrypted file-vault workflows and full UI/CLI parity remain unfinished.
Independent review found and repaired mixed-separator Windows UNC-path handling
before publication and exercised twelve additional adversarial probes.

This continuation also retains the compatible test improvements from
[PR #51](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/51): strict
Base64url regression coverage, shared DOM test support, enforced CI symlink
checks and accurate test-discovery paths. Its original source remains an
ancestor of the combined candidate. Qualification belongs to that combined
candidate's actual tests and CI; the historical main results below are not
reused as proof of these new changes. The POSIX FIFO/device CLI test does not
apply on Windows and is explicitly reported as skipped there.

The project remains a development alpha. Draft #8's remaining incompatible
runtime work, wider product workflows and previously recorded release/security
evidence requirements remain open.

## November 17–18, 2026 exhaustive consolidation

Runtime main is `5a502aa9ebccb3de9cf78332e9ae6335ed6b6a54`, merged through
[PR #48](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/48) from
`e331e56165304c98a1c2bdd26692772b586e499d`. **Post-merge main verification passed:**
the two first-attempt push workflows completed successfully by
**2026-11-18 13:20:58 UTC**. The continuation re-read their actual jobs and decoded
logs, independently of the earlier PR runs, before the **13:55:41 UTC** checkpoint.
Earlier queued observations remain preserved as historical evidence.

| Evidence | Observed result |
|---|---|
| Exact-source PR [Alpha 44271649063](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44271649063) | Completed successfully: **695 domain assertions, 27 tooling tests and 72 browser journeys**; includes six new native-generation recovery cases across Chromium, Firefox and WebKit |
| Exact-source PR [CLI 44271649100](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44271649100) | All **six** Ubuntu/Windows/macOS × Node 22.18.0/24.x jobs passed, including real development/production browser smoke |
| Main [Alpha 44275307064](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44275307064) | Completed successfully on the exact runtime merge: **695 domain assertions, 27 tooling tests and all 72 Chromium/Firefox/WebKit journeys**, with zero failed/pending/skipped domain assertions |
| Main [CLI 44275307098](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44275307098) | All **six** Ubuntu/Windows/macOS × Node 22.18.0/24.x jobs passed on the exact runtime merge; each executed 18 CLI tests without skips and passed development/production browser smoke |

The [completed PR qualification record](../reviews/20261117-exhaustive-consolidation/pr48-qualification.json)
pins the actual PR jobs, source and log digests. The new
[completed main qualification record](../reviews/20261117-exhaustive-consolidation/main-qualification-20261118.json)
pins main's own run/job identities, executed counts and decoded-log digests. The
[main CI queue checkpoint](../reviews/20261117-exhaustive-consolidation/main-ci-queue-checkpoint.json)
retains the earlier pending-state observations unchanged; those observations do
not describe the later completed runs.

The registry supplies deterministic generation, immutable metadata and four
opt-in read-only query definitions for 18 features, 148 modules and 565 dependency
edges. Catalog defaults do not establish runtime implementation or enable user
features. PWA controls, runtime flag adapters, relay mounting, backup diagnostics,
unknown-module quarantine and target-device qualification remain incomplete.

The first candidate failed one of 66 browser journeys at native generation. Raw
native diagnostics then failed seven of 512 generation trials and rejected
canonical leading-zero/all-zero private-key imports. The merged helper allows
at most three native generation calls, retrying only genuine `DOMException`
values named `OperationError`, before export or persistence. It does not retry
existing-key import or repair the deterministic native import defect. Local
bounded regressions passed 23 identity and three vault tests. The
[native evidence review](../reviews/20261117-exhaustive-consolidation/native-keygen-review.md)
preserves both failed probes and the mitigation's compatibility limits.

[PR #50](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/50) independently
merged the audit and adapted future CLI specification at
`aca990e480a4ed586c1af5cf95a205e5adbfd84b`. Draft #49 was closed as superseded after
its contribution was compared and preserved. Domain CLI commands remain planned.
The current audit/status continuation is the actual
[draft PR #52](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/52), observed
at `78a88d8276e67e7a07cd32e34cbe2a59eb01f2c1` before this continuation. Its pending
main-verification prerequisite is satisfied. This update supplies the completed
evidence for final documentation review; it does not pre-claim its own merge.

The remote re-read completed before **2026-11-18 13:55:41 UTC** still contains
**57 branches and 52 PRs**:
the original 52 branches, four branches created by this consolidation and one
concurrent branch. All 51 original non-main heads retain their starting SHAs.
The [original 52-branch / 47-PR inventory](BRANCH_CONSOLIDATION_20261117.md) stays
separate from the [later branch dispositions](CONSOLIDATION_BRANCH_DISPOSITIONS_20261118.md).
The open PRs at this checkpoint are drafts **#8, #51 and #52**. Draft #51 at
`7b729df38dddf59c4e60e245bdf1ca43546b1e7b` is compatible concurrent test/tooling work
preserved for its own qualification, outside the runtime integrated through #48;
see its [source review](../reviews/20261117-exhaustive-consolidation/concurrent-pr51-review.md).
Draft #8 retains its unported work, including incomplete Tenants/LocalSettings
configuration and a missing `./text.ts` dependency. Its
[cleanup comment](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/8#issuecomment-6975235188)
has been posted; the draft remains open.

Local limitations remain: the bounded baseline combined report had 624 passing
assertions and eight unfinished assertions, all eight subsequently passing in
the isolated 19-test security retry. A later candidate combined run was
host-killed. Two mitigation-worktree installation attempts also exited 137;
focused checks used unchanged copied dependencies with verified workspace links.
Hosted qualification performed fresh frozen installs. No complete green candidate
local combined-suite result is claimed; see the
[execution record](CONSOLIDATION_EXECUTION_20261117.md) for exact commands and scope.

One pre-existing high Picomatch advisory remains in the Vitest toolchain and the
dependency audit exits 1. Zero affected tooling packages among 201 examined
production bundle inputs is bounded exposure evidence, not remediation. The
product remains an incomplete development alpha. The 51 historical planning/readiness
findings, native-import compatibility, manual accessibility and target-device
qualification remain open. The dated sections below retain their own source
snapshots; their counts and pending states are not current status summaries.

## November 17, 2026 PR consolidation

The runnable main now includes [PR #43](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/43), merged as `2b3193148029a4af64e8f3fe68373b6ca55620f9`. Consecutive queued location saves use the revision committed by the preceding save while preserving each submitted edit.

The complete [25-PR consolidation review](PR_CONSOLIDATION_20261117.md) records **24 resolved original PRs and one remaining draft (#8)**, source ancestry, content-equivalent integrations, preserved historical proposals and current wiki guides. The documentation consolidation is merged through #46 at `0a467556436cf2f4ad154fe3694e3d158458b83c`. PR #8's later partial runtime fails independent qualification and remains separate. PR #45 is also merged at `03145774e5865fd7eac6ff6c4751a25ce6aa9422`, preserving visible keyboard-focus coverage from the old mock framework. Its corrected source passed [all 66 Chromium/Firefox/WebKit journeys](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44227269816) and [both Linux Node 22/24 CLI jobs](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44227269875).

The #43 runtime passed **632/632 domain/integration tests** locally, TypeScript, dependency boundaries and strict specification validation (148/148 modules, zero errors/warnings). [Exact-source Alpha CI](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43981540981) passed **63 browser journeys**; [CLI CI](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43981539765) passed all six Windows/macOS/Linux Node 22/24 jobs. The documentation merge preserves that runtime tree. Details and source digests are in the [validation record](PR_CONSOLIDATION_20261117.json).

This remains an incomplete development alpha. The dated implementation records below describe their own snapshots; consolidation does not close the existing security matrix, manual accessibility, target-device or whole-release gates.

## November 16, 2026 second parallel implementation wave

PR #42 now also includes encrypted coarse-location preferences, cancellable
background barter matching with offline assets, and an opt-in currency registry.
Each implementation team supplied a handoff and transferred ownership to a fresh
reviewer. Review fixed stale location precision copying, GPS supersession,
concurrent-save draft loss, foreign-vault currency imports, unsupported-chain
activation, cancellation feedback and encoding batches for large statements.

The location workflow is composed in the PWA with real commands and backup
codecs. Worker discovery and proposal revalidation use the unchanged signed
admission/matching contracts. The currency registry remains unmounted pending
authentic signed release data, canonical vault/usage adapters and encrypted
backup integration; its tested import validator alone is not a complete recovery
workflow. No payment, precise sharing or private messaging workflow is claimed.

Focused review suites passed: location 16, currency plus money 27, and worker
plus matching/admission 24. Shared bounded typecheck, build, doctor, strict
specifications, dependencies, tooling, independent money vectors and bundle
budget passed. At final source `bdd2971c675d996a6a8e38b8a36362b549790274`, the combined
local run completed 630/631. Its only failure was the unchanged filter-validation
timing check (2.332 ms versus its 1 ms limit); the same filter suite passed alone
without changing that limit. This is passing execution across runs, not one green
local full-suite result. GitHub [Alpha run 43962230354](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43962230354)
passed the combined domain step and all **63 Chromium/Firefox/WebKit journeys**.
All six Linux/Windows/macOS Node 22/24 jobs passed in
[platform run 43962230320](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43962230320).
The qualified source is `bdd2971`; later documentation-only commits preserve
that exact runtime/tooling/test tree. The generated inventory is 35/148 runtime paths,
15/688 statically recognized interfaces and 484/4510 passing mapped requirements.
Module constants are not resolved by the conservative interface scanner, so those
counts understate interfaces such as the new location and currency operations.
They are not feature-completion percentages. See the machine-readable validation
summary for report digests. The [security evidence matrix](SECURITY_EVIDENCE_20261116_PARALLEL.md)
maps all 51 historical findings to current controls and remaining closure evidence;
all remain open. The product and full release qualification remain incomplete.
Previous-wave checks below qualify only their named candidates.

## November 16, 2026 parallel completion checkpoint

Draft [PR #42](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/42) continues
PR #41. The tested source candidate is `36428ccc8a1ccf365418748abd7cc6ee2dc2bfb3`.
Implementation teams handed their checkpoints to fresh reviewers; the combined
[handoff](../handoffs/20261116-parallel-integration.md) records each result and
remaining dependency. This remains an incomplete development alpha.

Owners can close listings with a reason, automatically expire/archive them while
the vault is unlocked, and download verified publication/withdrawal evidence
again after reopening. Maintenance is bounded and resumable, creates no automatic
downloads and stops on lock. Existing owner recovery and encrypted backup paths
are retained. Complete purge and cross-domain evidence retention remain open.

Vault sessions now default to a 15-minute idle lock (session setting 1–60) and a
five-minute hidden-tab lock. Local unlock backoff survives reconnects within one
page. Fixed cryptographic stage errors expose no native details and perform no
retry. Independent review corrected stale asynchronous exports, suppressed close
failures, private DOM left after failed startup, and overlapping closure promises.
These controls do not implement delegated-device recovery or fix upstream WebKit.

Money now has exact pure bigint arithmetic/conversion/allocation, 331 independent
Python vectors, 40,000 property cases and a 2,355-byte gzip browser bundle. The
existing alpha wire schema is not migrated. The opt-in consent core binds
participants, revision hashes and wording, retains conflicts and supports
monotonic revocation; fresh review fixed withdrawal-capacity exhaustion and
first-seen key validity during replay. Consent remains disabled in the PWA until
domain adapters, confirmation UI, backup validation and quarantine exist.
Existing notifications additionally enforce signer-chain and mirror-sequence
bindings.

Local validation: typecheck, build, setup/doctor, dependencies, whitespace,
32 CLI/tooling tests and strict specifications (148 modules, zero errors/warnings)
pass. The first combined attempt reported 585/589 passed with a now-fixed export
allowlist error, two timeouts and a currency performance failure. It was interrupted
during prolonged runner shutdown. The visible serial retry completed 588/589 with
only the unchanged 60-second barter saturation timeout. That exact test then
passed alone in 50.296 seconds, without changing its threshold. All 589 distinct
assertions have passing local execution across those runs; there is no single
green final local full-suite claim. Failures are preserved in the
[validation summary](20261116-parallel-validation.json).

GitHub [Alpha verification](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43957906791)
at `36428cc` passed its combined domain test step and preceding checks; browser
journeys reported 51 passed and six failures: the lifecycle test used an unsupported
month-long timer jump, and the older history test opened the new closure panel.
Both test harness defects were repaired in `7bf7d51` with all assertions/limits
retained; [its Alpha rerun](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43959971234)
passed all 57 browser journeys and the combined domain step. All six platform
jobs also passed on that repaired candidate. All six Linux/Windows/macOS Node
22/24 [platform jobs](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43957906779)
passed on that same candidate. Local Chromium is blocked before assertions by
the host's required-socket denial; 57 browser definitions loading is not a pass.

The generated inventory is now 33/148 module paths, 15/688 exact interfaces and
464/4510 requirements with mapped passing tests from the local serial report.
These measure traceability, not feature completion. Money's unchanged 2 ms
allocation p99 budget and specified Android hardware remain unqualified. Offers,
Deals/payment claims/receipts, private messaging, full recovery/federation,
services/rentals/auctions, full privacy lifecycle, accessibility and other
requirements in the audit remain incomplete. No merge, release or deployment
was performed.

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

Verification: 24 listing/discovery tests and 3 production archive-backup tests
passed; 32 CLI/tooling tests passed. Review reproduced and fixed a real-clock
deadline race and rejection of duplicate active archive evidence. Typecheck with
`GOMEMLIMIT=256MiB GOMAXPROCS=2 --singleThreaded`, build, setup/doctor, dependency
checks and strict specifications (148 modules, zero errors/warnings) pass. An
uncapped compiler attempt was host-killed before the bounded passing check.

The first full domain run was host-killed (exit 137). A memory-bounded fork-pool
retry then passed 520/520 tests on the earlier implementation. After the final
two review fixes, the full retry completed 519 of 522 assertions with no failed
assertions; the fork runner emitted an internal incomplete-report warning and
exited 1 with three Mutiny saturation/rollback/tombstone tests pending. The same
file failed to finish under an isolated fork retry, then passed all 16 assertions
under the normal thread pool with the unchanged 60-second saturation-test limit
(the saturation test took 30.1 seconds). All 522 unique assertions therefore have
passing execution evidence across the final full run and the isolated file retry;
there is no claim of a single all-green final full-suite run. The earlier full
report and incomplete final report are distinguished rather than rewritten.

Two browser journeys cover signed archive/backup/recovery and pagination beyond
50 listings. Playwright loads their definitions, but local execution fails before
any assertion because the pinned Chromium executable is unavailable; its download
returned corrupt archives. Final-head CI must qualify these workflows before
merge. Earlier candidate heads passed Linux CLI smoke on Node 22/24; their Alpha
browser checks do not qualify the later clock/duplicate-record fixes. Predecessor
PR #39's Alpha workflow passed, but its CLI matrix still has unresolved macOS jobs.
No merge or full-project completion is claimed. Generated inventory: 31/148 runtime
module paths, 13/688 exact specified interfaces, 442/4510 requirements with passing
mapped tests; these are traceability counts rather than completion percentages.

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
