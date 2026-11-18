# PS-086-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_conflicts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (peer states and transitions; R06 quarantine; R13 per-event results), CTR-EVT-001 (R02 revision), CTR-CAP-001 (R07 dual control, R08 audit), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-086-03.R01 | Conflict record states: `open`, `reviewed`, `closed`. `closed` is terminal. | MVP |
| PS-086-03.R02 | No stored aggregate is overwritten or deleted by a conflict. Local state changes are limited to quarantine of the peer and the conflict record. | MVP |
| PS-086-03.R03 | A held revision-gap event expires after 24 h (ASSUMPTION) → rejected with `CONFLICTS.REVISION_GAP`. Held events are released in revision order when the gap fills. | MVP |
| PS-086-03.R04 | Restoring a `quarantined` peer requires a review record that names the reviewer, decision and time, and two distinct `ope_` approvers (ASSUMPTION). Without it → `CONFLICTS.REVIEW_REQUIRED`. | MVP |
| PS-086-03.R05 | Quarantine and conflict-record creation commit in one transaction. A conflict never exists without the peer state change for `equivocation`. | MVP |

## Data / schema
State is `status` on the conflict record and the peer `trust_state` (CTR-FED-001). Each change increments the conflict record `revision` (CTR-EVT-001 R02).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | equivocation detected | R02 true; not already recorded | open | insert conflict; peer → quarantined; emit `conflict.opened` |
| (none) | revision gap detected | R03 true | open | hold event; emit `conflict.opened` |
| open (gap) | gap filled | predecessor stored | closed | release held events in order; emit `conflict.closed` |
| open (gap) | hold expires | now ≥ hold start + 24 h | closed | reject held event with `CONFLICTS.REVISION_GAP`; emit `conflict.closed` |
| open (equivocation) | review recorded | R04 review record and approvals | reviewed | emit `conflict.reviewed` |
| reviewed | close | decision recorded | closed | emit `conflict.closed` |
| quarantined peer | peer.restored | R04 satisfied; no open equivocation for peer | (peer) trusted or restricted | emit `peer.restored` (CTR-FED-001) |

## Validation & errors
Invalid transitions return `CONFLICTS.REVIEW_REQUIRED` (for restore) or `EVT.REVISION_CONFLICT` (for stale `expected_revision`, CTR-EVT-001).

## Authorization
Actor rules in PS-086-05.

## Failure, idempotency, concurrency, offline
- Equivocation transaction: conflict insert, peer quarantine and both event references are atomic.
- Two concurrent detections for one pair: one row (PS-086-01 R03); both arrivals keep their evidence.
- Gap-hold expiry job is idempotent; repeats are no-ops.
- Offline: not applicable (server-side).

## Privacy, retention, abuse
Transition events carry IDs, kind, status and codes only.

## Observability & budgets
`conflict_transitions_total{from,to}`. Page on any new equivocation. Warn when a gap hold exceeds 1 h.

## Tests
- TEST-PS-086-03-01 (unit): every from × event pair is in the table or refused.
- TEST-PS-086-03-02 (integration): equivocation insert, quarantine and evidence commit together; forced failure mid-transaction leaves no partial state.
- TEST-PS-086-03-03 (integration): gap event released in order when predecessor arrives.
- TEST-PS-086-03-04 (integration): gap event rejected after 24 h with `CONFLICTS.REVISION_GAP`.
- TEST-PS-086-03-05 (negative): restore without review record returns `CONFLICTS.REVIEW_REQUIRED`.

## Acceptance criteria
1. Transition table is exhaustive; TEST-PS-086-03-01 passes.
2. No partial equivocation state after injected failure; TEST-PS-086-03-02 passes.
3. Restore requires review; TEST-PS-086-03-05 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: 24 h gap hold; two-approver review for restore (F11 to confirm).
- PROVISIONAL (D01 default, unapproved): equivocation is a quarantine trigger.
