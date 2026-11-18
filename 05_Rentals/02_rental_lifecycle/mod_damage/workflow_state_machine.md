# PS-041-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_damage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (claims, R16 dispute window), CTR-EVT-001 (revision), CTR-CAP-001 (case decisions), CTR-COM-001 cash ceiling.

**Decision labels:** D06 PROVISIONAL. Renter response window (72 h) and escalation rules are ASSUMPTION (OPEN, F05).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-041-03.R01 | Status set exactly REPORTED, ACKNOWLEDGED, CONTESTED, ESCALATED, DISPUTED, RESOLVED, WITHDRAWN. | MVP |
| PS-041-03.R02 | Silence is never acceptance. No line is agreed without renter `acknowledge` on that line. | MVP |
| PS-041-03.R03 | Renter has 72 h per report to act on each line (ASSUMPTION). Expiry → ESCALATED. | MVP |
| PS-041-03.R04 | A report without baseline (`baseline_present = false`) cannot reach ACKNOWLEDGED by owner-only action; it goes to ESCALATED for case review. | MVP |
| PS-041-03.R05 | RESOLVED with total ≤ held deposit → `deposit.partial_release` request. Excess above held amount → separate CTR-COM-001 claim by owner; this module does not collect it. | MVP |
| PS-041-03.R06 | Other transitions → `DAMAGE.INVALID_TRANSITION` (409). | MVP |

## Data / schema
Each event increments `state_version` by 1. Status never updated in place.

## Commands / queries / events
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | damage.reported | window open; validation passes | REPORTED | Notify renter; start 72 h timer |
| REPORTED | damage.acknowledged | renter accepts every line | ACKNOWLEDGED | Request deposit partial release |
| REPORTED | damage.contested | renter rejects ≥ 1 line | CONTESTED | Notify owner; open escalation review |
| REPORTED, CONTESTED | damage.escalated | 72 h expiry, R04, or unresolved contest | ESCALATED | Case queue (F12) |
| REPORTED | damage.withdrawn | owner withdraws | WITHDRAWN | Close; notify renter |
| ESCALATED, CONTESTED | damage.disputed | either party inside CTR-COM-001 R16 window | DISPUTED | Freeze; dispute record (F09) |
| ACKNOWLEDGED, DISPUTED | damage.resolved | agreement, or `mod` case decision | RESOLVED | Deposit or claim step (R05) |

## States & transitions
Terminal: RESOLVED, WITHDRAWN. Forbidden pairs return R06.

## Validation & errors
`DAMAGE.INVALID_TRANSITION` (409), `DAMAGE.ALREADY_RESOLVED` (409). Both non-retryable.

## Authorization
Renter acts on report lines; owner withdraws; `mod` case scope resolves disputes (PS-041-05).

## Failure, idempotency, concurrency, offline
Revision check on every write. Timer expiry runs as `sys` job, idempotent by `damage_id` and `state_version`.

## Privacy, retention, abuse
History is FINANCIAL_EVIDENCE (RET-EVD). Repeated owner reports with high contest rate trigger a review alert (ASSUMPTION).

## Observability & budgets
`damage_transitions_total{from,to}`, `damage_escalations_total{reason}`. Alert: any RESOLVED total above held amount without a separate claim record (must be 0).

## Tests
- TEST-PS-041-03-01 (state): every table row passes; every other pair returns R06.
- TEST-PS-041-03-02 (timeout): no acknowledgement for 72 h → ESCALATED, never ACKNOWLEDGED.
- TEST-PS-041-03-03 (baseline): no-baseline report cannot auto-acknowledge.
- TEST-PS-041-03-04 (excess): total above deposit yields partial release for held amount plus a claim request for the excess.

## Acceptance criteria
1. No path reaches ACKNOWLEDGED without per-line renter action (TEST-PS-041-03-01).
2. Silence never results in acceptance (TEST-PS-041-03-02).
3. Excess above held amount never collected through the platform (TEST-PS-041-03-04).

## Assumptions & open decisions
- ASSUMPTION: 72 h response window; F05 to confirm (OPEN).
- PROVISIONAL (D06 default, unapproved).
