# PS-073-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_currency (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (currency object, Tests 01, 09), CTR-SCH-001 (R09), CTR-EVT-001. **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-073-09.R01 | Golden fixtures for every supported ISO 4217 code exponent and every registered asset. | MVP |
| PS-073-09.R02 | Consumer contract tests for mod_rates, mod_precision, mod_cash, mod_crypto, mod_receipts and LocalMutiny `mod_currency`. | MVP |
| PS-073-09.R03 | Schema migration golden fixtures for each supported `from` version (CTR-SCH-001 R09). | MVP |
| PS-073-09.R04 | Accessibility: currency labels include name and code (not symbol alone). | MVP |

## Data / schema
Fixture: registry snapshot; ISO list snapshot; asset list snapshot.

## Commands / queries / events
Replay of registry events.

## States & transitions
Shared with PS-073-03.

## Validation & errors
Shared with PS-073-02.

## Authorization
Shared with PS-073-05.

## Failure, idempotency, concurrency, offline
Shared with PS-073-06.

## Privacy, retention, abuse
Shared with PS-073-07.

## Observability & budgets
Shared with PS-073-08.

## Tests
- TEST-PS-073-09-01 (golden): exponent fixtures.
- TEST-PS-073-09-02 (contract): consumer tests.
- TEST-PS-073-09-03 (e2e): register asset, enable, propose, disable, claim remains valid.
- TEST-PS-073-09-04 (a11y): currency label review.

## Acceptance criteria
1. Golden fixtures pass.
2. Consumer contract tests pass.
3. E2E lifecycle passes.

## Assumptions & open decisions
- D03 (PROVISIONAL, unapproved).
