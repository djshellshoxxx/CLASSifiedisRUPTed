# PS-045-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_proximity. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03–R05, R09, R10, retention), CTR-FED-001 (R02 cell federation), CTR-CAP-001.

**Decision labels:** D05 PROVISIONAL. K_MIN ASSUMPTION (F10 validates). OPEN: legal review of narrowing-attack thresholds.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-07.R01 | No precise location of any user enters this module (CTR-PRV-001 R03; zero tolerance). | MVP |
| PS-045-07.R02 | Cell counts published only at ≥ K_MIN = 5 (CTR-PRV-001 R04). | MVP |
| PS-045-07.R03 | Budget counters RET-EPH (24 h); no query history retained beyond counters and alert records. | MVP |
| PS-045-07.R04 | PUBLISHED cells may federate as registered cells only (CTR-FED-001 R02); MERGED_UP and SUPPRESSED never federate. | MVP |
| PS-045-07.R05 | Logs carry cell IDs and codes; never raw query input or `acc_` linked to a cell. | MVP |

## Data / schema
Cell registry: LOCATION_COARSE, retention RET-ACC (registry life). Budget counters: RET-EPH.

## Commands / queries / events
Events are LOCATION_COARSE; `max_data_class` must not exceed it.

## States & transitions
Suppressed cells are not retained beyond current cycle.

## Validation & errors
`PRV.QUERY_BUDGET_EXCEEDED` (429).

## Authorization
Per PS-045-05.

## Failure, idempotency, concurrency, offline
Deletion propagation of budget counters within 24 h (CTR-PRV-001 R06).

## Privacy, retention, abuse
Abuse controls:
- Trilateration by shifting centers: budget (30/24 h) plus narrowing alert (PS-045-02 R05).
- Differencing between buckets over time: buckets only, plus minimum 15-minute refresh; differencing test in CI.
- Scraping of all cells: rate limit per client (ASSUMPTION).
- Adversary claiming a cell to probe counts: registry admin dual approval.

## Observability & budgets
`prv_class_violations_total` must be 0. `prv_location_query_budget_hits_total` tracked.

## Tests
- TEST-PS-045-07-01 (lint): no precise field in any table or event.
- TEST-PS-045-07-02 (K_MIN): simulated 4-item cell never appears in responses.
- TEST-PS-045-07-03 (differencing): repeated refresh cycles do not reveal single-item change for a cell at 5.
- TEST-PS-045-07-04 (federation): SUPPRESSED and MERGED_UP cells absent from federation batches.

## Acceptance criteria
1. Zero precise values in storage, logs, events or responses.
2. No count below K_MIN disclosed.
3. Federation limited to PUBLISHED cells.

## Assumptions & open decisions
- ASSUMPTION: K_MIN 5; scraping rate limit.
- OPEN (F10): differencing mitigation sufficiency.
