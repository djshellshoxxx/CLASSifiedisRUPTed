# Full production-registry recovery: independent evidence review

## Result and exact source

**No discrepancy was found in the new selected execution evidence, archive
or supplied source-preservation snapshot.** Independently parsed results show
**nine passed cases across exactly three files**, and the full TypeScript
receipt records exit 0. The enlarged lifecycle is one existing case and
completed in approximately **7.431 seconds** within its unchanged 30-second
limit.

This review inspected the integration owner's execution artifacts and source
identities. It did not rerun tests or compilation, and supplies no independent
browser, hosted CI or release result.

| Identity | Verified value |
|---|---|
| Executed runtime/test source | `99cce1075e066acaefd863d59d23a6fea51f988c` |
| Executed source tree | `ba98ba4ef99f35a32068b1adc5725a4204c76ed9` |
| Sole actual parent, published PR #62 | `4fc8e9c8aab75dec89d77677b4b25c50bd749632` |
| Parent tree | `5917e4b60a2c41c0d462843c27355399e7c7a10d` |
| Changed test blob | `aa0078f19382a45842c7346a2173f161c79eb2d9` |

Local Git resolves these exact objects and confirms the parent relationship.
Both execution receipts, their summary and the archive manifest identify the
same executed source and tree. The complete committed delta from PR #62 is
[IMPLEMENTATION.md](IMPLEMENTATION.md) and
[production-barter-recovery.test.ts](../../../../tests/integration/production-barter-recovery.test.ts).
There is no production, application, tooling, workflow, dependency or
configuration change in that delta. Relevant runtime/test/configuration paths
still matched the executed source when checked during this review.

The changed test's SHA-256 is
`31028c11a3abd3c46fb79a284b71826fe8dbac7bd687dbfa058d98e32a5c3612`.
Its six reason-presentation cases are byte-identical to the parent's suffix.
The existing 30-second lifecycle limit remains present and unchanged.

## Independent recount and command verification

The complete Vitest report was parsed from the archived gzip and compared
with the raw report. Counts below were obtained from the individual
`assertionResults`, then checked against the top-level report, execution
receipt and summary.

| Actual reported file | Passed cases |
|---|---:|
| `tests/integration/production-barter-recovery.test.ts` | 7 |
| `tests/integration/production-notification-recovery.test.ts` | 1 |
| `tests/integration/production-recovery-readers.test.ts` | 1 |
| **Total** | **9** |

All three suite statuses and all nine assertion statuses are `passed`.
Report success is true; failed, pending and todo totals are zero. There are
no skipped assertions. Every absolute report path resolves to the exact
selected repository-relative path. The selected/reported/receipt file lists
agree, and contain no missing, unexpected or repeated file. All nine pairs
of file path and full case name are unique.

| Check | Recorded exit | Process duration | Outer process cap |
|---|---:|---:|---:|
| Full TypeScript compilation | 0 | 2.485 s | 300 s |
| Selected production recovery group | 0 | 26.208 s | 900 s |

The compiler command is
`node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit`.
The test command is `node node_modules/vitest/vitest.mjs run`, followed by
the three exact file paths above and
`--pool=forks --maxWorkers=1 --fileParallelism=false --reporter=json`, with
the recorded output path ending in
`g11-full-registry-recovery/production-recovery-interaction.json`.
Both receipts record `NODE_OPTIONS=--max-old-space-size=1024`.

All command arguments, source/tree fields, exit codes, log lengths and log
hashes were checked. Each standalone receipt is exactly equal to its entry
in the [summary](evidence/g11-full-registry-recovery/summary.json). The compiler
log is empty with the expected empty-file digest. The domain report's digest
agrees with the receipt and archived original digest.

The full-registry lifecycle reports `7431.316868000001` milliseconds. It
retains the same case identity and existing limit; the new assertions do not
increase the suite's case count. These nine selected cases overlap earlier
qualification. They must not be added to the 811, 127 or previous 39-case
results or described as a full-domain rerun.

No setup, build, tooling-suite, CLI-suite or browser receipt is present in
this new execution set. None is claimed as rerun by this evidence review.

## Meaning of the executed acceptance

The enlarged passing lifecycle explicitly compares its 15 populated types
with the complete production backup registry, checks positive per-type
counts and unsupported/limit flags, and compares the captured row count with
backup coverage. It exports one owner archive and restores that archive
into the destination vault before lock/reopen comparisons. The assertion
therefore exercises one populated full-registry archive at this source,
beyond the earlier union of separate recovery scenarios.

The inspected test computes expected restored records from its captured
snapshot with explicit coordination-review and location-window exceptions.
It does not obtain that expected record set by calling the restore codecs.
The real local notification subscriber processes accepted peer coordination
events; source delivery is drained with the production delivery helper before
export. The case compares ordinary views, complete domain records, counters,
coverage and signing identity through recovery, then exercises repeated
refresh, reading a recovered notification, and restoring/republishing the
separate archived listing.

This is bounded acceptance of the records present in the configured codec
registry. It does not establish native-browser execution, every possible
codec state, attachment/blob or kernel delivery-state backup, whole-database
recovery, process-crash durability, external notification delivery or release
readiness. The two adjacent existing recovery cases provide their own
selected regression coverage; their results are not additional full-registry
archives created by the enlarged lifecycle.

## Archive integrity

Every entry in the [archive manifest](evidence/archive-receipt.json) was
verified against its stored bytes and the original raw file under
`classrup-validation/g11-full-registry-recovery` in the shared workspace.

| Property | Independently verified result |
|---|---:|
| Unique archive entries | 6 |
| Original bytes | 9,488 |
| Stored bytes | 5,610 |
| Missing or extra payload entries | 0 |
| Original/stored byte or digest mismatches | 0 |

Stored length and SHA-256 match each manifest row. Gzip files decompress to
the declared original length/hash and exact raw bytes; their header timestamps
are zero. Plain JSON receipts and summary retain their original bytes. All
six raw files have exactly one listed counterpart and no unlisted archive
payload exists.

Archive-manifest SHA-256:
`eb57936bdd64d3e983a5b56bacb5ac21b4549608c2c38da407da3c5475f5c5cc`.

This establishes internal artifact integrity and byte preservation. The
manifest is a repository evidence receipt, not hosted CI attestation.

## Source snapshot and integration limits

The [pre-publication source snapshot](SOURCE-PRESERVATION.json) was reconciled
with `docs/development/evidence/20261118/inventory.json`. It records **68 unique
remote branch heads**, including all **57 original non-main branches at their
original heads**, with no missing or moved original ref. Its stated checkpoint
heads agree with its entries, including main and published PR #62. The new
full-registry candidate ref is absent from the snapshot.

These are consistency checks on the supplied snapshot observed at
`2026-11-20T07:26:09.873201+00:00`. This reviewer did not make a fresh remote
query; the record is not a post-publication or CI-qualification snapshot.
Snapshot SHA-256:
`6bf0075ebbdabe54b45342ee403c57b5ac0acb132d9cfe2ee420706314745c5c`.

The [qualification](QUALIFICATION.md), [handoff](HANDOFF.md), and changes to
the central backup-scope, consolidation-handoff and remaining-work documents
were reviewed after they were written. Source/parent/blob identities,
per-file counts, durations and archive sizes agree with the evidence. All 13
relative links in the qualification and handoff resolve. The documents
distinguish the newly executed single populated registry archive from the
earlier separate scenarios, keep previous source qualifications separate,
retain all historical readiness findings as open, and claim no new full-domain,
build, CLI or browser run. Stated remote queue observations were not queried
independently by this reviewer.

| Reviewed closeout document | SHA-256 |
|---|---|
| `QUALIFICATION.md` | `dcc8f4634d2e27b06510b6d9bccb4729500430751779e122a4fc5966ec66667a` |
| `HANDOFF.md` | `ff6e062e4b1e8d8050df01f5e8e6216ca231d2ed0dc108a32bfe3e69aced6e24` |

Prior successes, failures, interruptions and source-specific qualifications
remain inherited records. The implementation author's statement that they
ran no product tests is preserved; the execution reviewed here belongs to
the integration owner and exact source above.

Fresh hosted qualification of the actual published candidate, independent
source-review dispositions, and the separate native WebKit existing-key issue
remain outside this evidence review. Documentation closeout must retain the
tested code/test bytes, and publication must verify its actual complete tree
and parent. No product or test edits, runtime test reruns, remote writes,
browser attempts, readiness closure, release or deployment were performed
by this reviewer.
