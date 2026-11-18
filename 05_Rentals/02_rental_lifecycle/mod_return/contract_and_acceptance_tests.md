# PS-043-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_return. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001, CTR-PRV-001.

**Decision labels:** D04 OPEN. D07 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-043-09.R01 | Contract tests for each published `rental_return` schema version. | MVP |
| PS-043-09.R02 | One test per `RETURN.*` code (code, category, status, `retryable`). | MVP |
| PS-043-09.R03 | Golden fixtures for every migration path. | MVP |
| PS-043-09.R04 | End-to-end: declare → owner confirm → CLOSED with deposit request; and declare → damage → CLOSED after damage resolves. | MVP |
| PS-043-09.R05 | Suite runs in CI on every merge. | MVP |

## Data / schema
Fixtures: valid and invalid returns; boundary timestamps; synthetic notes.

## Commands / queries / events
Envelope tests: `aggregate_type = rental_return`; no amounts; no notes in payloads.

## States & transitions
One case per row of PS-043-03.

## Validation & errors
One case per rule of PS-043-02.

## Authorization
One case per row of PS-043-05.

## Failure, idempotency, concurrency, offline
PS-043-06 cases -01 to -04 included.

## Privacy, retention, abuse
PS-043-07 tests included.

## Observability & budgets
PS-043-08 metric presence test included.

## Tests
- TEST-PS-043-09-01 (contract): schema round-trip per version.
- TEST-PS-043-09-02 (error table): one case per `RETURN.*` code.
- TEST-PS-043-09-03 (e2e): both R04 flows reach CLOSED once.
- TEST-PS-043-09-04 (negative e2e): silent owner never produces OWNER_CONFIRMED.

## Acceptance criteria
1. TEST-PS-043-09-01 through -04 pass in CI.
2. Every requirement in PS-043-01 through -08 maps to a test ID.
3. Fixtures are synthetic.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures only.
- PENDING CTR-SCH-001 registration of `rental_return`.
