# PS-067-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_cash (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R08), CTR-PRV-001 (R06, R07), CTR-FED-001 (R03). **Decisions:** D06, D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-067-10.R01 | Cash claims are never imported from federation or third-party systems. | MVP |
| PS-067-10.R02 | Owner export includes the owner's cash claims as signed records (original bytes, CTR-SCH-001 R08) plus a lossless view. | MVP |
| PS-067-10.R03 | Configuration export is operator-only and includes `cashcfg` records and revisions. | MVP |
| PS-067-10.R04 | Rollback that disables the method leaves claims and their states unchanged. | MVP |
| PS-067-10.R05 | Backups are encrypted; restore replays redactions and legal-hold scopes (CTR-PRV-001 R06, R07). | MVP |

## Data / schema
Export manifest: `schema_version`, `claim_count`, `sha256`, `generated_at`.

## Commands / queries / events
`clm.exported` event with count only.

## States & transitions
Export: `queued` → `generated` → `expired` (24 h).

## Validation & errors
`SYS.RATE_LIMITED` for export frequency; no error for empty export.

## Authorization
Owner exports own claims; operators export configuration only.

## Failure, idempotency, concurrency, offline
Export idempotent by export ID. Restore reconciles with redaction log.

## Privacy, retention, abuse
Export files are FINANCIAL_EVIDENCE; deleted 24 h after generation; not sent by email.

## Observability & budgets
Export p95 ≤ 10 s for up to 500 claims (ASSUMPTION).

## Tests
- TEST-PS-067-10-01 (contract): export preserves signed bytes and `claim_hash`.
- TEST-PS-067-10-02 (integration): restore reapplies redaction at 12 months.
- TEST-PS-067-10-03 (integration): rollback keeps attested claims attested.
- TEST-PS-067-10-04 (unit): export file deleted at 24 h.

## Acceptance criteria
1. Exported claims verify against stored `claim_hash`.
2. Rollback test shows zero state changes.
3. Restore never reintroduces redacted fields.

## Assumptions & open decisions
- ASSUMPTION: export limit 1 per 24 h.
- D06, D07 (PROVISIONAL, unapproved).
