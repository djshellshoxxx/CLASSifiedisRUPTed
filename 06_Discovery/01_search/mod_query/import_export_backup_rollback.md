# PS-046-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_query. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05, R07), CTR-PRV-001 (R11); PENDING CTR-DSC-001.

**Decision labels:** None directly; query data is not retained, so export and backup scope is empty by design.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-10.R01 | No user export contains search queries, cursors or result snapshots. | MVP |
| PS-046-10.R02 | Backups contain no query-path state; rate counters are not backed up (RET-EPH). | MVP |
| PS-046-10.R03 | Request and response schema changes follow CTR-SCH-001 MINOR/MAJOR rules; MAJOR bump requires dual-version serving for 90 days (ASSUMPTION). | MVP |
| PS-046-10.R04 | Rollback of query code is a deploy rollback; no data migration is needed. | MVP |

## Data / schema
No persisted schema owned by this module. Aggregate counters follow RET-OPS and are excluded from export.

## Commands / queries / events
No import path. Configuration (budgets, K_MIN reference) imported only via `ope_` config change with change record.

## States & transitions
Not applicable.

## Validation & errors
Config import with budget below minimum (100 per hour text search) → `QUERY.CONFIG_INVALID`.

## Authorization
Config changes require `administer` by `ope_` (CTR-CAP-001 R03).

## Failure, idempotency, concurrency, offline
Config import idempotent by config version.

## Privacy, retention, abuse
Nothing personal to export. Aggregate counters excluded from export to avoid small-count disclosure.

## Observability & budgets
Config change events logged with version, no values beyond numeric limits.

## Tests
- TEST-PS-046-10-01 (integration): export bundle contains no query-related keys.
- TEST-PS-046-10-02 (integration): backup restore leaves budgets at config defaults, no counter restored.
- TEST-PS-046-10-03 (contract): dual-version serving window test for MAJOR bump.

## Acceptance criteria
1. Export fixture has zero query-related keys.
2. Config below minimum rejected.
3. Rollback runbook verified in staging (PENDING F15).

## Assumptions & open decisions
- ASSUMPTION: 90-day dual-version window.
