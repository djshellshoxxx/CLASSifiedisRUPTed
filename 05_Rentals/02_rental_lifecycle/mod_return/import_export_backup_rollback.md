# PS-043-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_return. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07, R11), CTR-FED-001 (R03), CTR-SCH-001 (R07).

**Decision labels:** D07 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-043-10.R01 | No inbound return records from peers or files in MVP; inbound → `FED.DATA_CLASS_NOT_ALLOWED`. | MVP |
| PS-043-10.R02 | Participant export of own return records; counterparty note excluded. | MVP |
| PS-043-10.R03 | Export contains no photos or amounts (amounts live in deposit and damage exports). | MVP |
| PS-043-10.R04 | Backups restore with replayed deletions (CTR-PRV-001 R06). | MVP |
| PS-043-10.R05 | Forward-only schema; upcast on read. | MVP |
| PS-043-10.R06 | Flag `rental_return.enabled` off stops new returns; open returns continue to close. | MVP |

## Data / schema
Export envelope: `export_id`, `schema_version`, `records[]`, `sha256`.

## Commands / queries / events
`rental_return.export` query; `rental_return.exported` audit event.

## States & transitions
Export changes no status.

## Validation & errors
`SYS.FORBIDDEN` non-participant export; `FED.DATA_CLASS_NOT_ALLOWED` inbound.

## Authorization
Participant only; operator export needs case scope and dual control.

## Failure, idempotency, concurrency, offline
Idempotent per request key; cursor resume.

## Privacy, retention, abuse
Export link 24 h; file removed after first download or 7 days (ASSUMPTION).

## Observability & budgets
`rental_return_export_total`; p95 ≤ 60 s for ≤ 500 records (ASSUMPTION).

## Tests
- TEST-PS-043-10-01 (contract): export validates; no counterparty note.
- TEST-PS-043-10-02 (negative): inbound return from peer rejected.
- TEST-PS-043-10-03 (backup): purged note not resurrected.
- TEST-PS-043-10-04 (rollback): flag off blocks new returns; open return still closes.

## Acceptance criteria
1. Export contains no counterparty notes.
2. No inbound return data accepted.
3. Rollback leaves open returns closable.

## Assumptions & open decisions
- ASSUMPTION: export expiry and removal.
- PROVISIONAL (D07 default, unapproved).
