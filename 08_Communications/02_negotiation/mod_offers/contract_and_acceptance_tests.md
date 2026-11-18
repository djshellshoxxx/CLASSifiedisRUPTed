# PS-063-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_offers. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02, R03, R04), CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-063-09.R01 | Contract tests for `offer.v1` and `offer.*` events in CI. | MVP |
| PS-063-09.R02 | Money fixtures include minor-unit exponents 0, 2, 6 and 18 and the boundary 39-digit value. | MVP |
| PS-063-09.R03 | Every requirement in PS-063-01 to -08 maps to a test ID below. | MVP |
| PS-063-09.R04 | Accessibility: amounts read with currency name, not code alone; counter form labelled; 200% zoom. | MVP |

## Data / schema
Fixtures in `fixtures/offers/`: valid listing offer; barter with item compensation; cross-currency with pinned quote; float amount; leading-zero amount; 21 rapid offers.

## Commands / queries / events
Replay of [PS-063-04](commands_queries_events.md).

## States & transitions
Matrix from [PS-063-03](workflow_state_machine.md).

## Validation & errors
Each code in [PS-063-02](validation_rules.md).

## Authorization
Matrix from [PS-063-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Scenarios from [PS-063-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Assertions from [PS-063-07](privacy_retention_abuse.md).

## Observability & budgets
Checks from [PS-063-08](observability_performance.md).

## Tests
| Test ID | Type | Covers |
|---|---|---|
| TEST-PS-063-09-01 | contract | command and event shapes |
| TEST-PS-063-09-02 | unit | money format and exponent rules |
| TEST-PS-063-09-03 | unit | validation codes |
| TEST-PS-063-09-04 | integration | transition table and expiry race |
| TEST-PS-063-09-05 | property | version chain append-only; digest stable |
| TEST-PS-063-09-06 | e2e | listing offer → counter → accept → consent given |
| TEST-PS-063-09-07 | e2e | barter with mixed compensation pinned quote |
| TEST-PS-063-09-08 | offline | queued accept after expiry rejected |
| TEST-PS-063-09-09 | a11y | money input and counter form |
| TEST-PS-063-09-10 | negative | probing, third-party reads, float amounts |

## Acceptance criteria
1. TEST-PS-063-09-01 to -10 and PS-063-01 to -08 IDs pass in CI.
2. Money contract tests pass for all four exponent fixtures.

## Assumptions & open decisions
- ASSUMPTION: fixtures synthetic.
- Future-phase execution only.
