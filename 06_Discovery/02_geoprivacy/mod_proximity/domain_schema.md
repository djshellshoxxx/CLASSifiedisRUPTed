# PS-045-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_proximity. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03–R05 cells, K_MIN, budget; LOCATION_COARSE), CTR-FED-001 (R02 cell federation rule), CTR-SCH-001.

**Decision labels:** D05 geoprivacy PROVISIONAL (coarse public regions, user-initiated precision). K_MIN = 5 is ASSUMPTION (F10 validates).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-01.R01 | Cells are registered in a cell registry (cell ID, parent cell, neighbor list, active-item count, publication state). No cell exists outside the registry. | MVP |
| PS-045-01.R02 | Cell ID format `^[A-Z]{2}-[A-Z0-9]{2,4}-[A-Z0-9]{1,6}$` (ASSUMPTION, example `DE-BE-C1`). | MVP |
| PS-045-01.R03 | Registry stores no coordinates of any individual; cell centroid only (for display, not as query center). | MVP |
| PS-045-01.R04 | Publication state ∈ {PUBLISHED, MERGED_UP, SUPPRESSED} (see PS-045-03). | MVP |
| PS-045-01.R05 | Active-item count is an integer maintained from listing events; it is never exposed below K_MIN. | MVP |
| PS-045-01.R06 | No per-person location record exists in this module. Budget counters are keyed by `acc_` and expire in 24 h. | MVP |

## Data / schema
```json
{
  "cell_id": "string, regex R02",
  "parent_cell_id": "string | null",
  "neighbors": ["cell_id, max 6 for hex ring 1"],
  "centroid": {"lat": "decimal, 4 dp max", "lon": "decimal, 4 dp max"},
  "active_item_count": "integer >= 0",
  "publication": "PUBLISHED | MERGED_UP | SUPPRESSED",
  "published_count_bucket": "0 | 5-9 | 10-24 | 25+ | null",
  "refreshed_at": "RFC 3339",
  "schema_version": "1.0.0"
}
```
Centroid is cell-level, rounded to 4 decimal places (about 11 m); it is not a user location and is never a query input. Data class LOCATION_COARSE.

## Commands / queries / events
Not applicable; see PS-045-04.

## States & transitions
See PS-045-03.

## Validation & errors
See PS-045-02.

## Authorization
Registry read is public for PUBLISHED cells only (PS-045-05).

## Failure, idempotency, concurrency, offline
Registry refresh is idempotent per `(cell_id, refreshed_at)`.

## Privacy, retention, abuse
Registry data is LOCATION_COARSE; counts below K_MIN never leave the service. Budget counters RET-EPH.

## Observability & budgets
`prox_cells_by_state{publication}` gauge; `prox_registry_refresh_seconds`.

## Tests
- TEST-PS-045-01-01 (unit): cell IDs matching and non-matching patterns.
- TEST-PS-045-01-02 (lint): no per-person location field in any table.
- TEST-PS-045-01-03 (unit): centroid rounding to 4 decimal places.
- TEST-PS-045-01-04 (integration): unregistered cell rejected everywhere.

## Acceptance criteria
1. Registry schema registered with owner F06 and digest.
2. Zero per-person location fields (TEST-PS-045-01-02).
3. TEST-PS-045-01-01 through -04 pass.

## Assumptions & open decisions
- PROVISIONAL (D05 default, unapproved).
- ASSUMPTION: cell grid and ID format; F10 approves the cell set (OPEN).
