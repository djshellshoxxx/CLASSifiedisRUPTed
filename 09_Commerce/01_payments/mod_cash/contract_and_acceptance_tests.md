# PS-067-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_cash (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (Tests 01–13), CTR-EVT-001, CTR-ERR-001, CTR-SCH-001. **Decisions:** D03, D06 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-067-09.R01 | CTR-COM-001 tests 01–04, 10, 11, 13 run in CI for every cash path. | MVP |
| PS-067-09.R02 | Cash-specific contract tests cover PS-067-02 error table and PS-067-03 table. | MVP |
| PS-067-09.R03 | Wording scan is a blocking CI check. | MVP |
| PS-067-09.R04 | Accessibility: cash labels and "not verified" copy pass WCAG 2.1 AA checks. | MVP |

## Data / schema
Fixtures: one trx, two parties, EUR (exponent 2), JPY-like currency (exponent 0), one configured ceiling per currency.

## Commands / queries / events
Replayed command sequences per schema version.

## States & transitions
Table tests shared with PS-067-03.

## Validation & errors
Error contracts shared with PS-067-02.

## Authorization
Matrix tests shared with PS-067-05.

## Failure, idempotency, concurrency, offline
Chaos: duplicate submit, offline reconnect, concurrent attest and dispute.

## Privacy, retention, abuse
Federation and log lint tests shared with PS-067-07.

## Observability & budgets
Alert tests shared with PS-067-08.

## Tests
- TEST-PS-067-09-01 (contract): claim schema round-trip for cash claims.
- TEST-PS-067-09-02 (property): cash never exceeds `COUNTERPARTY_ATTESTED`.
- TEST-PS-067-09-03 (e2e): submit cash claim, counterparty attests, claim stays attested.
- TEST-PS-067-09-04 (golden): ceiling checks for exponent 0 and 2 (D03 vectors).
- TEST-PS-067-09-05 (a11y): cash claim screen passes automated and manual checks.

## Acceptance criteria
1. CTR-COM-001 tests 01–04, 10, 11, 13 pass for cash.
2. All PS-067 requirement IDs map to at least one test ID.
3. Wording scan passes.

## Assumptions & open decisions
- ASSUMPTION: test fixtures use placeholder ceilings.
- D03, D06 (PROVISIONAL, unapproved).
