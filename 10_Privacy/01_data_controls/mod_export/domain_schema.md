# PS-078-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_export (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (owner-export matrix, R11), CTR-SCH-001, CTR-ID-001 (PENDING: `dsr_` prefix, shared with mod_delete), CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-078-01.R01 | One `data_subject_request` row with `request_type = "export"`; `scope` closed enum: `full`, `profile`, `messages`, `commerce_records`. | MVP |
| PS-078-01.R02 | `include_precise_location` defaults to false; true only with explicit confirmation (PS-078-02 R04). | MVP |
| PS-078-01.R03 | Only SHA-256 of the download token is stored (SECRET class, RET-SEC). The token itself is never persisted. | MVP |
| PS-078-01.R04 | Package manifest lists each file with `path`, `sha256`, `bytes`, `data_class`; manifest is stored with the row. | MVP |
| PS-078-01.R05 | At most one non-terminal export per subject and scope (unique partial index). | MVP |

## Data / schema
```json
{
  "id": "dsr_<ULID>",
  "subject_acc_id": "acc_<ULID>",
  "request_type": "export",
  "scope": "full | profile | messages | commerce_records",
  "include_precise_location": "boolean",
  "state": "requested | generating | ready | downloaded | expired | failed",
  "package_ref": "opaque storage key (not an entity ID)",
  "manifest_sha256": "64 hex chars | null",
  "bytes_total": "int | null",
  "ready_at": "timestamp | null",
  "expires_at": "timestamp | null",
  "download_token_sha256": "64 hex chars | null",
  "aggregate_revision": "int >= 1",
  "schema_version": "1.0.0"
}
```

## Commands / queries / events
Defined in PS-078-04. Manifest format: JSON files per data class plus attachment originals; schema referenced as PENDING CTR-PORT-001 (shared portability package format).

## States & transitions
See PS-078-03.

## Validation & errors
See PS-078-02. Stored values are validated against the field registry (CTR-SCH-001 R01).

## Authorization
Owner only. The row never exposes counterparty identifiers.

## Failure, idempotency, concurrency, offline
Row creation idempotent on (subject, scope, active state). `aggregate_revision` increments per transition.

## Privacy, retention, abuse
Row retention RET-AUD. Package retention in PS-078-07. Token hash RET-SEC, purged on expiry plus 30 days (CTR-PRV-001).

## Observability & budgets
No content fields in metrics or logs; row write p95 ≤ 100 ms (ASSUMPTION).

## Tests
- TEST-PS-078-01-01 (unit): the token string never appears in the row after creation.
- TEST-PS-078-01-02 (schema): `manifest_sha256` is null until state `ready`.

## Acceptance criteria
1. Schema validates against registry lint.
2. No token plaintext in DB snapshot (TEST-PS-078-01-01).
3. Manifest rows match file list byte-for-byte in golden fixture.

## Assumptions & open decisions
- PENDING: `dsr_` prefix in CTR-ID-001.
- PENDING: CTR-PORT-001 manifest and package format.
- PROVISIONAL (D10 default, unapproved): user-controlled keys for package encryption, with documented recovery.
