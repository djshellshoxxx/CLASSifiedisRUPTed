# PS-024-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R09), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-024-03.R01 | States: open, awaiting_attestations, compensating, closed_complete, closed_partial, escalated. | MVP |
| PS-024-03.R02 | Closed states are terminal; escalated waits for an external decision. | MVP |
| PS-024-03.R03 | Closing requires either all attestations agreeing on outcome or window end with compensation applied. | MVP |
| PS-024-03.R04 | Each transition emits one event with the cycle correlation_id. | MVP |

## Data / schema
State in `status`; attestation history in events.

## Commands / queries / events
PS-024-04.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | cycle.open_recovery | locked cycle; dropout or window | open | emit recovery_opened; notify parties by pseudonym |
| open | start | — | awaiting_attestations | window timer starts (7 days) |
| awaiting_attestations | cycle.attest | all parties attested, all agree | compensating | build plan |
| awaiting_attestations | window ends | not all agree or missing | compensating | plan from available attestations plus missing = not_given |
| awaiting_attestations | cycle.attest | disagreement | escalated | emit escalated |
| compensating | cycle.compensate done | all release actions done | closed_complete | emit closed |
| compensating | cycle.compensate partial | some actions failed | closed_partial | retry queue; emit closed |

## Validation & errors
PS-024-02; invalid transitions SYS.UNPROCESSABLE_STATE.

## Authorization
PS-024-05.

## Failure, idempotency, concurrency, offline
Window timer is server-side; offline attestation is not accepted until acknowledged (D08).

## Privacy, retention, abuse
Escalation carries minimum data (PS-024-07).

## Observability & budgets
Time per state (PS-024-08).

## Tests
- TEST-PS-024-03-01 (unit): every table row.
- TEST-PS-024-03-02 (property): closed states never reopen.
- TEST-PS-024-03-03 (integration): silent party at window end leads to compensating with not_given.

## Acceptance criteria
1. Every recovery reaches a closed or escalated state within window + 14 days (ASSUMPTION).
2. No `closed_complete` while any listing release action is pending.
3. Escalated cases hold no compensation actions.

## Assumptions & open decisions
- ASSUMPTION: 7-day window, 14-day escalation bound.
- PROVISIONAL (D04 default, unapproved).
