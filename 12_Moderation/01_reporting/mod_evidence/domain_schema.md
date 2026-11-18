# PS-093-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_evidence (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-EVT-001, CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-093-01.R01 | One `mev_` record per captured item. Class `opaque`. Prefix PENDING CTR-ID-001 registry entry (see Assumptions). | MVP |
| PS-093-01.R02 | Only the fields below are stored. Any other field → `EVD.FIELD_NOT_ALLOWED`. | MVP |
| PS-093-01.R03 | Content bytes live only in the encrypted evidence store. The record holds a key reference and SHA-256, never content. | MVP |
| PS-093-01.R04 | Limits: ≤10 items per report, ≤5 MiB per item, ≤25 MiB per report. | MVP |
| PS-093-01.R05 | No LOCATION_PRECISE field exists. EXIF/XMP GPS and street-address strings are removed before persistence. | MVP |
| PS-093-01.R06 | Content is immutable. Only `redaction_state` and `retention_class` change, each as a new revision (CTR-EVT-001 R02). | MVP |
| PS-093-01.R07 | `provenance` is `server_internal` (copied from authoritative store) or `client_supplied` (labelled unverified in UI and in decisions). | MVP |

## Data / schema
| Field | Type | Class | Constraint |
|---|---|---|---|
| evidence_id | string `mev_` | PSEUDONYMOUS | unique, CTR-ID-001 pattern |
| report_id | string `rpt_` | PSEUDONYMOUS | required, must exist |
| target_type | enum: listing, service, auction, rental, message, thread, attachment, profile | PUBLIC | required |
| target_id | string, prefix from target_type | PSEUDONYMOUS | `ID.PREFIX_MISMATCH` on error; profile uses `acc_` |
| content_kind | enum: target_snapshot, message_excerpt, image | PUBLIC | required |
| media_type | enum: application/json, text/plain, image/jpeg, image/png, image/webp | PUBLIC | sniffed server-side |
| byte_size | integer 1–5242880 | PUBLIC | stored after stripping |
| sha256 | hex(64) | PSEUDONYMOUS | SHA-256 of stored bytes |
| content_key_ref | opaque string | PSEUDONYMOUS | KMS key handle only |
| provenance | enum: server_internal, client_supplied | PUBLIC | required |
| redaction_state | enum: captured, redacted, expired, purged | PUBLIC | state machine in PS-093-03 |
| captured_at | RFC3339 UTC, ms | PSEUDONYMOUS | server-set |
| captured_by | `acc_` or `sys_` | PSEUDONYMOUS | visible to case scope only; never to reported party |
| retention_class | enum: RET-PRIV, RET-EVD, RET-LEGAL | PUBLIC | per CTR-PRV-001 |
| legal_hold_ref | `cas_` or matter string, nullable | PSEUDONYMOUS | scoped per CTR-PRV-001 R07 |

Max class of a record with content: PRIVATE_PERSONAL. Metadata alone: PSEUDONYMOUS.

## Commands / queries / events
Defined in PS-093-04. Record shape is versioned `schema_version` 1.0.0 (CTR-SCH-001).

## States & transitions
See PS-093-03. Terminal states: `rejected` (never stored), `purged` (metadata tombstone only).

## Validation & errors
Field and limit checks in PS-093-02.

## Authorization
Reads of content require a case-scoped grant (PS-093-05). Schema-level field visibility per CTR-CAP-001 R10.

## Failure, idempotency, concurrency, offline
Record creation is idempotent on (`report_id`, `sha256`, `target_type`, `target_id`); duplicates return the original `mev_`.

## Privacy, retention, abuse
Per PS-093-07. Hashes outlive content (RET-AUD) so that deletion is detectable.

## Observability & budgets
Field-count and limit violations are counted (`evidence_validation_rejections_total`), see PS-093-08.

## Tests
- TEST-PS-093-01-01 (schema lint): fields and classes match table; no unclassified field (PRV.UNCLASSIFIED_FIELD).
- TEST-PS-093-01-02 (negative): extra field and oversize item rejected.

## Acceptance criteria
1. Schema validates against CTR-SCH-001 registry entry with classes on every field.
2. No field can hold coordinates or a street address (lint + fixture).

## Assumptions & open decisions
- PENDING: `mev_` prefix (proposed) requires CTR-ID-001 MINOR registry change. Note `evd_` (F09) is the commerce evidence class; not reused here.
- B-06: canonical owner of moderation evidence snapshots = F12.S01.M02 (PROVISIONAL, unapproved). Identity evidence F07.S03.M02 is a separate class.
- PROVISIONAL (D05 default, unapproved): no precise location stored.
- PROVISIONAL (D07 default, unapproved): retention classes per PS-093-07.
