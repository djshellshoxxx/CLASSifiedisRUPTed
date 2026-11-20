# Notification and barter recovery qualification

## Exact source

The integrated runtime and test source is
`796c16520365c57562c1328a73d313f3fa614ae4`, tree
`07a135e30d47c5284d120d4dad76f648c26e8444`. Its published parent is PR #58
head `25b4708191f04516cab74371c84a15663cc6f6a6`, tree
`bc38af24e9d81724de6d463e681fd55db7e3618b`.

Worker notification commit `61c0e5eeaafe2361d100b4eddb2c9a970d48a18f`
and barter commit `355ea87578d25c2b7278290f0ced5dedde142bdb` were integrated
through local commits `187e6ecc` and `796c1652`. Later documentation and
evidence additions must leave the tested runtime and test blobs unchanged.
The publication process compares the complete local and remote trees; the
actual remote head belongs in the PR body, rather than being guessed here.

## Executed integrated checks

The isolated worktree used Node 24.22.3, pinned pnpm 10.28.0, TypeScript 7.0.2
and Vitest 5.1.0. Its frozen offline dependency installation completed with
real worktree-local package links. No dependency, test timeout, product cap,
workflow selection or assertion was weakened.

| Check | Files | Passed cases | Result |
|---|---:|---:|---|
| Complete TypeScript compilation | Entire configured project | — | Exit 0 |
| New production notification/barter acceptance | 2 | 8 | Exit 0 |
| Mutiny and matching regression | 6 | 56 | Exit 0 |
| Local notification regression | 6 | 50 | Exit 0 |
| Existing production and domain backup regression | 7 | 13 | Exit 0 |
| Selected domain total | 21 distinct files | **127** | Zero other case statuses |
| Specification consistency | — | — | Exit 0 |
| Dependency boundaries | — | — | Exit 0 |
| Strict feature registry | — | — | Exit 0 |
| Non-interactive setup | — | — | Exit 0 |
| Production build | — | — | Exit 0 |

The four domain groups ran sequentially, with isolated fork workers, one
worker at a time and a 1,024 MiB Node heap cap. Existing per-case limits,
including the 30-second main recovery cases, were unchanged. Each test
process had a 900-second outer cap. The selected manifest exactly matches
the four reports: no missing, unexpected or duplicate files.

These 127 cases include the eight new cases. They are an affected regression
selection, not a new complete-domain claim. PR #58's earlier 811-case result
belongs to its own runtime/test source `d92f20bc`; it is not reassigned to
this changed source, and the two counts must not be added together. The
entire domain suite remains part of the candidate's required hosted gate.

## Worker checks and preserved setup failure

| Source and attempt | Observed result |
|---|---|
| Notification worker, initial compiler invocation | Exit 1: shared dependency symlinks resolved two physical copies of branded kernel types |
| Same notification source, after real pinned offline installation | Complete compiler passed; 1 recovery case passed |
| Barter worker with real pinned offline installation | Complete compiler passed; all 7 recovery/view cases passed |

The notification setup repair removed only dependency symlinks and performed
the pinned frozen installation in that worktree. It did not change source,
cast away branded types or suppress the compiler. The original failed log
and receipt remain archived separately from the successful attempt. No
worker result replaces the subsequent integrated 127-case run.

## What the acceptance establishes

The notification case populates all six local notification codec types with
18 command-created records. It checks paginated/category/unread inbox
readers, preferences, counters and the signing identity through encrypted
export, restore and reopen. Subsequent commands exercise recovered domain
deduplication, collapse, the real preference-change subscriber, hidden
updates and bulk read. External delivery, channel grants and kernel queue
restoration are not part of the scenario.

The barter case creates a real local commitment using ordinary commands and
genuine participant signatures. Seven populated record types include wants,
coordination and the domain inventory hold. Export leaves the source live
commitment unchanged. Restore and reopen preserve evidence and identity,
freeze the recovered commitment for manual review, and discard its local
feasibility verdict. Repeated normalization and matching-enabled refresh
retain that recovery reason; ordinary refresh releases the recovered hold.
The canonical codec keys agree with the actual writers.

The six barter view fixtures establish explanatory text and action visibility
for supplied reasons. They are not native browser journeys or proof that
every existing local freeze reason survives later reconstruction. The
pre-existing expiry/lost-reservation reason drift remains a separate follow-on.

Together with the normal-reader recovery scenario, the executed scenarios
populate the union of all 15 production codec types across separate archives.
This is not one archive containing all 15 types, every state of each type,
or whole-database recovery. See the [coverage map](../../BACKUP_SCOPE.md).

## Independent review and retained evidence

- [Worker source and policy review](INDEPENDENT-REVIEW.md)
- [Fresh integrated correctness review](CORRECTNESS-REVIEW-G6.md)
- [Independent report and archive review](INTEGRATION-REVIEW-G6.md)
- [Archive receipt](evidence/archive-receipt.json)
- [Selected run manifest and summary](evidence/g6-integrated-recovery/summary.json)

The archive contains all 37 original logs, reports and receipts from these
worker attempts and the integrated qualification. Logs and raw case reports
use deterministic gzip storage; the manifest records original and stored
byte lengths and SHA-256 digests. Failed evidence is retained.

## Hosted and browser gate

At this documentation checkpoint, unchanged PR #58 head `25b47081` had
Alpha `44688571289` and CLI `44688571305` queued. Those runs qualify only
their own source. The new candidate requires its own actual full Alpha
domain/browser and applicable CLI jobs, with exact head/merge identities.
Keep it draft until those results and independent review are complete.

No local browser was attempted again. The previous checkpoint documented
the pinned download HTTP 403 and system Chromium socket denial before a
page opened. This unchanged environment provides no native-browser result.
Hosted browser journeys and the separate native WebKit existing-key import
limitation must retain their distinct status.

After ordinary qualified integration, compare actual and tested merge trees
and inspect main's own push workflows. No release, deployment, force push or
source-branch deletion is part of this checkpoint.
