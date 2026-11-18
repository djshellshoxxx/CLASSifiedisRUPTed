# PS-027-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_valuation. **Parent:** [mod_valuation SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (quote, currency), CTR-EVT-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-027-09.R01 | Contract tests validate snapshot against the quote and currency `$ref` definitions in CTR-COM-001. | MVP |
| PS-027-09.R02 | Rounding test vectors cover HALF_EVEN ties at exponent 0, 2 and 6. | MVP |
| PS-027-09.R03 | Negative tests cover all seven VALUE codes and both STALE transitions. | MVP |
| PS-027-09.R04 | Accessibility: snapshot table has row/column headers, and currency codes are announced with amounts. | MVP |

## Data / schema
Fixtures: `fixtures/valuation/two_party_eur_usd.json`, `sixteen_items_mixed_currency.json`, `tie_rounding_vectors.json` (names proposed; created in implementation phase). Each pins quotes and expected hashes.

## Commands / queries / events
Contract tests replay recorded quote events and compare snapshot hashes.

## States & transitions
Each state in PS-027-03 has positive and negative tests.

## Validation & errors
Error-code coverage must reach 100% for VALUE codes in CI.

## Authorization
Matrix tests from PS-027-05 included.

## Failure, idempotency, concurrency, offline
Chaos cases: quote duplicate delivery, out-of-order quote expiry, revision change during compute.

## Privacy, retention, abuse
Fixtures use synthetic `acc_` and `lst_` IDs only.

## Observability & budgets
Contract suite ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-027-09-01 (contract): snapshot validates against CTR-COM-001 quote/currency refs.
- TEST-PS-027-09-02 (property): sum of converted lines equals per-party totals after rounding; error bound ≤ 1 minor unit per line.
- TEST-PS-027-09-03 (unit): HALF_EVEN vectors at exponent 0, 2, 6 match.
- TEST-PS-027-09-04 (a11y): snapshot table passes header and announcement checks.

## Acceptance criteria
1. All tie-rounding vectors pass.
2. Error-code coverage 100%.
3. Hash stability test passes across implementations (JCS).

## Assumptions & open decisions
- ASSUMPTION: WCAG 2.1 AA as the CI accessibility mapping.
- PROVISIONAL: HALF_EVEN rounding (D03 default, unapproved). Rounding authority is F09.S03.M03. See [DECISIONS.md](../../../DECISIONS.md).
