# Independent integration evidence review — G6

## Result and source

The raw reports support **127 passed across exactly 21 selected test files**.
No failed, skipped, pending, todo or other assertion status was found. All
selected files appeared once, with no missing, duplicate or unexpected file.
The six additional qualification checks have successful receipts. No evidence
inconsistency was identified.

| Identity | Verified value |
|---|---|
| Receipt-declared and reviewed source | `796c16520365c57562c1328a73d313f3fa614ae4` |
| Receipt-declared and reviewed tree | `07a135e30d47c5284d120d4dad76f648c26e8444` |
| Published parent | `25b4708191f04516cab74371c84a15663cc6f6a6` |
| Raw evidence root | `/workspace/scratch/e0ea2385d962/classrup-validation/` |
| Archived evidence | `evidence/` beside this review |

I independently parsed each raw JSON report's `testResults` and
`assertionResults`, rather than accepting the summary total. Reported file
paths were compared with the explicit `.test.ts` arguments of each receipt's
command, each receipt's file list and the selected manifest in `summary.json`.
The reports' top-level totals and success flags agree with the recount. All
ten integrated receipts agree on source/tree and exit zero. Their recorded
log byte counts and SHA-256 digests match the actual logs; all four report
digests also match. The current checkout still has the reviewed commit/tree,
and its tracked source, tests and dependency manifests have no diff from it.

This lane inspected evidence and current source identities. It did not rerun
the compiler, tests or build, and did not change the original correctness
review, production files or tests.

## Independent recount and complete selected file union

| Group | Files | Passed | Recorded process seconds |
|---|---:|---:|---:|
| New acceptance | 2 | 8 | 20.923 |
| Mutiny regression | 6 | 56 | 32.484 |
| Notification regression | 6 | 50 | 12.538 |
| Recovery regression | 7 | 13 | 56.861 |
| Total | 21 | 127 | 122.806 |

| Selected file | Passed |
|---|---:|
| `packages/mutiny/src/cycle_matching/admission.test.ts` | 5 |
| `packages/mutiny/src/cycle_matching/matching.test.ts` | 8 |
| `packages/notify/src/delivery/inapp/inapp.test.ts` | 12 |
| `packages/notify/src/preferences/in/in.test.ts` | 12 |
| `packages/notify/src/preferences/opt/opt.test.ts` | 17 |
| `tests/integration/archive-backup.test.ts` | 4 |
| `tests/integration/backup-coverage.test.ts` | 2 |
| `tests/integration/barter-want-intent.test.ts` | 4 |
| `tests/integration/matching-worker.test.ts` | 11 |
| `tests/integration/mixed-production-backup.test.ts` | 1 |
| `tests/integration/mutiny-oracle.test.ts` | 12 |
| `tests/integration/mutiny-persistence.test.ts` | 16 |
| `tests/integration/notification-delivery.test.ts` | 2 |
| `tests/integration/notification-lifecycle.test.ts` | 4 |
| `tests/integration/privacy-notify.test.ts` | 3 |
| `tests/integration/production-barter-recovery.test.ts` | 7 |
| `tests/integration/production-codec-compatibility.test.ts` | 3 |
| `tests/integration/production-notification-recovery.test.ts` | 1 |
| `tests/integration/production-recovery-readers.test.ts` | 1 |
| `tests/integration/publication-backup.test.ts` | 1 |
| `tests/integration/retained-backup.test.ts` | 1 |

All four invocations record isolated fork workers, one worker, disabled file
parallelism and `NODE_OPTIONS=--max-old-space-size=1024`. The listed process
durations are receipt values, not independent timing measurements.

### All eight integrated test log/report digests

Paths below are in `g6-integrated-recovery/`. These are hashes of the original
bytes; the archived `.gz` files decompress to those same bytes.

| File | Verified SHA-256 |
|---|---|
| `new-acceptance.log` | `6cdbafa28ebbbdf7d1f0b4e5ad093d1b26c90ecfcf81015fd085c6cdb1a7a275` |
| `new-acceptance.json` | `5fa131f82366336ed9b0a23b740e02890261457227f14a19d9ae9b69e9ad8e53` |
| `mutiny-regression.log` | `d1a90233073a3b45706426f577da100d7f1c86839e708b0cea73d6669efd9216` |
| `mutiny-regression.json` | `8bcc280fbe21b186f629fba4445bf211430379e95ec3fa894c33a53003de3d4a` |
| `notification-regression.log` | `c83d810e5b665fabff1f935a1b394d5cd1095cbdc1b0ca751cf68feb4aebf770` |
| `notification-regression.json` | `10b81b325a2a3a340cda6da84d48d6e63eb58be6e53cd36639409a8e12ab8534` |
| `recovery-regression.log` | `029ded3e8368d1fd174a65c52fd46f83dc34a1afbb8f97c601b387f9bc7b8d7d` |
| `recovery-regression.json` | `24331ec9c1eb24befbecb70723626335e615e7e65784828fb14110524fc0e6e9` |

## Additional integrated checks

| Check | Receipt result | Log observation |
|---|---|---|
| Full project TypeScript, `tsc -p tsconfig.json --noEmit` | Exit 0, 2.388 s | Empty log |
| Specification check | Exit 0, 1.021 s | 148/148 modules; zero errors and warnings |
| Dependency boundaries | Exit 0, 0.498 s | Zero errors |
| Strict feature registry check | Exit 0, 1.202 s | Up to date; acyclic; zero missing specs |
| Noninteractive setup | Exit 0, 0.115 s | Setup completed |
| Build | Exit 0, 0.265 s | `dist/` built |

All six log hashes match their receipts and the archive manifest. This is
local compilation/setup/build evidence; it is not deployment or browser
execution evidence.

## Worker-source execution and preserved notification retry

| Lane | Declared source | Independently recounted or inspected result |
|---|---|---|
| `g5-barter` | `355ea87578d25c2b7278290f0ced5dedde142bdb` | Compiler exit 0; seven passed, one test file; no other assertion status |
| `g5-notifications` | `61c0e5eeaafe2361d100b4eddb2c9a970d48a18f` | Initial compiler exit 1; 31 diagnostic lines |
| `g5-notifications-attempt2` | `61c0e5eeaafe2361d100b4eddb2c9a970d48a18f` | Compiler exit 0; one passed, one test file; no other assertion status |

All five worker log digests match their receipts. The successful test reports
match their selected command filenames and top-level totals. Their raw report
hashes were computed independently and match the archive's original-byte
digests:

| Worker evidence | Verified SHA-256 |
|---|---|
| Initial notification `typecheck.log` | `b4b85008adf81f2d7a2e131a94fa2259447c57f8c66a4f80c8f9b50a1fd66d67` |
| Successful worker `typecheck.log` (both empty) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Barter `barter-recovery.log` | `0078dce7c4677699b759c2e7452d49ecbbe27ae5013a22edf1879bd5e02c4921` |
| Barter `barter-recovery.json` | `4637ab8e1c8877a4499815dc21138293ab390056369074ccb47aff37ed756c99` |
| Notification retry `notification-recovery.log` | `b900d097c348f5a2381fa8a6a7da9c2cdf4ba932af357597d6b158c8503fa607` |
| Notification retry `notification-recovery.json` | `cf3c7643bffa5ea2d67d2658f496f0ed0961a3d2ebd675ac86cecdcb1c97c69d` |

The initial 48,266-byte failure log explicitly resolves `CommandContext`
through both `ClassRup-notification-recovery/packages/kernel/` and
`ClassRup/packages/kernel/`, producing incompatible branded `Id` types. The
retry receipt records replacement of cross-worktree dependency links with a
pinned offline installation. Both attempts declare the same source commit.
Current worker HEADs match those receipts, their tracked source/test/manifests
have no diff, both package manifests pin `pnpm@10.28.0`, and the inspected
Mutiny kernel dependency now resolves within its own worker checkout.

The retained evidence supports an environment setup retry on unchanged
source, not a source fix or an initially clean compiler run. The initial
failure remains a failed attempt. Worker test passes overlap the eight new
integrated cases and must not be added to 127 as distinct coverage.

## Archive integrity and limits

`evidence/archive-receipt.json` lists exactly 37 archived entries: two for the
initial notification attempt, five for its retry, five for barter and 25 for
the integrated qualification. I checked every stored-byte size/hash and every
original-byte size/hash. All 21 gzip entries decompress exactly to the raw
originals; the remaining 16 files match directly. The archive and raw lane
inventories have no missing or extra file relative to the manifest. The
manifest's own SHA-256 is
`cc79be40814d6fcb28147e78f1f302e885d5a864361162374c3db0309b876d45`.

This establishes a complete pass for the **selected 127 cases at the declared
integrated source**. It does not turn the earlier 811-case qualification at a
different source into a full-suite result for this candidate, nor establish
an 819-case full-suite pass by adding the eight new cases. No native browser
or new hosted-head result is contained in these records; those qualification
steps remain pending for this candidate. The source correctness assessment
and its limits remain in the separate, unchanged `CORRECTNESS-REVIEW-G6.md`.
