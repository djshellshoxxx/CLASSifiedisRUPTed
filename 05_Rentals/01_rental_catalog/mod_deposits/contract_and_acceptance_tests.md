# PS-040-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_deposits. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (fixtures for claims), CTR-EVT-001 (envelope tests), CTR-ERR-001 (error tests), CTR-CAP-001 (authz tests), CTR-SCH-001 (golden fixtures).

**Decision labels:** D09 PROVISIONAL (no custody). D03 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-040-09.R01 | Contract tests run against each published `deposit` schema version and each CTR-COM-001 claim version used. | MVP |
| PS-040-09.R02 | Every `DEPOSITS.*` code has one test asserting code, category, HTTP status and `retryable`. | MVP |
| PS-040-09.R03 | Golden fixtures exist for every supported migration path (CTR-SCH-001 R09). | MVP |
| PS-040-09.R04 | Acceptance suite includes one end-to-end flow: propose → agree → record_given → attest → hold → request release → release. | MVP |
| PS-040-09.R05 | Suite runs in CI on every merge; a failing test blocks merge. | MVP |

## Data / schema
Fixtures: `deposit` valid and invalid samples; claim samples from CTR-COM-001 (valid, cash, cross-currency rejected); `terms_hash` vectors.

## Commands / queries / events
Event envelope tests check required fields, `max_data_class = FINANCIAL_EVIDENCE`, and absence of `notes` in payloads.

## States & transitions
Each row in PS-040-03 has one acceptance case.

## Validation & errors
Error tests check the envelope shape (CTR-ERR-001 R01) and `message_key` form.

## Authorization
Each row in PS-040-05 has one test.

## Failure, idempotency, concurrency, offline
Failure cases from PS-040-06 are included as acceptance tests (-01 to -04).

## Privacy, retention, abuse
Privacy tests from PS-040-07 are included in CI.

## Observability & budgets
Metric presence test from PS-040-08 runs in CI.

## Tests
- TEST-PS-040-09-01 (contract): schema and fixture round-trip for every version.
- TEST-PS-040-09-02 (error table): one case per `DEPOSITS.*` code.
- TEST-PS-040-09-03 (e2e): flow in R04 completes; final status RELEASED with owner attestation event present.
- TEST-PS-040-09-04 (negative e2e): cash claim cannot reach `EXTERNALLY_VERIFIED` through the deposit path.

## Acceptance criteria
1. TEST-PS-040-09-01 through -04 pass in CI on every merge.
2. Each traceable requirement in PS-040-01 through -08 maps to at least one test ID.
3. Test fixtures contain no real personal data.

## Assumptions & open decisions
- ASSUMPTION: fixtures use synthetic IDs only.
- PROVISIONAL (D09 default, unapproved).
- PENDING CTR-SCH-001 registry entry for the `deposit` schema.
