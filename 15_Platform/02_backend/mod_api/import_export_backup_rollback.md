# PS-117-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_api. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R07, R08), CTR-PRV-001 (R06, R11), CTR-EVT-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-117-10.R01 | api configuration (`api_version` rows, public allow-list, route map) exports as versioned JSON with SHA-256 digest. | MVP |
| PS-117-10.R02 | api does not export user data. Idempotency rows are excluded from exports and from backups beyond the 24 h window. | MVP |
| PS-117-10.R03 | Deployments are blue/green; rollback to previous build completes within 10 min (ASSUMPTION). | MVP |
| PS-117-10.R04 | Schema migrations are expand-then-contract; no migration drops a column in the same release that stops writing it. | MVP |

## Data / schema
Config export document:
```json
{ "schema_id": "api.config", "schema_version": "1.0.0", "sha256": "<hex>", "versions": [], "public_allow_list": [], "route_map": {} }
```

## Commands / queries / events
`api_version` export is an `ope_` query; import is an `ope_` command with dual control (ASSUMPTION).

## States & transitions
Restore sequence: RESTORED → IDEMPOTENCY_RESET (all `in_progress` rows set to `failed_final` with code `API.RESTORED_UNKNOWN`) → SERVING.

## Validation & errors
Import rejects unknown `schema_version` MAJOR (`SCH.UNKNOWN_VERSION`) and digest mismatch (`API.CONFIG_DIGEST_MISMATCH`, category validation).

## Authorization
Import and export require `api_version.administer` on `global` scope; logged as `aud_`.

## Failure, idempotency, concurrency, offline
After restore, keys whose rows predate the restore point are not honored: clients receive `API.IDEMPOTENCY_EXPIRED` (410 gone) and must re-submit with a new key after confirming state with a read. Rollback does not delete idempotency rows.

## Privacy, retention, abuse
Config exports contain no personal data. Backup restores of `api_idempotency` retain `actor_ref` only for 24 h (PS-117-01).

## Observability & budgets
Restore drill once per quarter; target RTO ≤ 30 min for api tier (ASSUMPTION).

## Tests
- TEST-PS-117-10-01 (integration): export → import round trip yields identical digest.
- TEST-PS-117-10-02 (integration): restore marks in-progress keys and returns 410 for pre-restore keys.
- TEST-PS-117-10-03 (e2e): blue/green rollback under synthetic load, zero failed reads.

## Acceptance criteria
1. Export digest matches on re-import; tampered file rejected.
2. Restore drill passes within RTO.
3. Expand-then-contract check runs in CI for every migration.

## Assumptions & open decisions
- ASSUMPTION: RTO and rollback timings above.
- D10 (PROVISIONAL default, unapproved): not applicable to api config; noted for portability of user keys in other modules.
