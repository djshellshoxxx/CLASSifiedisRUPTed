# PS-089-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_blocklists. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision, events), CTR-CAP-001 (self-approval, dual control), CTR-FED-001 (peer states), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-089-03.R01 | Five states: `proposed`, `active`, `rejected`, `withdrawn`, `expired`. Terminal: `rejected`, `withdrawn`, `expired`. Transitions not in the table return `BLOCKLISTS.STATE_FORBIDS`. | MVP |
| PS-089-03.R02 | Activation requires approver ≠ proposer (`CAP.SELF_APPROVAL_FORBIDDEN`). For `scope = federate`, a second distinct `ope_` is required (`CAP.DUAL_APPROVAL_REQUIRED`; ASSUMPTION). | MVP |
| PS-089-03.R03 | Check index reflects a committed status change within 5 s. Expiry is applied within 60 s of `expires_at`. | MVP |
| PS-089-03.R04 | Terminal entries never return to `active`. Re-listing a target creates a new `blk_` in `proposed`. | MVP |

## Data / schema
State is `status` and `revision` on the entry (PS-089-01). Each transition increments `revision` by 1 under the aggregate lock (CTR-EVT-001 R02).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | propose (local) | valid per PS-089-02; `cas_` open | proposed | emit `blocklist.proposed` |
| (none) | import (peer) | origin `trusted` or `restricted`; no local override | proposed | emit `blocklist.proposed` |
| (none) | import (peer) | local withdrawal or rejection exists | rejected | emit `blocklist.rejected`, code `LOCAL_OVERRIDE_PRESENT` |
| proposed | activate | approver ≠ proposer; dual control if federate; revision matches | active | index add; queue export if federate; emit `blocklist.activated` |
| proposed | reject | approver ≠ proposer | rejected | emit `blocklist.rejected` |
| proposed | withdraw | actor is proposer or `ope_` | withdrawn | emit `blocklist.withdrawn` |
| proposed | expire | now ≥ `expires_at` | expired | emit `blocklist.expired` |
| active | withdraw | actor is proposer, approver or `ope_` | withdrawn | index remove; export withdrawal if federated; emit |
| active | expire | now ≥ `expires_at` | expired | index remove; emit `blocklist.expired` |
| proposed or active | rollback batch | dual control; source `dlv_` matches | withdrawn (`batch_rollback`) | index remove; emit `blocklist.withdrawn` |

## Validation & errors
`BLOCKLISTS.STATE_FORBIDS` (unprocessable_state / 422, non-retryable) for any unlisted pair. `EVT.REVISION_CONFLICT` (CTR-EVT-001) on stale `expected_revision`.

## Authorization
Actor rules in PS-089-05.

## Failure, idempotency, concurrency, offline
- Each transition commits atomically with its event and revision bump.
- Duplicate command with same idempotency key returns the original result (CTR-EVT-001 R03).
- Two concurrent activations: first commit wins; second receives `EVT.REVISION_CONFLICT`.
- Expiry job transitions only if status is still `proposed` or `active` and now ≥ `expires_at`; repeated runs are no-ops.
- Offline: state changes are online-only (PS-089-06).

## Privacy, retention, abuse
Transition events carry `blk_` ID, status and codes only.

## Observability & budgets
`blocklist_transitions_total{from,to}`. Alert on any rate of `STATE_FORBIDS` above 1 per minute (ASSUMPTION).

## Tests
- TEST-PS-089-03-01 (unit): every from × event pair is either in the table or returns `STATE_FORBIDS`.
- TEST-PS-089-03-02 (property): random event sequences never reach `active` from a terminal state.
- TEST-PS-089-03-03 (integration): concurrent activate race; exactly one commit.
- TEST-PS-089-03-04 (unit): self-approval blocked for propose-then-activate by same principal.
- TEST-PS-089-03-05 (integration): expiry at boundary; entry enforced until `expires_at`, then not.
- TEST-PS-089-03-06 (integration): batch rollback from `proposed` and from `active`.

## Acceptance criteria
1. Transition table is exhaustive; TEST-PS-089-03-01 passes.
2. No terminal-to-active path; TEST-PS-089-03-02 passes.
3. Rollback leaves zero `active` entries from the rolled-back batch; TEST-PS-089-03-06 passes.

## Assumptions & open decisions
- ASSUMPTION: dual control for federate scope (F16 to confirm).
- PROVISIONAL (D01 default, unapproved): imported entries never activate without local acceptance.
- D08 not applicable: blocklist writes are online-only.
