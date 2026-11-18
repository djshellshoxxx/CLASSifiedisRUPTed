# PS-042-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07, R11), CTR-FED-001 (R03), CTR-SCH-001 (R07).

**Decision labels:** D07 PROVISIONAL. D04 OPEN.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-042-10.R01 | No inbound handoff records from peers or files in MVP. Inbound → `FED.DATA_CLASS_NOT_ALLOWED`. | MVP |
| PS-042-10.R02 | Participant export of own handoff records; counterparty checklist detail limited to what the requester signed. | MVP |
| PS-042-10.R03 | Photos excluded from default export; digests only. | MVP |
| PS-042-10.R04 | Backup restore replays deletions and purges (CTR-PRV-001 R06). | MVP |
| PS-042-10.R05 | Forward-only schema; upcast on read. | MVP |
| PS-042-10.R06 | Flag `rental_handoff.enabled` off blocks new scheduling; COMPLETE and open records continue to resolve. | MVP |

## Data / schema
Export: `export_id`, `schema_version`, `records[]`, `sha256`.

## Commands / queries / events
`rental_handoff.export` query; `rental_handoff.exported` audit event.

## States & transitions
Export changes no status.

## Validation & errors
`SYS.FORBIDDEN` for non-participant export; `FED.DATA_CLASS_NOT_ALLOWED` for inbound.

## Authorization
Participant only; operator export needs case scope and dual control.

## Failure, idempotency, concurrency, offline
Idempotent per request key; cursor resume.

## Privacy, retention, abuse
Export link expires in 24 h; file removed after first download or 7 days (ASSUMPTION).

## Observability & budgets
`rental_handoff_export_total`; p95 ≤ 60 s for ≤ 500 records (ASSUMPTION).

## Tests
- TEST-PS-042-10-01 (contract): export validates; no photos by default.
- TEST-PS-042-10-02 (negative): inbound handoff from peer rejected.
- TEST-PS-042-10-03 (backup): purged record not resurrected by restore.
- TEST-PS-042-10-04 (rollback): flag off blocks scheduling; open handoff still completes.

## Acceptance criteria
1. Default export contains no photo bytes.
2. No inbound handoff data accepted.
3. Rollback leaves open handoffs resolvable.

## Assumptions & open decisions
- ASSUMPTION: export expiry and file removal.
- PROVISIONAL (D07 default, unapproved).
