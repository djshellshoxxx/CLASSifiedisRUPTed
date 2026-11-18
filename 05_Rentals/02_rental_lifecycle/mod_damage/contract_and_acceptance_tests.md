# PS-041-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_damage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001 (golden fixtures), CTR-COM-001 (claim fixtures), CTR-CAP-001 (authz tests).

**Decision labels:** D06 PROVISIONAL. D04 OPEN.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-041-09.R01 | Contract tests run for each published `damage` schema version. | MVP |
| PS-041-09.R02 | One test per `DAMAGE.*` code asserting code, category, HTTP status, `retryable`. | MVP |
| PS-041-09.R03 | Golden fixtures for every migration path (CTR-SCH-001 R09). | MVP |
| PS-041-09.R04 | End-to-end acceptance: report → contest → escalate → resolve → deposit partial release. | MVP |
| PS-041-09.R05 | Suite runs in CI on every merge. | MVP |

## Data / schema
Fixtures: valid and invalid `damage` samples; photo samples with and without GPS EXIF (synthetic images only).

## Commands / queries / events
Envelope tests: required fields; `max_data_class = FINANCIAL_EVIDENCE`; no description in payload.

## States & transitions
One acceptance case per row in PS-041-03.

## Validation & errors
One case per rule in PS-041-02.

## Authorization
One case per matrix row in PS-041-05.

## Failure, idempotency, concurrency, offline
Cases -01 to -04 of PS-041-06 included.

## Privacy, retention, abuse
PS-041-07 tests included in CI.

## Observability & budgets
PS-041-08 metric presence test included.

## Tests
- TEST-PS-041-09-01 (contract): schema round-trip for every version.
- TEST-PS-041-09-02 (error table): one case per `DAMAGE.*` code.
- TEST-PS-041-09-03 (e2e): flow in R04 completes with deposit request event.
- TEST-PS-041-09-04 (negative e2e): silence through the 72-h window never produces ACKNOWLEDGED.

## Acceptance criteria
1. TEST-PS-041-09-01 through -04 pass in CI.
2. Every requirement in PS-041-01 through -08 maps to a test ID.
3. Fixtures contain synthetic data only.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures only.
- PENDING CTR-SCH-001 registration of `damage` schema.
