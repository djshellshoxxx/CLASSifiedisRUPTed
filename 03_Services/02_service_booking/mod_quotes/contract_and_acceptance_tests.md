# PS-032-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_quotes. **Parent:** [mod_quotes SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-032-09.R01 | Contract tests validate all commands and events against CTR-SCH-001. | MVP |
| PS-032-09.R02 | End-to-end: create → send (holds) → accept (trx, booking link) for a single-window service. | MVP |
| PS-032-09.R03 | End-to-end: multi-window quote (3 windows) with one window lost before accept → `SVCQUOTE.HOLD_LOST`. | MVP |
| PS-032-09.R04 | Accessibility: price, tax mode and line items announced together; accept control names the amount. | MVP |

## Data / schema
Fixtures: `fixtures/svquote/single_window_accept.json`, `three_window_hold_lost.json`, `tax_mode_matrix.json` (names proposed; created in implementation phase). Synthetic accounts only.

## Commands / queries / events
Recorded event replay through outbox and consumers.

## States & transitions
Each state in PS-032-03 has a positive and a negative test.

## Validation & errors
Error-code coverage 100% for SVCQUOTE codes.

## Authorization
Matrix tests from PS-032-05 included.

## Failure, idempotency, concurrency, offline
Chaos: F09 timeout, duplicate accept, expiry during accept, supersede race.

## Privacy, retention, abuse
Fixtures contain no real contact details; scope text fixtures use placeholder strings.

## Observability & budgets
Contract suite ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-032-09-01 (contract): all commands and events validate.
- TEST-PS-032-09-02 (e2e): single-window accept creates one trx and one booking link.
- TEST-PS-032-09-03 (e2e): three-window hold lost → no trx, no partial booking.
- TEST-PS-032-09-04 (a11y): quote review screen passes keyboard and announcement checks.
- TEST-PS-032-09-05 (property): `tax_mode` values produce the same `price_minor` and `price_hash` for identical line items.

## Acceptance criteria
1. Both e2e flows pass, including failure path.
2. Error-code coverage 100%.
3. No test asserts a PAID or SETTLED label.

## Assumptions & open decisions
- ASSUMPTION: WCAG 2.1 AA as CI accessibility mapping.
- OPEN: how tax-inclusive pricing is modelled across currencies. See [DECISIONS.md](../../../DECISIONS.md) D03.
