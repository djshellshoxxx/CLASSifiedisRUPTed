# Full production-registry recovery: qualification

## Exact source and scope

Executed runtime/test source:
`4a693cba0483b92b0df2459f8c9794be202b7c9a`, tree
`bccd3e4c94abfc05f2c39d0072264e6f14a9df6b`.
Its immediate parent is first-round source
`99cce1075e066acaefd863d59d23a6fea51f988c`, which retains published combined
PR #62, `4fc8e9c8aab75dec89d77677b4b25c50bd749632`, as its parent.
The final publication retains actual PR #62 as parent and the complete reviewed
tree; all changes after the executed source are documentation/evidence only.

The only executable change is the existing
[production barter recovery test](../../../../tests/integration/production-barter-recovery.test.ts),
blob `e20a7a52747d2c483ffddb3ca652dd744459f832`. Production, application,
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
| Full TypeScript compilation | Exit 0; 13.447 s |
| `production-barter-recovery.test.ts` | 7 passed |
| `production-notification-recovery.test.ts` | 1 passed |
| `production-recovery-readers.test.ts` | 1 passed |
| Selected domain result | **9 passed across exactly 3 files**; process exit 0, 24.760 s |

All suite and assertion statuses are passed, with no missing, unexpected or
duplicated reported file. The enlarged lifecycle took approximately 7.970
seconds within its unchanged 30-second limit. Three earlier compiler attempts
at this same source exited with signal 9 and no diagnostics; none reached the
domain command. The subsequent full compiler and selected-domain pass is
recorded separately, with every original failure retained.

Installation used pinned pnpm 10.28.0 with the frozen lockfile and offline store,
using real worktree-local workspace links. Node was 24.22.3. The domain command
used one fork worker, disabled file parallelism and a 1,024 MiB Node heap cap;
the outer process limit was 900 seconds. The successful run also set
`GOMAXPROCS=1` and `GOMEMLIMIT=384MiB` for the installed native compiler runtime.
These are validation-process resource controls, not changed compiler scope,
project configuration, assertions or test timeouts. The complete arguments and
environment values are retained in the receipts. See
[validation attempts](VALIDATION-ATTEMPTS.md) for the native-launcher finding
and the limits of the failure diagnosis.

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
deduplication records. Each dedupe payload independently points to the actual
inbox item and records the fixture delivery time. This one-line follow-up closes
the narrow oracle gap recorded by the first source review. The test verifies
one creation, one collapse, a count of two,
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

- [Original source, functional and defensive review](SOURCE-REVIEW.md)
- [Follow-up source review closing the oracle gap](SOURCE-REVIEW-ROUND2.md)
- [Final independent evidence verification](INTEGRATION-REVIEW-ROUND2.md)
- [Final selected-run summary](evidence-round2/g11-full-registry-recovery-round2-native/summary.json)
- [All follow-up attempts and inspection manifest](evidence-round2/archive-receipt.json)
- [Validation attempts and native compiler diagnosis](VALIDATION-ATTEMPTS.md)
- [Source-preservation snapshot](SOURCE-PRESERVATION.json)

The original source's nine-case pass remains preserved in the unchanged
[first-round archive](evidence/archive-receipt.json),
[independent review](INTEGRATION-REVIEW.md),
[qualification](QUALIFICATION-ROUND1.md) and [handoff](HANDOFF-ROUND1.md).
The preserved qualification and handoff bytes match the hashes recorded by that
first evidence review. Its nine passes are not a result for the later assertion.

The follow-up archive contains 16 entries: all three killed compiler attempts,
the successful compiler/domain attempt and the native executable inspection.
It retains 16,022 original bytes and 12,203 stored bytes. Together, the separate
first and follow-up archives hold 22 entries, 25,510 original bytes and 17,813
stored bytes. The counts describe evidence files, not unique test cases.
Logs and Vitest reports use deterministic gzip; plain receipts and summaries
retain their original bytes. Both manifests record original/stored sizes and
SHA-256 digests. Source/evidence reviews add no independent test execution or
hosted qualification.

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
