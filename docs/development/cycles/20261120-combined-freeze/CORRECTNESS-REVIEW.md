# Combined PR #60 / PR #61: independent correctness review

## Result and exact source

**No blocking introduced defect or lost parent contribution was identified
in the reviewed source.** The candidate retains PR #61's production
reconstruction and durable lifecycle assertions, and PR #60's production
barter acceptance additions. This is a fresh source/functional review, not
an executed-test result or merge approval.

Reviewed commit: `d629b4e14dc7d7dea7e32d80ab358b5060f5e69f`.
Reviewed tree: `b30b157efe2f91fbac04ebfcc0568ce43c467d8e`.
Actual merge parents, in order:

1. PR #61: `759f5e2c17eb127db152eb3070557afefe3c64e7`.
2. Final PR #60: `8d8d64d1fafe52977a124ce1c49c9c8ac372ef1e`.

Their merge base is published PR #59 source
`86cd564e0692e8c777538200675dc20f2651ab51`. Local Git resolves the stated
tree and both actual parents. The worktree was clean at review entry.

| Reviewed artifact | Exact combined Git blob | Parent preservation |
|---|---|---|
| [Coordination repository](../../../../packages/mutiny/src/trade_proposals/repository.ts) | `0554e07aa0cead3ac61b44e75faa34dba5452a9b` | Byte-identical to PR #61 |
| [Durable persistence acceptance](../../../../tests/integration/mutiny-persistence.test.ts) | `6d1ac8b5851bc0884bd2cdf8f0e88e3a6ea288c7` | Byte-identical to PR #61 |
| [Production barter recovery acceptance](../../../../tests/integration/production-barter-recovery.test.ts) | `9b8da0d86a226424d014e535f845b0396448cb79` | Byte-identical to final PR #60 |
| [Preserved PR #60 handoff](PR60-HANDOFF.md) | `65fd94547595dfe1b3391d2d53331145ce54785b` | Byte-identical copy of PR #60's original handoff |
| [Prior freeze handoff](../20261120-freeze-reasons/HANDOFF.md) | `e715d1db3c276f4c3c44e779d156fad30e18601c` | Retains PR #61's prior-path version |

Relative to PR #61, the entire committed delta is the production barter test
and the additional handoff copy. Relative to the shared PR #59 base, the only
non-documentation changes are the repository and these two test files. No
runtime contribution is accidentally selected from a third version.

## Reconstruction and terminal precedence

The reviewed [repository](../../../../packages/mutiny/src/trade_proposals/repository.ts)
reverifies durable envelopes, rebuilds the signed proposal/evidence state and
then considers the saved frozen explanation. The change remains bounded to
that cached-frozen branch:

| Replayed state and saved reason | Result of the reviewed branch |
|---|---|
| Active replay; `restore_requires_review` | Frozen review marker, with both local commitment fields explicitly cleared |
| Active replay; `reservation_expired` | Frozen with that local historical reason |
| Active replay; `local_reservation_lost` | Frozen with that local historical reason |
| Active replay; another or null reason | Existing `freezeConflict` fallback |
| Replay already `cancelled`, `declined` or `frozen` | Replayed terminal state remains unchanged |

Here active means `proposed` or `committed`. PR #60 placed the active-state
condition inside the frozen branch and called `freezeConflict` otherwise;
PR #61 places it on the outer condition. In the inspected
[state machine](../../../../packages/mutiny/src/trade_proposals/index.ts),
`freezeConflict` returns an already terminal state unchanged. The two forms
therefore have the same behavior over the schema's allowed statuses. Choosing
PR #61's version does not discard a different PR #60 runtime rule.

Historical live commitment metadata remains reconstructed only through the
existing trusted-local path. External normalization does not replay that
verdict, and the explicit recovery marker continues to clear it. A preserved
reason does not grant a fresh commitment: `evaluateCoordination` can newly
commit only a proposed state. Terminal states also stay outside the active
cross-subject conflict scan. The changed branch does not alter proposal,
reservation, signature, actor, consent or revision admission rules.

This precedence assessment concerns terminal outcomes already obtained during
evidence reconstruction. It does not claim a new rule for delivering a fresh
withdrawal after a coordination record has already become terminal.

## Ordinary owner hold loss

The production acceptance extension starts after genuine signed listings,
wants, reservations and both participant consents have produced a committed
owner record. It obtains the owner's active hold from the ordinary input
query and dispatches `bazaar.inventory.release` with its actual revision.
The inspected [inventory handler](../../../../packages/bazaar/src/listings/index.ts)
checks actor ownership, active state and expected revision before replacing
the hold's state with `released`.

Both subsequent refreshes use the real
[barter runtime](../../../../apps/pwa/src/barter-runtime.ts), with matching
enabled. Its local reservation check reads the actual hold record. The first
refresh observes the missing hold and freezes the previously committed state
as `local_reservation_lost`; the second reconstructs and preserves that
reason. This portion reaches hold loss through ordinary owner commands,
without assigning the persisted coordination state directly.

PR #61's retained persistence case independently takes the same ordinary
release path, closes/reopens its IndexedDB storage and repeats refresh. Its
helper checks full state equality at a fixed clock, the released hold and
preserved historical commitment metadata. The combined merge retains that
entire test file unchanged.

## Independent peer expiry and clock separation

The added peer path supplies the owner's already signed consent to the
peer's ordinary ingest handler, then asserts the peer is committed. The peer
has its own storage and still-active local hold; releasing the owner's local
hold does not mutate the peer's store or its signed evidence.

The test constructs a new runtime over that same peer storage with a separate
clock at owner time plus two days. Signed reservations expire at the original
consent deadline plus execution window: one hour plus one day after the
proposal. The new peer time is therefore beyond that signed deadline. The
state machine's committed-state clock evaluation produces
`reservation_expired` before the refresh's missing-local-hold fallback could
replace it. Repeating the peer refresh must preserve the expiry reason.

The original owner's clock is not advanced. PR #61's separate retained
durable expiry case additionally checks actual hold release, same-database
reopen and repeated normalization. The production peer uses memory storage;
it does not independently establish encrypted peer recovery or native-device
clock behavior.

## Normalization and signed coordinator withdrawal

The retained persistence helper calls `normalizeCoordinationRecord` on each
genuine locally frozen state, requires the same reason with null local
commitment fields, repeats normalization and rereads the unchanged live
record. These assertions cover idempotent normalization without treating the
saved cause as signed remote proof. Their full-state equality uses a fixed
fake clock; it does not assert that later observations can never advance
`lastObservedAt`.

PR #60's added direct replay checks are complementary: they build local cache
fixtures from the existing real signed lifecycle and check both recognized
reasons twice. Those particular fixture reasons are assigned locally; they
are not themselves ordinary expiry/hold-loss observations. The ordinary
owner and peer paths described above provide that distinct coverage.

The terminal-precedence fixture signs a cancellation with the actual
coordinator identity and the exact subject, revision hash and revision number.
It appends the signed statement to a copied evidence array and calls the
external validator. The inspected state machine checks participant/subject/
revision binding and restricts `cancel` to the coordinator. Successful replay
reaches `cancelled` with reason `cancel`; the cached-frozen overlay is then
inapplicable. This tests reconstruction of a genuine signed terminal statement,
not a newly composed delivery workflow or a write to the source vault.

## Original archive recovery assertions remain intact

The owner backup is exported **before** the new cache fixtures, signed
withdrawal fixture, live hold release or peer expiry work. The pre-existing
assertion that export leaves the source coordination unchanged remains in
place. The new validator fixtures use copied state/evidence, and none of the
new steps rewrites the already exported backup.

A direct byte comparison confirms that the original section from the
`expected` restored record through cleanup and the existing 30-second case
limit is unchanged from PR #61. It still checks encrypted restore, canonical
record identity, original wants and inputs, identical signing identity,
repeated codec normalization, lock/unlock, matching-enabled refresh and
release of the restored local hold. The original view assertions also remain.
The only removed line in the test diff is the import line expanded to add the
withdrawal constant and validator; no assertion was removed or relaxed.

## Qualification and historical-evidence limits

This review performed source reads, parent/blob comparisons and lightweight
document checks only. It executed no compiler, domain suite, browser or remote
operation and changed no product/test file. The integration owner is running
the candidate's selected checks separately; their results require this exact
combined source or verified unchanged runtime/test bytes.

Earlier PR #61/G8 selected results at `94a34723`, and earlier 127/811-case
results, remain attached to their own sources. They are not executions of
the newly combined production test. The copied PR #60 handoff is preserved
historical evidence; its then-unexecuted status is not rewritten by this
source review. Its copied bytes have SHA-256
`fbf3fb76488ea6c2dca7b02bec3f9c4a2c254cec43f8c59c36b739e2ccc53a58`.

Current-source hosted/domain/browser gates, applicable CLI qualification and
the separate native WebKit existing-key import limitation remain outside this
review. There is no release approval, readiness-finding closure or branch
deletion recommendation here.
