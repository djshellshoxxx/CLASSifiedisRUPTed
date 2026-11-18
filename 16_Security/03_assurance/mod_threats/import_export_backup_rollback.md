# PS-133-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_threats. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ID-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-133-10.R01 | Export tiers: `internal` (all non-attachment fields) and `external_audit` (restricted descriptions removed, IDs and ratings kept) | MVP |
| PS-133-10.R02 | Import of external threat taxonomies creates Threat rows in `identified` status only; no auto-assessment or auto-acceptance | MVP |
| PS-133-10.R03 | Nightly backup of register and model versions; restore tested quarterly | MVP |
| PS-133-10.R04 | Rollback = supersede a model version with prior content hash; no row deletion | MVP |

## Data / schema
Export document: `{schema_v: 1, tier, generated_at, model_version, threats: [...]}`. Import record: `{source_ref, source_id, mapped_threat_id|null}`.

## Commands / queries / events
`threats.ExportModel(version, tier)` read query; `threats.ImportThreats(source_file_hash, rows)` write, idempotent by hash; rollback via `threats.PublishModel` of prior content.

## States & transitions
Rollback: published(v2) -> superseded; published(v1 restored as v3 with same content_hash).

## Validation & errors
`THREATS.IMPORT_ROW_INVALID` (lists row numbers, not content), `THREATS.EXPORT_TIER_DENIED` (non-retryable).

## Authorization
Export internal: Security Lead, Privacy Lead. External audit tier: Security Lead approval per export. Import and rollback: Security Lead.

## Failure, idempotency, concurrency, offline
Import idempotent by source file hash. Partial import rejected entirely (all rows or none). Rollback refused while a publish is in progress.

## Privacy, retention, abuse
External tier must pass PII linter (PS-133-07). Exported files are deleted from shared storage after 14 days (PROVISIONAL, D07 default).

## Observability & budgets
Export of 500 threats p95 <= 20 s (ASSUMPTION). Restore drill duration <= 2 h.

## Tests
- TEST-PS-133-10-01 (unit): external tier omits restricted description fields.
- TEST-PS-133-10-02 (integration): import of 50 rows with one invalid row creates zero rows.
- TEST-PS-133-10-03 (integration): rollback to v1 content hash matches original.

## Acceptance criteria
1. Export tier test matrix passes.
2. Restore drill recorded once before first external audit (future).
3. No row deleted by import or rollback paths.

## Assumptions & open decisions
- ASSUMPTION: external taxonomies are limited to one source format in MVP (CSV with fixed columns).
- D04 PROVISIONAL (D04 default, unapproved): physical-handover threats not auto-accepted on import.
- D07 PROVISIONAL (D07 default, unapproved): 14-day export expiry.
