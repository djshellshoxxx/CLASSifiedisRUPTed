# PS-057-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_evidence. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11 export rules, RET-LEGAL), CTR-SCH-001 (R08 lossless for signed records), CTR-CAP-001 (owner export), CTR-FED-001 (no federation of trust evidence in MVP).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-057-10.R01 | Owner export returns evidence where the owner is subject or issuer, with content for subject, metadata for issuer, as `trust.evidence.export` 1.0.0. | MVP |
| PS-057-10.R02 | Signed records exported as original bytes plus lossless view (CTR-SCH-001 R08). | MVP |
| PS-057-10.R03 | Backups encrypted; include records, quarantine records, key registry snapshots. | MVP |
| PS-057-10.R04 | Restore never re-creates content of records redacted or removed before backup. | MVP |
| PS-057-10.R05 | Restore verifies every signature against key history before cutover. | MVP |
| PS-057-10.R06 | Import of verifier results from external providers. | Future (D06) |

## Data / schema
Export fields: `export_id` (opaque), `generated_at`, `records[]` (`evidence_id`, `role` = subject or issuer, `kind`, `state`, `content` for subject only, `signature_original_b64`, `schema_version`).

## Commands / queries / events
`RequestEvidenceExport` (owner, idempotent); completion event `evidence.export_ready` with `export_id` only.

## States & transitions
`queued` → `ready` (24 h) → `expired` (file deleted).

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `EVIDENCE.EXPORT_RATE_LIMIT` | true | `err.evidence.export_rate_limit` |
| `EVIDENCE.RESTORE_SIGNATURE_FAILED` | false | `err.evidence.restore_signature` |

## Authorization
Export: `evidence.read_own`. Restore: operator with dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Export idempotent per `export_id`. Restore into staging, signature sweep, then cutover. Schema rollback is forward-only for signed records.

## Privacy, retention, abuse
Export file deleted at 24 h (RET-EPH). Backups 35 days (ASSUMPTION), legal hold per RET-LEGAL. Counterparty content never exported to the owner (only the owner's own content).

## Observability & budgets
`evidence_export_total{result}`; restore signature sweep reports counts only.

## Tests
- TEST-PS-057-10-01 (contract): export validates against schema.
- TEST-PS-057-10-02 (integration): exported signed record verifies off-platform with the original bytes.
- TEST-PS-057-10-03 (integration): restore detects tampered signature and aborts.
- TEST-PS-057-10-04 (integration): redacted content not restored.

## Acceptance criteria
1. Export matches stored records for all fixtures.
2. Restore aborts on any signature failure.
3. Redacted content never reappears.
4. Export link expires at 24 h.

## Assumptions & open decisions
- ASSUMPTION: backup retention 35 days.
- PROVISIONAL (D10 default, unapproved): user-controlled keys; recovery in mod_recovery.
- PROVISIONAL (D06 default, unapproved): signed statements; lossless export.
