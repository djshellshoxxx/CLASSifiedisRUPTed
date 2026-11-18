# PS-067-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_cash (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (Observability section), CTR-EVT-001, CTR-PRV-001 (R09). **Decisions:** D06 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-067-08.R01 | Metrics: `cash_claims_total{state}`, `cash_rejections_total{code}`, `cash_disputes_total`. No amount or party label. | MVP |
| PS-067-08.R02 | Claim submit p95 ≤ 300 ms server side (ASSUMPTION). | MVP |
| PS-067-08.R03 | Alert: any cash claim reaching `EXTERNALLY_VERIFIED` (must be 0). | MVP |
| PS-067-08.R04 | Logs: claim ID, event type, revision, code. | MVP |

## Data / schema
Metric schema is closed; labels from enum sets only.

## Commands / queries / events
Event counts by type.

## States & transitions
Gauge of claims by state.

## Validation & errors
Counter by code.

## Authorization
Dashboards are aggregate and restricted to the Commerce Lead and on-call.

## Failure, idempotency, concurrency, offline
Offline pending claims are counted separately on the client only in aggregate.

## Privacy, retention, abuse
Metrics retained 90 days (ASSUMPTION); logs 14 days.

## Observability & budgets
Alert on rejection rate above 10% per hour for `CASH.METHOD_DISABLED` (config drift).

## Tests
- TEST-PS-067-08-01 (contract): metric label lint.
- TEST-PS-067-08-02 (integration): synthetic verify attempt raises the "must be 0" alert.
- TEST-PS-067-08-03 (unit): log redaction removes amounts.

## Acceptance criteria
1. Budgets measured in load test.
2. "Must be 0" alert configured and tested.
3. No payment content in logs.

## Assumptions & open decisions
- ASSUMPTION: metric retention 90 days.
- D06 (PROVISIONAL default, unapproved).
