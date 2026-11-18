# PS-039-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_availability. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-039-10.R01 | Owner export: own item calendars (dates, block_type, own rental_id references). Renter export: own hold and booking dates for items rented. | MVP |
| PS-039-10.R02 | Bulk owner calendar import (CSV or iCalendar) is Future; MVP has no import. Imported rows would be validated by PS-039-02. | Future |
| PS-039-10.R03 | Backups include AvailabilityBlock with exclusion constraint intact; restore re-validates the constraint before serving. | MVP |
| PS-039-10.R04 | Rollback of a schema version never drops RELEASED history. | MVP |
| PS-039-10.R05 | Restore drill quarterly: RPO <= 24 h, RTO <= 4 h (ASSUMPTION). | MVP |

## Data / schema
Export JSON schema_version 1; iCalendar export Future with same class rules.

## Commands / queries / events
`availability.export_generated` emitted with counts only.

## States & transitions
Not applicable.

## Validation & errors
`AVAIL.EXPORT_SCOPE` if a request spans another owner's items.

## Authorization
Owner and renter exports via own sessions; restore requires operator dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Export idempotent per request ID. Restore blocked while lifecycle replays run.

## Privacy, retention, abuse
Exports follow PS-039-07 retention; renter export redacts owner identity beyond display name.

## Observability & budgets
Export p95 <= 30 s for 10 MB.

## Tests
- TEST-PS-039-10-01 (export): owner export excludes other owners' items.
- TEST-PS-039-10-02 (restore): exclusion constraint present and validated after restore.
- TEST-PS-039-10-03 (rollback): schema rollback keeps RELEASED rows.

## Acceptance criteria
1. Export scope tests pass.
2. Restore validates no overlaps.
3. Rollback preserves history.

## Assumptions & open decisions
- ASSUMPTION: RPO 24 h and RTO 4 h.
- PROVISIONAL (D07 default, unapproved): backup retention per class.
- PROVISIONAL (D01 default, unapproved): no federated calendar import in MVP.
