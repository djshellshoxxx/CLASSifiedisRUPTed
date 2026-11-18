# PS-042-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001 (fixtures), CTR-CAP-001, CTR-PRV-001.

**Decision labels:** D04 OPEN. D06 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-042-09.R01 | Contract tests for each published `rental_handoff` schema version. | MVP |
| PS-042-09.R02 | One test per `RNTHAND.*` code (code, category, status, `retryable`). | MVP |
| PS-042-09.R03 | Golden fixtures for each migration path. | MVP |
| PS-042-09.R04 | End-to-end: schedule → owner attest → renter attest → COMPLETE → rental ACTIVE. | MVP |
| PS-042-09.R05 | Suite runs in CI on every merge. | MVP |

## Data / schema
Fixtures: valid and invalid records; synthetic photos with and without EXIF.

## Commands / queries / events
Envelope tests: `aggregate_type = rental_handoff`; `max_data_class = PRIVATE_PERSONAL`.

## States & transitions
One case per row of PS-042-03.

## Validation & errors
One case per rule of PS-042-02.

## Authorization
One case per row of PS-042-05.

## Failure, idempotency, concurrency, offline
PS-042-06 cases -01 to -04 included.

## Privacy, retention, abuse
PS-042-07 tests included.

## Observability & budgets
PS-042-08 metric presence test included.

## Tests
- TEST-PS-042-09-01 (contract): schema round-trip per version.
- TEST-PS-042-09-02 (error table): one case per `RNTHAND.*` code.
- TEST-PS-042-09-03 (e2e): R04 flow ends with rental ACTIVE exactly once.
- TEST-PS-042-09-04 (negative e2e): one-sided attestation never activates the rental.

## Acceptance criteria
1. TEST-PS-042-09-01 through -04 pass in CI.
2. Every requirement in PS-042-01 through -08 maps to a test ID.
3. Fixtures are synthetic.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures only.
- PENDING CTR-SCH-001 registration of `rental_handoff`.
