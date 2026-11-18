# PS-041-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_damage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11 export, R06 deletion, R07 holds), CTR-FED-001 (R03), CTR-SCH-001 (migrations).

**Decision labels:** D07 PROVISIONAL. D06 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-041-10.R01 | No inbound damage records from peers or files in MVP; inbound → `FED.DATA_CLASS_NOT_ALLOWED`. | MVP |
| PS-041-10.R02 | Owner or renter may export their own damage records for rentals they took part in. Counterparty descriptions are included only for the requester's own lines. | MVP |
| PS-041-10.R03 | Photo originals are not included in default export; included only on explicit request, within 24 h download window. | MVP |
| PS-041-10.R04 | Backups restore with replayed deletions and photo purges (CTR-PRV-001 R06). | MVP |
| PS-041-10.R05 | Forward-only schema; upcast on read; no rewrite of stored bytes (CTR-SCH-001 R07). | MVP |
| PS-041-10.R06 | Flag `damage.enabled` off stops new reports; existing reports remain readable and resolvable. | MVP |

## Data / schema
Export envelope: `export_id`, `schema_version`, `records[]`, `sha256`, optional `photo_manifest[]` (digests only).

## Commands / queries / events
`damage.export` query; `damage.exported` audit event.

## States & transitions
Export changes no status. Held records are not deleted by rollback.

## Validation & errors
`SYS.FORBIDDEN` for non-participant export; `FED.DATA_CLASS_NOT_ALLOWED` for inbound.

## Authorization
Participant only; operator export needs case scope and dual control.

## Failure, idempotency, concurrency, offline
Export idempotent per request key; resumable by cursor.

## Privacy, retention, abuse
Export files are FINANCIAL_EVIDENCE and PRIVATE_PERSONAL; 24 h link; file deleted after first download or 7 days (ASSUMPTION).

## Observability & budgets
`damage_export_total`, export p95 ≤ 60 s for ≤ 500 records (ASSUMPTION).

## Tests
- TEST-PS-041-10-01 (contract): export validates; no photo bytes by default.
- TEST-PS-041-10-02 (negative): inbound damage from peer rejected.
- TEST-PS-041-10-03 (backup): restore after purge does not resurrect photo bytes.
- TEST-PS-041-10-04 (rollback): flag off blocks new reports; resolution still works.

## Acceptance criteria
1. Default export has no photo bytes (TEST-PS-041-10-01).
2. No inbound damage data accepted (TEST-PS-041-10-02).
3. Rollback leaves existing reports resolvable (TEST-PS-041-10-04).

## Assumptions & open decisions
- ASSUMPTION: export window and file deletion.
- PROVISIONAL (D07, D06 defaults, unapproved).
