# Independent freeze-reason correctness review — G8

## Result and exact source

No blocking defect introduced by this change was identified. The production
edit preserves the two documented local freeze causes while keeping the
existing recovery-marker behavior, terminal-state boundary and compatibility
fallback. The added assertions extend ordinary signed lifecycle cases and
match the persistence and normalization paths they exercise.

| Identity | Reviewed value |
|---|---|
| Integrated commit | `94a34723108cf60db3b9bab1c669f5c9b5c36cd3` |
| Integrated tree | `1c7f8a1c4be00b81a9d2098673eb4fc6ddff7fe4` |
| Published parent, draft PR #59 | `86cd564e0692e8c777538200675dc20f2651ab51` |
| Production blob, `packages/mutiny/src/trade_proposals/repository.ts` | `0554e07aa0cead3ac61b44e75faa34dba5452a9b` |
| Test blob, `tests/integration/mutiny-persistence.test.ts` | `6d1ac8b5851bc0884bd2cdf8f0e88e3a6ea288c7` |

The delta from the published parent contains one production block, an
additional helper called by two existing test cases, and the worker handoff.
I traced the changed block through evidence replay, state evaluation, normal
ingest/refresh writers and the production backup codec. Production and tests
were left unchanged. No compiler, product test or browser was run in this
review lane; the integration owner owns executed qualification.

## Contract and ordinary cause creation

The [Mutiny package contract](../../../../packages/mutiny/README.md) requires
an expired signed reservation or lost local hold to freeze an already
committed exchange, and requires refresh on unlock, return and timer ticks.
The historical [persistence verification](../../../../planning/verification-mutiny-persistence.md)
explicitly records that the expiry and other-local-loss explanations must
remain distinct. This correction follows that existing distinction.

In the state machine, `tick` changes a committed coordination to
`frozen / reservation_expired` when a participant's selected reservation has
expired. In the repository refresh handler, time evaluation runs before the
local-hold guard; a still-committed coordination without its actual local hold
becomes `frozen / local_reservation_lost`. The ingest handler also records
local hold loss for an already committed state. Terminal results release own
holds through the existing transaction-scoped callback.

Those local causes need not be reproduced by signed-evidence replay alone:
the live hold is separate from the signed reservation claim, and replay may
not yet have reached the final observation clock. The prior generic freeze
conversion could therefore replace a persisted local cause with
`conflicting_promise` during a later reconstruction.

## Changed branch and terminal precedence

The new block is entered only when the saved status is `frozen` and replay
has produced an active state (`proposed` or `committed`). It spreads the
reconstructed state, rather than copying the saved proposal, evidence or
commitment fields wholesale.

| Saved cause and replay result | New behavior |
|---|---|
| `reservation_expired`, replay still active | Preserve frozen status and the saved expiry cause |
| `local_reservation_lost`, replay still active | Preserve frozen status and the saved local-loss cause |
| `restore_requires_review`, replay still active | Preserve the existing recovery marker and explicitly null both local verdict fields |
| Any other/null saved cause, replay still active | Use the existing generic `freezeConflict` fallback |
| Replay already `cancelled`, `declined` or `frozen` | Leave that replayed terminal result unchanged |

The final row is equivalent to the previous call to `freezeConflict` on a
terminal state: that helper returns terminal states unchanged. Thus the edit
does not replace an already replayed withdrawal, decline, fork freeze or
other terminal result with a cached local explanation. This conclusion is
about outcomes already produced by replay at this block; it does not certify
every historical clock/evidence ordering in the broader algorithm.

After this block, final evaluation cannot recommit the record. `tick` retains
a terminal frozen status, and `evaluateCoordination` allows a new commitment
only from `proposed`. The changed branch cannot create signed consent,
reservation evidence, inventory ownership or a fresh local commitment.
Existing hold-release logic, caller authorization, transaction boundaries,
view action conditions and signature verification paths are unchanged.

## Live metadata versus external normalization

The private reconstruction path can replay an established local commitment
using its existing cached verdict and verified evidence. The two newly
preserved causes retain the metadata of that reconstructed live state. The
patch does not null valid historical commitment fields merely to preserve a
display reason.

External normalization calls reconstruction with `trustLocalVerdict = false`.
`openCoordination` starts with null commitment/feasibility, and the only
historical-commit replay helper is disabled by that flag. The ordinary
evidence ingestion paths do not independently establish a local commitment.
Preserving either cause therefore retains null local verdict fields on that
path. Repeated normalization cannot acquire a verdict from the saved cache.
The separate `restore_requires_review` branch continues to clear both fields
explicitly, and the existing first conversion of restored committed records
is unchanged.

The two retained strings describe saved local observations. Preserving them
does not authenticate those causes as signed peer statements or make them
authority to resume a trade. This is consistent with the existing conservative
policy that saved freezes remain terminal.

The reason schema remains nullable text with its existing 100-character cap.
No enum tightening, migration, record-key change or backup-format change is
introduced. Unknown reasons continue through the existing compatibility
fallback; the patch does not begin accepting arbitrary new active transitions.

## Assessment of the extended lifecycle cases

Both callers use the existing fixture's real Ed25519 identities, signed
proposals/reservations/consents, actual Bazaar commands and authoritative
transaction-scoped inventory/feasibility callbacks. They first reach a real
local commitment. The local-loss case releases its actual hold; the expiry
case advances the fake clock beyond the signed reservation expiry. Both
then run the real repository refresh and assert the initial distinct cause.

The new helper subsequently checks another ordinary refresh, close/reopen of
the same IndexedDB database, and another refresh. The fixture's restart keeps
the same identity, clock and database factory/name, reopens storage and
reattaches the bus; it does not seed a replacement coordination. The helper
compares the entire domain state and verifies that the real hold stays
released. It then normalizes the saved row twice, expecting preserved cause
and evidence with null local verdicts, and rereads live storage to establish
that detached normalization did not alter its historical commitment.

The added repeated operations keep the fake clock fixed, so whole-state
equality includes a stable observation time in these cases. The assertions
do not claim that future refreshes never advance `lastObservedAt`. The helper
also compares the domain state rather than freezing repository revision
numbers; ordinary refresh is still allowed to advance the stored revision.

These are extensions to two existing cases, not additional case counts. No
timeout, assertion in the existing lifecycle, dependency, workflow selection
or product limit was weakened. The fixture uses the production ordinary
IndexedDB adapter over `fake-indexeddb`; it does not test encrypted identity
storage, real browser durability or process-crash recovery. The separate
production barter case covers the encrypted restore-to-review behavior and
should remain in the integration owner's affected regression selection.

## Review boundary

Source/blob readback and `git diff --check` against the published parent
completed without a finding. A separate read-only fixture assessment agreed
that the ordinary setup, restart and metadata expectations are coherent.
No malformed state, archive or vulnerability reproduction was constructed.

Only this review artifact was written. Current-source compiler and selected
runtime results, full hosted Alpha/browser and applicable CLI qualification,
publication identity and merge gates remain the integration owner's
responsibility. Prior-source full-suite results must not be reassigned to
this changed production source.
