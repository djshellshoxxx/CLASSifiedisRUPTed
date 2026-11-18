# PS-125-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_tenants](SPEC.md) (Platform Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-FED-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-125-10.R01 | Tenant export bundle contains a manifest with SHA-256 per file, `schema_version`, `tenant_id` and export time. | MVP |
| PS-125-10.R02 | Export excludes secrets, other tenants' data, idempotency keys and local correlation IDs. | MVP |
| PS-125-10.R03 | Tenant import creates a new `tenant_id` (re-keyed) and never restores a deleted ID. | MVP |
| PS-125-10.R04 | Config rollback restores a prior revision within 1 min; prior revisions kept 12 months (RET-AUD). | MVP |
| PS-125-10.R05 | Node backups include tenant records; restore RPO ≤ 24 h (ASSUMPTION, BT-04 Platform Lead). | MVP |

## Data / schema
Bundle layout: `manifest.json`, `tenant.json` (record and config), `revisions.jsonl` (config history), `regions.json`. Format: UTF-8 JSON and JSON Lines. Each file ≤ 16 MiB (ASSUMPTION).

## Commands / queries / events
- `tenant.export(tenant_id, profile)` → bundle URL, short-lived (24 h).
- `tenant.import(bundle, mode=new_tenant)` → new `tenant_id`; emits `tenant.created` with `origin = import`.
- `tenant.rollback(tenant_id, to_revision)` → emits `tenant.config_changed`.

## States & transitions
Export allowed in `active`, `suspended` and `offboarding`. Import creates `provisioning`. Rollback allowed only in `active` or `suspended`.

## Validation & errors
| Code | Retryable | Trigger |
|---|---|---|
| TEN.BUNDLE_INVALID | false | Checksum or schema failure. |
| TEN.BUNDLE_TOO_LARGE | false | File > 16 MiB. |
| TEN.REVISION_NOT_FOUND | false | Target revision pruned or absent. |

## Authorization
Export: admin (owner) or `ope` with purpose `tenant_offboarding`. Import: `ope` with dual control. Rollback: admin for own tenant when not suspended; `ope` otherwise.

## Failure, idempotency, concurrency, offline
Export is resumable by file. Import is idempotent by bundle digest. Rollback is a new revision, never an edit of history.

## Privacy, retention, abuse
Bundle links expire in 24 h. Export downloads are logged as `aud_` records without content. Bundle files are deleted from storage after the first successful download or 24 h, whichever is earlier (ASSUMPTION).

## Observability & budgets
`tenant_export_duration_seconds` p95 ≤ 60 s for a tenant with ≤ 10,000 listings (ASSUMPTION). `tenant_restore_drill_result{outcome}`.

## Tests
- TEST-PS-125-10-01 (round trip): export then import yields identical config with new `tenant_id`.
- TEST-PS-125-10-02 (negative): one flipped byte in `tenant.json` → TEN.BUNDLE_INVALID.
- TEST-PS-125-10-03 (privacy): bundle contains no secret or other-tenant identifiers.
- TEST-PS-125-10-04 (rollback): rollback to revision 3 then read returns revision 3 values with new revision number.
- TEST-PS-125-10-05 (restore drill): quarterly restore of node backup recovers tenant records within RPO.

## Acceptance criteria
1. Round trip preserves all config fields.
2. Rollback never rewrites history.
3. Restore drill meets RPO in every scheduled run.

## Assumptions & open decisions
- ASSUMPTION: bundle format, size caps and 24 h link lifetime.
- PROVISIONAL (D07 default, unapproved): export retention and purge follow RET-EVD for evidence-bearing data.
- PROVISIONAL (D04 default, unapproved): no atomic cross-tenant operations; each tenant restores independently.
