# PS-059-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_attachments. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11 export; RET-LEGAL), CTR-SCH-001, CTR-CAP-001, CTR-FED-001 (never federated).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-059-10.R01 | Owner export includes the owner's own uploaded attachments (re-encoded bytes, metadata rows) for threads where the owner is a participant, as a ZIP with `attachment.export` 1.0.0 manifest. | MVP |
| PS-059-10.R02 | Export never includes counterparties' uploads from threads unless the owner uploaded them. | MVP |
| PS-059-10.R03 | Backups encrypted and include blobs, metadata and scan results; purged attachments are not restored. | MVP |
| PS-059-10.R04 | Restore re-verifies `content_sha256` for every blob before cutover. | MVP |
| PS-059-10.R05 | Re-scan after restore before any attachment becomes `available`. | MVP |
| PS-059-10.R06 | Attachment import from other platforms. | Future (not permitted in MVP) |

## Data / schema
`attachment.export` manifest: `export_id`, `generated_at`, `items[]` (`att_id`, `msg_id`, `mime_type`, `byte_size`, `content_sha256`, `path`), `schema_version`.

## Commands / queries / events
`RequestAttachmentExport` (owner, idempotent); event `attachment.export_ready` with `export_id` only.

## States & transitions
`queued` → `ready` (24 h) → `expired`.

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `ATTACH.EXPORT_RATE_LIMIT` | true | `err.attach.export_rate_limit` |
| `ATTACH.RESTORE_HASH_MISMATCH` | false | `err.attach.restore_hash` |

## Authorization
Export: owner (`attachment.read` on own uploads). Restore: operator with dual control.

## Failure, idempotency, concurrency, offline
Export idempotent per `export_id`. Restore staged; hash sweep and re-scan before cutover.

## Privacy, retention, abuse
Export link valid 24 h then deleted (RET-EPH). Backups 35 days (ASSUMPTION). Legal hold per RET-LEGAL.

## Observability & budgets
`attach_export_total{result}`; export p95 ≤ 5 min for 500 MB (ASSUMPTION).

## Tests
- TEST-PS-059-10-01 (contract): manifest validates.
- TEST-PS-059-10-02 (integration): export excludes counterparties' uploads.
- TEST-PS-059-10-03 (integration): restore hash mismatch aborts.
- TEST-PS-059-10-04 (integration): restored attachments re-scanned before availability.

## Acceptance criteria
1. Export contains exactly the owner's uploads.
2. Restore verifies hashes and re-scans.
3. Purged items never reappear.
4. Export link expires at 24 h.

## Assumptions & open decisions
- ASSUMPTION: backup retention 35 days; export 500 MB limit per request.
- PROVISIONAL (D07 default, unapproved): per-category retention with legal-hold exceptions.
