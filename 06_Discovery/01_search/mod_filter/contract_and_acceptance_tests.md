# PS-044-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_filter. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (fixtures), CTR-ERR-001, CTR-EVT-001, CTR-CAP-001.

**Decision labels:** D05 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-044-09.R01 | Contract tests for each published `filter` and `saved_search` schema version. | MVP |
| PS-044-09.R02 | One test per `FILTER.*` code. | MVP |
| PS-044-09.R03 | Golden fixtures for hash normalization across versions. | MVP |
| PS-044-09.R04 | End-to-end: evaluate → save → digest → pause → delete. | MVP |
| PS-044-09.R05 | Suite runs in CI on every merge. | MVP |

## Data / schema
Fixtures: synthetic filters, keyword vectors, cell registry sample.

## Commands / queries / events
Envelope tests: `aggregate_type = saved_search`; event payloads without filter body.

## States & transitions
One case per PS-044-03 row.

## Validation & errors
One case per PS-044-02 rule.

## Authorization
One case per PS-044-05 row.

## Failure, idempotency, concurrency, offline
PS-044-06 cases included.

## Privacy, retention, abuse
PS-044-07 tests included.

## Observability & budgets
PS-044-08 metric presence test included.

## Tests
- TEST-PS-044-09-01 (contract): schema round-trip per version.
- TEST-PS-044-09-02 (error table): one case per `FILTER.*` code.
- TEST-PS-044-09-03 (e2e): R04 flow ends with the search DELETED and no further digests.
- TEST-PS-044-09-04 (negative e2e): anonymous evaluation never returns non-PUBLIC items.

## Acceptance criteria
1. TEST-PS-044-09-01 through -04 pass in CI.
2. Every requirement in PS-044-01 through -08 maps to a test ID.
3. Fixtures synthetic.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures only.
- PENDING CTR-SCH-001 registration of `filter` and `saved_search` schemas.
