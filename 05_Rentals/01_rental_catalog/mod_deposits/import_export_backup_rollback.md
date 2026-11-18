# PS-040-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_deposits. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11 export, R06 deletion, R07 holds), CTR-FED-001 (R03 no financial federation), CTR-SCH-001 (migrations), CTR-COM-001 (evidence retention).

**Decision labels:** D07 PROVISIONAL. D09 PROVISIONAL. Federation of financial evidence deferred (CTR-FED-001 R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-040-10.R01 | No import of deposit records from any peer or external file in MVP. Inbound `deposit` events → `FED.DATA_CLASS_NOT_ALLOWED`. | MVP |
| PS-040-10.R02 | Owner-initiated export: own deposit records, counterparty PRIVATE_PERSONAL fields redacted (CTR-PRV-001 R11). Format JSON, schema versioned. | MVP |
| PS-040-10.R03 | Export excludes `notes` written by the counterparty and any `aud_` content. | MVP |
| PS-040-10.R04 | Backups follow the platform schedule; restore replays deletions and redactions (CTR-PRV-001 R06). | MVP |
| PS-040-10.R05 | Rollback: the schema is forward-only; new code reads old versions via upcast (CTR-SCH-001 R07). Stored bytes are never rewritten. | MVP |
| PS-040-10.R06 | Feature flag `deposits.enabled` off stops new proposals; existing deposits remain readable and continue to release. | MVP |

## Data / schema
Export envelope: `export_id`, `schema_version`, `generated_at`, `records[]` (deposit fields per PS-040-01 with counterparty PRIVATE_PERSONAL removed), `sha256`.

## Commands / queries / events
Export is a query on `deposit.export` (owner only) producing `deposit.exported` audit event. Import has no command.

## States & transitions
Export does not change status. Legal-hold records cannot be deleted by export or rollback (CTR-PRV-001 R07).

## Validation & errors
`SYS.FORBIDDEN` for non-owner export. `FED.DATA_CLASS_NOT_ALLOWED` for inbound deposit data.

## Authorization
Export: owner (participant, role owner) only. Operator export requires case scope and dual control.

## Failure, idempotency, concurrency, offline
Export is idempotent per request key. Interrupted export resumes from cursor, never double-counts.

## Privacy, retention, abuse
Export files are FINANCIAL_EVIDENCE: download link expires in 24 h; file deleted after first complete download or 7 days. Export contents are never logged.

## Observability & budgets
`deposit_export_total`, `deposit_export_duration_seconds` p95 ≤ 60 s for ≤ 1000 records (ASSUMPTION).

## Tests
- TEST-PS-040-10-01 (contract): export validates against schema; counterparty notes absent.
- TEST-PS-040-10-02 (negative): inbound deposit event from a peer is rejected with `FED.DATA_CLASS_NOT_ALLOWED`.
- TEST-PS-040-10-03 (backup): restore after deletion does not resurrect a purged record.
- TEST-PS-040-10-04 (rollback): flag off → proposals blocked; release of held deposit still succeeds.

## Acceptance criteria
1. Export contains no counterparty-private fields (TEST-PS-040-10-01).
2. No inbound financial evidence accepted (TEST-PS-040-10-02).
3. Rollback leaves all stored deposits readable (TEST-PS-040-10-04).

## Assumptions & open decisions
- ASSUMPTION: 24 h download expiry, 7-day file deletion.
- PROVISIONAL (D07, D09 defaults, unapproved).
- OPEN (F10): legal hold scope for deposit records.
