# PS-119-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_storage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R11, R12), CTR-SCH-001 (R07), CTR-FED-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-119-10.R01 | Owner data export includes that owner's blobs at permitted classes, as files plus manifest (`blob_id`, `sha256`, `mime_type`, `byte_size`, `created_at`). | MVP |
| PS-119-10.R02 | Blobs of counterparties are excluded from owner export (CTR-PRV-001 R11). | MVP |
| PS-119-10.R03 | Blobs are never federated (PRIVATE_PERSONAL, FINANCIAL_EVIDENCE deferred, CTR-FED-001 R03). Public listing images may be referenced, not transferred, in federation (ASSUMPTION). | MVP |
| PS-119-10.R04 | Backups of object store and metadata are taken together; restore verifies `sha256` for every row. | MVP |

## Data / schema
Export manifest: `{ "schema_id": "storage.export_manifest", "schema_version": "1.0.0", "items": [ { "blob_id": "blb_…", "sha256": "…", "mime_type": "image/jpeg", "byte_size": 0 } ] }`.

## Commands / queries / events
`blob.export` (acc_ owner, `export` action on own scope). Restore is `ope_` command with dual control.

## States & transitions
Restore: RESTORED → VERIFYING (sha256 each row) → SERVING. Mismatched rows → QUARANTINED with `STO.RESTORE_MISMATCH`.

## Validation & errors
`STO.RESTORE_MISMATCH` (internal, not retryable, alert). Export requests exceeding 1 GiB produce chunked jobs (ASSUMPTION).

## Authorization
Owner export requires own scope; operator restore requires `blob.administer` and dual control.

## Failure, idempotency, concurrency, offline
Export job idempotent by `(owner_ref, export_request_id)`. Rollback of storage schema uses expand-then-contract.

## Privacy, retention, abuse
Exports delivered via authenticated download with 7-day expiry (ASSUMPTION). Deleted blobs are not restored: restore re-applies DELETED tombstones (CTR-PRV-001 R06).

## Observability & budgets
Restore drill quarterly; RTO ≤ 4 h for 1 TB (ASSUMPTION).

## Tests
- TEST-PS-119-10-01 (integration): export manifest digest verified on import.
- TEST-PS-119-10-02 (integration): restore re-applies deletions, no deleted blob served.
- TEST-PS-119-10-03 (e2e): owner export excludes counterparty blobs.

## Acceptance criteria
1. Export contains only owner-scope blobs (fixture audit).
2. Restore drill verifies 100% of sha256 values.
3. Deleted blobs absent after restore.

## Assumptions & open decisions
- ASSUMPTION: export expiry and RTO.
- D07 PROVISIONAL (unapproved): retention and legal-hold interaction on restore.
- D09 PROVISIONAL (unapproved): not applicable beyond storing external arrangement evidence as blobs with explicit class.
