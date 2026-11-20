# Local freeze-reason continuation: qualification

## Source and review

Integrated runtime/test source:
`94a34723108cf60db3b9bab1c669f5c9b5c36cd3`, tree
`1c7f8a1c4be00b81a9d2098673eb4fc6ddff7fe4`.
Published parent: PR #59 head `86cd564e0692e8c777538200675dc20f2651ab51`.
Worker source: `4652fb788912dacbe436ffccfd481b5ff8f6511d`.

One production block now preserves `reservation_expired` and
`local_reservation_lost` while evidence replay remains active. Replayed terminal
outcomes retain precedence; recovery-review verdict clearing and the existing
unknown-reason fallback remain unchanged. Two existing ordinary lifecycle cases
now check repeated refresh, IndexedDB reopen and repeated normalization.

The [fresh correctness review](CORRECTNESS-REVIEW-G8.md) found no blocking
introduced defect. It pins production blob
`0554e07aa0cead3ac61b44e75faa34dba5452a9b` and test blob
`6d1ac8b5851bc0884bd2cdf8f0e88e3a6ea288c7`.
All later changes in this checkpoint are documentation/evidence only.

## Executed local results

| Check | Actual result |
|---|---|
| Full TypeScript compilation | Exit 0; 3.296 s |
| Existing persistence and signed-state oracle suites | 28 passed across 2 files; 27.531 s |
| Production barter, codec compatibility and mixed-backup regression | 11 passed across 3 files; 36.848 s |
| Selected domain total | **39 passed across exactly 5 files**, zero other case statuses |
| Non-interactive setup | Exit 0 |
| Production build | Exit 0 |

The two test groups ran sequentially with isolated fork workers, one worker
at a time, disabled file parallelism and a 1,024 MiB Node heap cap. The outer
test-process cap was 900 seconds. Existing per-case limits and test-case counts
were unchanged. Dependency installation used real worktree-local links with
pinned pnpm 10.28.0, frozen lockfile and the offline store; Node was 24.22.3.

The exact manifest has five unique files with no missing, unexpected or
duplicate report entry. These are the affected persistence/recovery cases,
not a new full-domain result. The previous 127-case and 811-case results belong
to their own sources and overlap this selection; none is added to this total.
No new dependency, workflow, product limit, skipped case or relaxed assertion
was introduced.

The new helper's repeated operations keep the fake clock fixed. Whole-state
equality therefore includes a stable observation time in those cases; it does
not imply future refreshes never advance `lastObservedAt`. Its storage fixture
uses ordinary IndexedDB with real signatures. The separate production barter
case exercises encrypted vault recovery. Neither establishes native-device,
process-crash or whole-database recovery.

## Evidence and source preservation

- [Independent report/archive verification](INTEGRATION-REVIEW-G8.md)
- [Raw selected manifest and receipts](evidence/g8-freeze-integrated/summary.json)
- [Archive manifest](evidence/archive-receipt.json)
- [Branch preservation audit](evidence/g8-branch-preservation/RECONCILIATION.md)

The archive holds 19 entries, including the complete test logs/reports/receipts
and the independent branch snapshot. Its receipt records original/stored byte
counts and SHA-256 digests. Compressed reports/logs use deterministic gzip;
branch snapshot files retain their original filenames and bytes.

At the audited `2026-11-20T06:45Z` snapshot, all 57 original non-main branches
retained their original heads. There were 65 remote branch names including
main and seven added since the original inventory. Open PRs #8, #58 and #59
were drafts. Main and both continuation heads were unchanged, and PR #59's
sole parent was exactly PR #58's head. This is a timestamped snapshot, not a
claim about later publication or unpublished work.

The separate [readiness reconciliation](../20261120-readiness/READINESS-RECONCILIATION.md)
maps historical findings to current evidence. It changes no product source,
original audit, finding status, provisional severity/gate or release approval.

## Hosted gate

At the latest pre-publication inspection, PR #58's Alpha `44688571289` and CLI
`44688571305`, and PR #59's Alpha `44689824044` and CLI `44689823917`, were queued.
The inspected Alpha runs had only their first `plan` jobs queued, without test
steps or logs. There is no new hosted test pass or failure to infer from this.

The new published candidate requires its own current-head full Alpha
domain/browser and applicable CLI checks. Keep it draft until those results
and independent review are complete. No browser attempt was repeated in the
unchanged environment that previously denied launch. Native WebKit existing-key
import remains separately open.

Before integration, refresh heads and checkouts, use an expected-head ordinary
merge, compare actual/tested merge trees and inspect main's own push checks.
No release, deployment, force push or original branch deletion is included.
