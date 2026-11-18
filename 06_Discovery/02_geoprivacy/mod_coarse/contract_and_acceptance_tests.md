# PS-047-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_coarse. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R03, R09), CTR-ERR-001 (R02), CTR-PRV-001 (R04, R05); PENDING CTR-DSC-001.

**Decision labels:** Fixture corpus ASSUMPTION (owner F17 QA Lead).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-09.R01 | Golden fixtures for registry schema MAJOR and each COARSE error code. | MVP |
| PS-047-09.R02 | Contract test: K_MIN boundary behavior across API, events and logs. | MVP |
| PS-047-09.R03 | E2E: approve cell → recompute → cell visible in search within 5 min. | MVP |
| PS-047-09.R04 | Accessibility: cell picker labels from label_key catalog, screen-reader names unique per cell. | MVP |

## Data / schema
Fixtures: 20 cells, 3 levels, counts 0–10 per cell, retired cells, cyclic graph (negative).

## Commands / queries / events
Tests target all commands in PS-047-04.

## States & transitions
Each state in PS-047-03 reached.

## Validation & errors
One negative fixture per code.

## Authorization
One allow and one deny per PS-047-05 row.

## Failure, idempotency, concurrency, offline
Chaos fixtures from PS-047-06.

## Privacy, retention, abuse
Synthetic counts only.

## Observability & budgets
Latency report vs PS-047-08.

## Tests
- TEST-PS-047-09-01 (contract): registry schema golden files.
- TEST-PS-047-09-02 (e2e): approve→recompute→visible.
- TEST-PS-047-09-03 (a11y): cell picker names unique.
- TEST-PS-047-09-04 (offline): cached registry version used until refresh.

## Acceptance criteria
1. All PS-047 requirement IDs mapped to TEST IDs.
2. K_MIN boundary tests pass across API, events and logs.
3. E2E time ≤ 5 min on reference profile.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures.
