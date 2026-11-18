# PS-045-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_proximity. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (test IDs TEST-CTR-PRV-001-04, -05), CTR-ERR-001, CTR-SCH-001, CTR-FED-001.

**Decision labels:** D05 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-09.R01 | Contract tests for `cell` and proximity response schemas. | MVP |
| PS-045-09.R02 | One test per `PROXIM.*` code. | MVP |
| PS-045-09.R03 | K_MIN boundary test (4 suppressed, 5 published) in CI. | MVP |
| PS-045-09.R04 | End-to-end: registry → counts → publication → query buckets → budget exhaustion. | MVP |
| PS-045-09.R05 | Suite runs in CI on every merge. | MVP |

## Data / schema
Fixtures: synthetic cells with item counts; no real addresses.

## Commands / queries / events
Envelope tests: `max_data_class = LOCATION_COARSE`.

## States & transitions
One case per PS-045-03 row.

## Validation & errors
One case per PS-045-02 rule.

## Authorization
One case per PS-045-05 row.

## Failure, idempotency, concurrency, offline
PS-045-06 cases included.

## Privacy, retention, abuse
PS-045-07 tests included.

## Observability & budgets
PS-045-08 metric presence test included.

## Tests
- TEST-PS-045-09-01 (contract): schema round-trip.
- TEST-PS-045-09-02 (error table): one case per `PROXIM.*` code.
- TEST-PS-045-09-03 (e2e): R04 flow ends with budget exhaustion error at 31st query.
- TEST-PS-045-09-04 (negative e2e): no response includes a cell with 4 items.

## Acceptance criteria
1. TEST-PS-045-09-01 through -04 pass in CI.
2. Every requirement in PS-045-01 through -08 maps to a test ID.
3. Fixtures are synthetic.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures only.
- PENDING CTR-SCH-001 registration.
