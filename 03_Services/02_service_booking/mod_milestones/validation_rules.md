# PS-031-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_milestones. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-COM-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-031-02.R01 | Validation is server-side before any write. | MVP |
| PS-031-02.R02 | Plan creation: count 1–12, else `MILESTON.COUNT_INVALID`. | MVP |
| PS-031-02.R03 | Amount regex `^(0|[1-9][0-9]{0,38})$`; violation → `MILESTON.AMOUNT_INVALID`. | MVP |
| PS-031-02.R04 | Sum ≠ accepted quote total → `MILESTON.SUM_MISMATCH` (details: rule `sum`, no values echoed). | MVP |
| PS-031-02.R05 | Currency ≠ booking currency → `MILESTON.CURRENCY_MISMATCH`. | MVP |
| PS-031-02.R06 | `acceptance_text` > 1,000 scalars or control characters → `MILESTON.TEXT_INVALID`. | MVP |
| PS-031-02.R07 | `due_at` outside booking window → `MILESTON.DUE_OUT_OF_RANGE`. | MVP |
| PS-031-02.R08 | Plan edits after first `in_progress` milestone are refused with `MILESTON.PLAN_LOCKED` except by mutual consent (see state file). | MVP |
| PS-031-02.R09 | Acceptance or rejection of a milestone not in `submitted` → `MILESTON.INVALID_TRANSITION`. | MVP |
| PS-031-02.R10 | Rejection reason enum (`NOT_MET`, `INCOMPLETE`, `WRONG_SCOPE`, `OTHER`) required; `OTHER` needs note ≤ 500 scalars. | MVP |

## Data / schema
Rule outputs use closed `details[].rule` values: `count`, `amount`, `sum`, `currency`, `text`, `due_range`, `lock`, `state`, `reason`. Values never echoed (CTR-ERR-001 R07).

## Commands / queries / events
Validation precedes each command in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Guards for transitions in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | message_key |
|---|---|---|
| MILESTON.COUNT_INVALID | false | err.milestone.count_invalid |
| MILESTON.AMOUNT_INVALID | false | err.milestone.amount_invalid |
| MILESTON.SUM_MISMATCH | false | err.milestone.sum_mismatch |
| MILESTON.CURRENCY_MISMATCH | false | err.milestone.currency_mismatch |
| MILESTON.TEXT_INVALID | false | err.milestone.text_invalid |
| MILESTON.DUE_OUT_OF_RANGE | false | err.milestone.due_out_of_range |
| MILESTON.PLAN_LOCKED | false | err.milestone.plan_locked |
| MILESTON.INVALID_TRANSITION | false | err.milestone.invalid_transition |

## Authorization
Validation runs after capability checks ([authorization_capabilities.md](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Deterministic for the same quote version. Offline plan edits are not validated locally beyond format; server validation on relay receipt (D08 PROVISIONAL).

## Privacy, retention, abuse
Rejected text not stored. Rule counters only.

## Observability & budgets
Counter per rule. Validation p95 ≤ 10 ms excluding I/O (ASSUMPTION).

## Tests
- TEST-PS-031-02-01 unit: one case per code.
- TEST-PS-031-02-02 property: sums of random splits with one minor unit off are rejected.
- TEST-PS-031-02-03 negative: `OTHER` without note rejected.

## Acceptance criteria
1. Every rule R01–R10 maps to one code or pass.
2. No error body contains amounts or note text.
3. Sum check is exact integer comparison.

## Assumptions & open decisions
- ASSUMPTION: plan lock at first `in_progress`.
- Payment checklist applies: CTR-COM-001 R02 amount encoding.
