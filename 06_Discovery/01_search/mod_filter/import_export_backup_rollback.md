# PS-044-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_filter. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11 export), CTR-FED-001 (R03), CTR-SCH-001 (R07).

**Decision labels:** D07 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-044-10.R01 | Owner export of own saved searches as JSON, schema versioned. | MVP |
| PS-044-10.R02 | No import of saved searches from peers or files in MVP. | MVP |
| PS-044-10.R03 | Backups restore deletions (CTR-PRV-001 R06). | MVP |
| PS-044-10.R04 | Forward-only schema; upcast on read. | MVP |
| PS-044-10.R05 | Flag `filter.saved.enabled` off stops new saves and digests; existing saved searches remain readable and deletable. | MVP |

## Data / schema
Export: `export_id`, `schema_version`, `searches[]`, `sha256`.

## Commands / queries / events
`filter.export` query by owner; `saved_search.exported` audit event.

## States & transitions
Export changes no status.

## Validation & errors
`SYS.FORBIDDEN` for non-owner export.

## Authorization
Owner only.

## Failure, idempotency, concurrency, offline
Export idempotent per request key.

## Privacy, retention, abuse
Export file 24 h link; removed after download or 7 days (ASSUMPTION).

## Observability & budgets
`filter_export_total`; p95 ≤ 5 s for ≤ 20 searches (ASSUMPTION).

## Tests
- TEST-PS-044-10-01 (contract): export validates.
- TEST-PS-044-10-02 (negative): inbound saved search from peer rejected.
- TEST-PS-044-10-03 (backup): purged search not restored.
- TEST-PS-044-10-04 (rollback): flag off blocks saves; deletion still works.

## Acceptance criteria
1. Export contains only the owner's searches.
2. No inbound saved-search data accepted.
3. Rollback keeps deletion available.

## Assumptions & open decisions
- ASSUMPTION: export and removal windows.
- PROVISIONAL (D07 default, unapproved).
