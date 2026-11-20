# Full production-registry recovery: qualification

## Exact source and scope

Executed runtime/test source:
`99cce1075e066acaefd863d59d23a6fea51f988c`, tree
`ba98ba4ef99f35a32068b1adc5725a4204c76ed9`.
Its sole parent is published combined PR #62:
`4fc8e9c8aab75dec89d77677b4b25c50bd749632`.

The only executable change is the existing
[production barter recovery test](../../../../tests/integration/production-barter-recovery.test.ts),
blob `aa0078f19382a45842c7346a2173f161c79eb2d9`. Production, application,
tooling, dependency, workflow and configuration bytes are unchanged from PR #62.
The test still has seven cases, including the six unchanged view fixtures;
the expanded lifecycle retains its original 30-second limit and cleanup.
The [implementation notes](IMPLEMENTATION.md) describe the exact fixture and
preserved assertions.

The additional acceptance concerns the interaction between authenticated barter
evidence, local notification delivery and one encrypted recovery transaction.
It also establishes a single populated archive covering all 15 currently
registered production record types. It does not add a codec or change recovery
policy.

## Executed local results

| Check or reported file | Actual result |
|---|---|
| Full TypeScript compilation | Exit 0; 2.485 s |
| `production-barter-recovery.test.ts` | 7 passed |
| `production-notification-recovery.test.ts` | 1 passed |
| `production-recovery-readers.test.ts` | 1 passed |
| Selected domain result | **9 passed across exactly 3 files**; process exit 0, 26.208 s |

All suite and assertion statuses are passed, with no missing, unexpected or
duplicated reported file. The enlarged lifecycle took approximately 7.431
seconds within its unchanged 30-second limit. The source passed on its first
recorded compiler and selected-domain attempt.

Installation used pinned pnpm 10.28.0 with the frozen lockfile and offline store,
using real worktree-local workspace links. Node was 24.22.3. The domain command
used one fork worker, disabled file parallelism and a 1,024 MiB Node heap cap;
the outer process limit was 900 seconds. The complete command arguments and
process metadata are retained in the receipts.

This was an affected production-recovery selection. No full-domain, tooling,
CLI, build or native-browser suite was rerun for this test-only change. Earlier
39/127/811-case results and build outcomes retain their own sources and scopes.
The nine cases overlap earlier selections and must not be added to them as a
new distinct test total. The publication still requires its own hosted gates.

## Concrete result established

One owner vault now has executed acceptance covering all 15 production record
types created through ordinary commands. The fixture includes a real committed
barter cycle, an independent archived listing, a coarse location setting, local
preferences and delivered local notifications. A separate memory-backed peer
provides genuine signed evidence; its private store is not part of the owner
backup.

The local inbox is populated by the actual `mutiny.coordination.observed`
producer and notification subscriber. The test observes two accepted peer
events and matches their IDs to the single cycle notification and two domain
deduplication records. It verifies one creation, one collapse, a count of two,
the peer's daily counter and the preference-edit counter. No direct notification
creation or raw domain-record insertion supplies this state.

Coverage equals the complete explicit 15-type registry, every type is populated,
and no unsupported type or limit overflow is reported. Bounded reads capture
the entire domain-record set and match the inventory count. Export leaves that
complete source snapshot, live commitment, location window, ordinary views and
notification counters unchanged.

The restore oracle independently spells out the two existing policy changes:

| Record | Expected transformation |
|---|---|
| Barter coordination | Frozen with `restore_requires_review`; local commitment and feasibility fields cleared |
| Location setting | Coarse setting retained; local change count/window reset and `lastChangedAt` removed |
| All other registered records | Complete saved values and metadata preserved |

Expected data is not computed by calling the restore codecs. After restore and
lock/reopen, complete record snapshots, ordinary listing/history/archive/search/
location/inbox/preference readers, identity signatures, counters and inventory
agree with the independent expectations.

Two ordinary matching-enabled refreshes preserve the recovered frozen state,
release its local domain hold and leave complete notification rows, source IDs,
counts, revisions, preference state and diagnostics unchanged. The production
delivery-health helper reports no outstanding notification work or dead letters.
This detects an unwanted collapsed update as well as a duplicate visible row.

The recovered owner then marks the notification read, restores the independent
archived listing and republishes it with the expected signature, predecessor
CID and sequence. The original frozen coordination and unrelated notification
state remain intact. Existing signed withdrawal, owner hold-loss, peer expiry
and normalization assertions also remain in the same lifecycle case.

## Evidence and independent review

- [Fresh source, functional and defensive review](SOURCE-REVIEW.md)
- [Independent evidence verification](INTEGRATION-REVIEW.md)
- [Complete selected-run summary](evidence/g11-full-registry-recovery/summary.json)
- [Archive manifest](evidence/archive-receipt.json)
- [Source-preservation snapshot](SOURCE-PRESERVATION.json)

The new execution archive contains six entries, 9,488 original bytes and 5,610
stored bytes. Logs and the Vitest report use deterministic gzip; receipts and
summary retain their original bytes. The manifest records original and stored
sizes and SHA-256 digests. Source-review conclusions are independent of the
execution receipts; neither supplies hosted qualification.

## Limits and hosted gate

This is a populated single archive for the current alpha domain registry,
not every state of every codec or a complete database snapshot. Kernel outbox,
dispatcher inbox, idempotency, leases, delivery state, blobs and attachments
remain excluded. Source notification delivery is completed before export.
The test establishes preservation of delivered local notifications and no new
alerts from recovery refresh; it does not establish queue migration or external
notification delivery.

Storage uses encrypted fake IndexedDB under Node. Native browser behavior,
actual interrupted-device recovery, load/rotation, whole-database rollback and
the existing native WebKit key-import issue remain separate. No browser launch
was retried in the previously restricted local environment.

PR #62's actual Alpha `44693220306` and CLI `44693220154` runs were queued at
their initial plan jobs when this follow-on began. Keep the new published
candidate draft until its own current-head full Alpha/domain/browser and
applicable CLI jobs pass and independent review is complete. Record the actual
new head, complete tree and run IDs in the PR body. Preserve all predecessor
heads and their successes, failures, cancellations and source-specific evidence.
