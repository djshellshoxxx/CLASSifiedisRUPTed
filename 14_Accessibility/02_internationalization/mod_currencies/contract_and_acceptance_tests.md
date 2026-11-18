# PS-112-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_currencies. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-COM-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-112-09.R01 | Golden fixtures include JPY (0), EUR (2), BHD (3) and one asset with 6 decimals. | MVP |
| PS-112-09.R02 | Round trip parse-format-parse is identity for all exponents 0–8 across 10,000 generated values. | MVP |
| PS-112-09.R03 | Contract tests run on every schema change. | MVP |

## Data / schema
Fixtures: catalog v1.0.0 with 12 codes; locale formats for en, de, ja, ar (digits and separators).

## Commands / queries / events
Replays of `cur.catalog.publish` and `currency_catalog.published`.

## States & transitions
Per [PS-112-03](workflow_state_machine.md) series.

## Validation & errors
Negative fixtures per [PS-112-02](validation_rules.md).

## Authorization
Per [PS-112-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Per [PS-112-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Per [PS-112-07](privacy_retention_abuse.md).

## Observability & budgets
Per [PS-112-08](observability_performance.md).

## Tests
- TEST-PS-112-09-01 property: round trip per R02.
- TEST-PS-112-09-02 golden: formatted strings for fixtures match.
- TEST-PS-112-09-03 contract: publish and event schemas validate.

## Acceptance criteria
1. Round trip holds for 10,000 generated values per exponent.
2. Golden strings match in all four locales.

## Assumptions & open decisions
- ASSUMPTION: locale golden strings generated from a CLDR version recorded at implementation.
- No Dxx decision directly affects testing.
