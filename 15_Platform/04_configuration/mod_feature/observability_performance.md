# PS-123-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_feature (F15.S04.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-123-08.R01 | Metrics: `feature_catalog_version`, `feature_catalog_age_seconds`, `feature_definition_rejections_total{code}`, `feature_lifecycle_transitions_total{from,to}`. | MVP |
| PS-123-08.R02 | Alert on catalog age > 15 min or on any rejected push. | MVP |
| PS-123-08.R03 | Catalog load time p95 <= 50 ms per node (ASSUMPTION). | MVP |
| PS-123-08.R04 | Dashboard: count of features by lifecycle and by default state; no identifiers. | MVP |

## Data / schema
Labels: `from`, `to`, `code` enums.

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Not applicable.

## Authorization
Dashboard per PS-123-05.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
None.

## Observability & budgets
Budgets in R03.

## Tests
- TEST-PS-123-08-01 (unit): alerts fire at thresholds.
- TEST-PS-123-08-02 (performance): catalog load meets R03.
- TEST-PS-123-08-03 (log scan): no personal data in logs.
- TEST-PS-123-08-04 (dashboard): counts match catalog.

## Acceptance criteria
1. Alerts verified in staging (TEST-01).
2. TEST-PS-123-08-01 through -04 pass.

## Assumptions & open decisions
- None beyond ASSUMPTION in PS-123-06.
