# PS-084-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_records. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R02, R03), CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-084-02.R01 | Reject `federate = true` on an item whose type has `federate_mode = never` with `RECORDS.CLASS_NOT_FEDERABLE` (422). | MVP |
| PS-084-02.R02 | Reject `federate = true` on `opt_in` type without an explicit `federate_opt_in_at` from the owner with `RECORDS.OPT_IN_REQUIRED` (422). | MVP |
| PS-084-02.R03 | Reject a federate change for an unregistered `record_type` with `RECORDS.TYPE_UNREGISTERED` (422). | MVP |
| PS-084-02.R04 | Reject a `cell` item whose region is not a registered cell with `RECORDS.CELL_UNREGISTERED` (422). | MVP |

## Data / schema
Applies to [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `records.set_federate`.

## States & transitions
Validation precedes transitions in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | Category / HTTP |
|---|---|---|
| RECORDS.CLASS_NOT_FEDERABLE | false | unprocessable_state / 422 |
| RECORDS.OPT_IN_REQUIRED | false | unprocessable_state / 422 |
| RECORDS.TYPE_UNREGISTERED | false | unprocessable_state / 422 |
| RECORDS.CELL_UNREGISTERED | false | unprocessable_state / 422 |

## Authorization
Shape validation first; unreadable items give `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Deterministic; no value echo.

## Privacy, retention, abuse
Errors name type and rule only.

## Observability & budgets
Counter `records_validation_failures_total{code}`.

## Tests
- TEST-PS-084-02-01 (unit): R01–R04 codes.
- TEST-PS-084-02-02 (negative): `never` type cannot be flagged even by owner.
- TEST-PS-084-02-03 (negative): cell item with unregistered cell rejected.

## Acceptance criteria
1. All four codes tested.
2. No value echo.

## Assumptions & open decisions
- PENDING CTR-PRV-001 registered cell set (K_MIN = 5 per R04, ASSUMPTION).
