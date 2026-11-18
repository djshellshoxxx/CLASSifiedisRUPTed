# PS-114-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_cache. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-SCH-001. This module has no server database entity; all records are device-local.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-114-01.R01 | Build manifest lists every precached asset with `url`, `sha256` and `build_id`. | MVP |
| PS-114-01.R02 | Runtime cache entries store only response bodies of allowed classes (PS-114-02.R02) with `fetched_at` and `expires_at`. | MVP |
| PS-114-01.R03 | Cache names are `classrupt-<build_id>-shell` and `classrupt-<build_id>-data`. | MVP |
| PS-114-01.R04 | Cache keys are normalized `GET` URLs with query string removed unless on the allowlist. | MVP |
| PS-114-01.R05 | Quota accounting record: total bytes per cache, updated on write and eviction. | MVP |

## Data / schema
```json
build_manifest  (static file, built per release)
{
  "build_id": "2026.11.1-a1b2c3", "schema_version": "1.0.0",
  "precache": [ { "url": "/assets/app.4f9c.js", "sha256": "<hex>", "bytes": 182044 } ],
  "locales": ["en", "de"]
}
```
Runtime entry (IndexedDB-backed cache metadata):
```json
{ "key": "GET /api/listings/public?region=DE-BE-C1", "class": "PUBLIC|REGION_COARSE",
  "fetched_at": "<RFC 3339>", "expires_at": "<RFC 3339>", "bytes": 4096 }
```
No record stores an account ID, token or precise location.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
See [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-114-01-01 (unit): manifest entry with mismatched sha256 is not installed.
- TEST-PS-114-01-02 (unit): query parameter not on allowlist is stripped from key.
- TEST-PS-114-01-03 (property): cache names change with every `build_id`.
- TEST-PS-114-01-04 (contract): no entry contains account or location identifiers.

## Acceptance criteria
1. Manifest verified before activation.
2. No identifier fields in cache metadata (scan).
3. Quota accounting matches stored bytes in fixtures.

## Assumptions & open decisions
- ASSUMPTION: shell precache ≤ 5 MB; data cache quota 50 MB.
- Retention of device cache: D07 default, PROVISIONAL (D07 default, unapproved).
