# Combined freeze-state candidate: qualification

## Source and merge scope

The executed runtime/test source is
`d629b4e14dc7d7dea7e32d80ab358b5060f5e69f`, tree
`b30b157efe2f91fbac04ebfcc0568ce43c467d8e`.
It has two actual parents, in order:

1. PR #61: `759f5e2c17eb127db152eb3070557afefe3c64e7`.
2. PR #60: `8d8d64d1fafe52977a124ce1c49c9c8ac372ef1e`.

Both sources descend from PR #59, which descends from PR #58. The new candidate
preserves both histories. It does not rewrite any source branch or transfer
earlier qualification to a different source.

The production conflict in `packages/mutiny/src/trade_proposals/repository.ts`
is resolved to PR #61's already reviewed implementation, byte for byte. Its
active-state guard and PR #60's conditional form have the same behavior because
`freezeConflict` returns terminal states unchanged. The persistence tests from
PR #61 and the production barter test from final PR #60 are both retained
unchanged. The existing worker handoff remains at its original path; the exact
PR #60 handoff is preserved separately as [PR60-HANDOFF.md](PR60-HANDOFF.md).
Its statements about that worker's unexecuted tests remain historical, and are
not the execution result for the combined source recorded here.

The [merge receipt](MERGE-RECEIPT.json) records both parents and the original
path, source, blob and SHA-256 for each resolved or preserved file. All production,
application, tooling, workflow, dependency and configuration paths are unchanged
from PR #61. The only changed test file relative to that parent is the production
barter recovery acceptance file.

## Executed results

| Check | Result at the combined source |
|---|---|
| Full TypeScript compilation | Exit 0; 2.128 s |
| Persistence and signed-state oracle | 28 passed in 2 files; 25.049 s |
| Production barter, production codec compatibility and mixed backup | 11 passed in 3 files; 35.538 s |
| Selected domain result | **39 passed across exactly 5 unique files** |
| Non-interactive setup | Exit 0; 0.115 s |
| Production build | Exit 0; 0.219 s |

Both JSON reports contain only passed case statuses. The selected file manifest
has no missing, unexpected or duplicated entry. All checks completed in one
attempt at this source. Existing test-case counts and per-case timeouts are
unchanged, including the production barter case's 30-second limit.

Installation used pnpm 10.28.0, the frozen lockfile and the existing offline
store, with real worktree-local workspace links. Node was 24.22.3. Test groups
ran sequentially with a single fork worker, disabled file parallelism and a
1,024 MiB Node heap cap. The outer test-process timeout was 900 seconds. Full
commands, source/tree, exit status, duration and hashes are in the receipts.

These 39 cases are an affected-suite result. They are not an additional 39
distinct cases beyond the earlier 39, 127 or 811, and they do not establish a
new full-domain run. Earlier successes, failures, cancellations and restrictions
remain attached to their original sources and attempts.

## Acceptance established and its boundaries

The preserved persistence cases exercise real signed lifecycle state, another
ordinary refresh, IndexedDB close/reopen, another refresh and repeated external
normalization. They retain the expired-reservation and lost-local-hold reasons,
retain reconstructed live historical commitment fields, clear imported local
verdicts, and leave the live copy unchanged. Their repeated checks keep the fake
clock fixed; they do not assert that observation time never advances.

The combined production barter case executes the final PR #60 additions:

- It repeatedly validates each of the two local cached reasons against genuine
  signed evidence. The cached reasons in this portion are explicitly fixtures,
  not signed proof of a remote outcome.
- A genuine coordinator-signed withdrawal is appended to the cached evidence;
  external reconstruction returns the signed cancellation, preserving terminal
  precedence. This is a validator acceptance, not a new withdrawal UI journey.
- An ordinary owner inventory release is followed by two matching-enabled
  coordination refreshes, retaining `local_reservation_lost`.
- The independent peer completes commitment through the ordinary handler, then
  uses a separate clock past the signed reservation deadline. Two refreshes
  retain `reservation_expired`. The owner's archived backup clock is unchanged.
- The original encrypted export, restore, reopen, signature, canonical key,
  ordinary-reader and recovery-review assertions still execute. A restored
  commitment stays frozen for review and releases its local domain hold after
  refresh; the candidate does not authorize automatic recommit.

Together with prior recovery scenarios, all 15 registered production codec
types are populated across separate archives. This does not establish one
all-type archive, attachment/blob recovery, delivery/lease recovery, whole-
database rollback protection or actual interrupted-device recovery.

## Independent review and evidence

Fresh correctness and defensive source reviews found no blocking introduced
defect within their stated boundaries. The separate integration review
independently recounted all 39 cases, verified both parent contributions and
matched every archived byte/hash to the raw evidence. These dispositions are
source/evidence reviews; they add no separate test execution or release approval.

- [Source and functional review](CORRECTNESS-REVIEW.md)
- [Defensive source review](DEFENSIVE-REVIEW.md)
- [Independent evidence and merge verification](INTEGRATION-REVIEW.md)
- [Selected-run summary and receipts](evidence/g10-combined-freeze/summary.json)
- [Archive manifest](evidence/archive-receipt.json)
- [Source-preservation snapshot](SOURCE-PRESERVATION.json)

The new test archive has 13 entries: 26,791 original bytes and 12,232 stored
bytes. Logs and Vitest reports use deterministic gzip; receipts and summary
retain their original JSON bytes. The manifest records original and stored
SHA-256 digests. The merge and remote-source receipts are separate records,
not extra executed tests.

## Hosted qualification and integration

At the pre-publication inspection, these actual current-head runs were queued:

| Source | Alpha | CLI |
|---|---|---|
| PR #58 | `44688571289` | `44688571305` |
| PR #59 | `44689824044` | `44689823917` |
| Final PR #60 | `44691746504` | `44691747176` |
| PR #61 | `44691601899` | `44691601891` |

The new published combined head needs its own actual full Alpha/domain/browser
and applicable CLI qualification. Record its real head, full tree and actual
run IDs in the PR body after publication. Local checks and source reviews do
not replace those jobs. Keep the candidate draft until qualification passes.

No native-browser launch was retried in the environment that previously denied
it before a page opened. Native WebKit existing-key import remains open. No
new browser result is claimed here. No workflow, timeout, product cap, assertion
or skip was relaxed to obtain a result.

Before integration, refresh main and every source head, inspect any drift,
compare actual and tested prospective merge trees, and perform an ordinary
expected-head merge only after current qualification and independent review.
After any merge, inspect the actual main-push workflows separately. Preserve
all source branches, the original PR #8 work and every prior evidence record.
