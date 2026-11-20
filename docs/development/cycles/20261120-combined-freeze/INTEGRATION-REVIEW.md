# Combined freeze continuation: independent evidence review

## Result and reviewed identity

**No discrepancy was found in the merge receipt, selected execution evidence
or archived bytes.** The reports independently recount **39 passed cases in
exactly five files**, with no other assertion status, missing file, unexpected
file, duplicated file or duplicated full case name.

This review inspected the execution artifacts produced by the integration
owner. It did not rerun the compiler, tests, setup, build or browser, and it
does not supply hosted qualification or merge approval.

| Identity | Verified value |
|---|---|
| Executed runtime/test source | `d629b4e14dc7d7dea7e32d80ab358b5060f5e69f` |
| Executed source tree | `b30b157efe2f91fbac04ebfcc0568ce43c467d8e` |
| First actual parent, PR #61 | `759f5e2c17eb127db152eb3070557afefe3c64e7` |
| Second actual parent, final PR #60 | `8d8d64d1fafe52977a124ce1c49c9c8ac372ef1e` |
| Parents' common ancestor, PR #59 | `86cd564e0692e8c777538200675dc20f2651ab51` |

Local Git resolves those exact objects, parent order and merge base. Both
parents are ancestors of the executed source. Every new execution receipt,
the summary, archive manifest and merge receipt names the same source/tree.
The relevant runtime, test, tool and configuration paths remained unchanged
from that source when this review checked the worktree.

## Preserved parent contributions

All five entries in [MERGE-RECEIPT.json](MERGE-RECEIPT.json) were independently
compared in three forms: worktree bytes, executed-commit bytes, and the stated
parent's original bytes. Each length, SHA-256 digest and Git blob agrees.

| Combined artifact | Preserved parent | Verified Git blob |
|---|---|---|
| [Coordination repository](../../../../packages/mutiny/src/trade_proposals/repository.ts) | PR #61 | `0554e07aa0cead3ac61b44e75faa34dba5452a9b` |
| [Persistence acceptance](../../../../tests/integration/mutiny-persistence.test.ts) | PR #61 | `6d1ac8b5851bc0884bd2cdf8f0e88e3a6ea288c7` |
| [Production barter acceptance](../../../../tests/integration/production-barter-recovery.test.ts) | Final PR #60 | `9b8da0d86a226424d014e535f845b0396448cb79` |
| [Prior freeze handoff](../20261120-freeze-reasons/HANDOFF.md) | PR #61, original path | `e715d1db3c276f4c3c44e779d156fad30e18601c` |
| [PR #60 handoff copy](PR60-HANDOFF.md) | Final PR #60, renamed copy | `65fd94547595dfe1b3391d2d53331145ce54785b` |

The executed merge's complete delta from PR #61 is one changed test file and
the added PR #60 handoff copy. There is no change from that parent in
`packages`, `apps`, `tools`, `.github`, the package/lock/workspace files, or
the TypeScript/Vitest configurations. The prior evidence and readiness
reconciliation therefore remain inherited unchanged at this executed source.
The production implementation and both parents' distinct test contributions
survive the merge without treating the two implementations as two fixes.

Merge-receipt SHA-256:
`efe433e1b5698678d663c394f5b4bb5dce2cbb6193d27e44b3c14f96f1fa8a64`.

## Independent test recount

The review decompressed and parsed both complete Vitest JSON reports. Counts
below come from individual `assertionResults`, not only top-level totals.
Those counts also agree with the report totals, per-run receipts and summary.

| Actual reported file | Passed cases |
|---|---:|
| `tests/integration/mutiny-oracle.test.ts` | 12 |
| `tests/integration/mutiny-persistence.test.ts` | 16 |
| `tests/integration/mixed-production-backup.test.ts` | 1 |
| `tests/integration/production-barter-recovery.test.ts` | 7 |
| `tests/integration/production-codec-compatibility.test.ts` | 3 |
| **Total** | **39** |

The first group contains 28 cases in two files; the second contains 11 in
three files. All five suite statuses and all 39 assertion statuses are
`passed`. Both reports say `success: true`. Failed, pending and todo totals
are zero, and there are no skipped assertions. The actual absolute report
paths resolve to the exact five selected repository-relative paths. Their
union has no missing, unexpected or repeated member. The 39 pairs of file
path and full case name are also unique.

The existing production barter lifecycle case, including the newly retained
PR #60 assertions, reports approximately 8.232 seconds. Its 30-second source
limit remains intact. This is one expanded existing case, not an additional
case count, and the six reason-presentation fixtures are counted separately.

These results belong to the combined source above. They are not a rerun of
the complete domain configuration, and cannot be added to the earlier
811-case, 127-case or PR #61 39-case results to claim a larger distinct
passing suite.

## Commands and process results

Every standalone receipt exactly matches its corresponding entry in the
[execution summary](evidence/g10-combined-freeze/summary.json). Full recorded
command arguments were compared against the intended checks, including each
selected test path and JSON output path.

| Check | Recorded exit | Process duration | Outer process cap |
|---|---:|---:|---:|
| Full TypeScript compilation | 0 | 2.128 s | 300 s |
| Persistence/oracle group | 0 | 25.049 s | 900 s |
| Barter/backup group | 0 | 35.538 s | 900 s |
| Non-interactive setup | 0 | 0.115 s | 180 s |
| Production build | 0 | 0.219 s | 180 s |

The compiler command is
`node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit`.
Each domain group uses `node node_modules/vitest/vitest.mjs run`, its exact
selected paths, `--pool=forks --maxWorkers=1 --fileParallelism=false`, the JSON
reporter and its own output file. The two groups are recorded sequentially.
Every check records `NODE_OPTIONS=--max-old-space-size=1024`.

Setup is `node tools/cli/classrup.mjs setup --non-interactive`; build is
`node tools/cli/classrup.mjs build`. The compiler log is empty and has the
correct empty-file hash. Setup records creation of local configuration and
that browser vault data is untouched; build records that `dist/` was built.
Those logs establish the recorded local commands, not deployment, browser
execution, a separately rerun registry gate or a new release qualification.

## Archive integrity

All 13 entries in the [archive manifest](evidence/archive-receipt.json) were
verified against both their stored files and the original files under
`classrup-validation/g10-combined-freeze` in the shared workspace.

| Archive property | Independently verified result |
|---|---:|
| Listed, unique entries | 13 |
| Original bytes | 26,791 |
| Stored bytes | 12,232 |
| Missing or extra archive entries | 0 |
| Original-byte mismatches | 0 |
| Stored-byte or digest mismatches | 0 |

For each record, stored length and SHA-256 agree with the manifest. Gzip
entries decompress to the declared original length and SHA-256 and to the
exact raw bytes. Their header timestamps are zero. Uncompressed receipts and
summary retain the original bytes. Every raw file has exactly one archived
counterpart, and no unlisted archive payload was present.

Archive-manifest SHA-256:
`bdad089079531341146014db754b2acdf78699c66b6c89a5afa59763e6da30e7`.

This validates internal artifact integrity and byte preservation. The
manifest is a repository evidence receipt, not an independent attestation
from the hosted CI service.

## Source snapshot reconciliation and limits

The separate [source-preservation snapshot](SOURCE-PRESERVATION.json) was
reconciled against the original inventory at
`docs/development/evidence/20261118/inventory.json`. Its 67 unique branch
entries include all 57 original non-main names at their exact original heads.
Its stated main and PR #58–#61 checkpoint heads agree with its own entries;
the proposed combined target is absent. The missing/moved lists are empty.
This is consistency verification of the supplied pre-publication snapshot
at `2026-11-20T07:07:36.565131+00:00`, not a new remote observation or a
post-publication branch audit.

Source-snapshot SHA-256:
`56fb0aeebcf68dfeb2dc8c174bf126fb05e73b74c175b1c3bed92a6ef7f2c19e`.

The [qualification](QUALIFICATION.md), [handoff](HANDOFF.md), and the two
updated central continuation pointers were also inspected after they were
written. Their source/parent identities, counts, durations, archive totals and
separation of prior evidence agree with this review. All 13 relative links
in the qualification and handoff resolve. The documents keep all 51 historical
findings open and make no combined-source full-suite or browser-pass claim.
Their descriptions of predecessor CI queues remain the integration owner's
timestamped observations; this reviewer did not independently query those
remote runs.

| Reviewed closeout document | SHA-256 |
|---|---|
| `QUALIFICATION.md` | `aeff90724a286c1bea859fd8312b161a21ae7f9535aa458f7bc8df9aaf1fe1dc` |
| `HANDOFF.md` | `46dca0a6eaa23b71316e2dff3052a6e28bc18d9a31d73d540687e18ca806d7ec` |

The preserved PR #60 handoff retains its historical statement that its own
worker did not execute the acceptance. These combined-source results do not
retroactively change that record or certify the uncombined PR #60 head.
Earlier incomplete/failed attempts and source-specific qualifications stay
attached to their original sources.

The independent source reviews and actual current-head hosted Alpha/domain/
browser and applicable CLI jobs remain separate gates. This review performed
no remote write, browser launch, release, deployment or readiness-finding
closure. Later documentation-only closeout must preserve the tested runtime
and test blobs, and publication must verify the resulting complete tree and
both source parents before any integration decision.
