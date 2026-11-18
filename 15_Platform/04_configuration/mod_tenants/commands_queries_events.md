# PS-125-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_tenants](SPEC.md) (Platform Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-125-04.R01 | Every state-changing command requires an `idempotency_key` (UUID v4) and `expected_revision` where a revision exists. | MVP |
| PS-125-04.R02 | Commands return within 500 ms p95 excluding provisioning; provisioning returns `202` with a status query. | MVP |
| PS-125-04.R03 | Every command emits exactly one CTR-EVT-001 envelope per committed change. | MVP |
| PS-125-04.R04 | `tenant.list` returns ≤ 50 items per page and only for `ope` principals with a purpose. | MVP |

## Data / schema
Command payloads are JSON objects with `schema_version: "1.0.0"`. Config updates use JSON Merge Patch (RFC 7396; ASSUMPTION).

## Commands / queries / events
| Command | Input (required) | Idempotency | Emits | Errors |
|---|---|---|---|---|
| `tenant.create` | slug, display_name, admin_ref, region_cells, config | key | `tenant.created` | TEN.SLUG_TAKEN, TEN.SLUG_INVALID, TEN.CONFIG_INVALID |
| `tenant.update_config` | tenant_id, expected_revision, patch | key | `tenant.config_changed` | EVT.REVISION_CONFLICT, TEN.CONFIG_INVALID |
| `tenant.suspend` | tenant_id, reason_code, approvals[2] | key | `tenant.suspended` | TEN.INVALID_TRANSITION, CAP.DUAL_APPROVAL_REQUIRED |
| `tenant.resume` | tenant_id, approvals[2] | key | `tenant.resumed` | TEN.INVALID_TRANSITION |
| `tenant.offboard` | tenant_id, export_profile | key | `tenant.offboarding_started` | TEN.INVALID_TRANSITION, TEN.ADMIN_NOT_ACTIVE |

Queries: `tenant.get(tenant_id)`, `tenant.get_by_slug(slug)` (PUBLIC fields only; rate limited), `tenant.list(cursor, limit ≤ 50)`.

Events (aggregate_type `tenant`, `max_data_class` PSEUDONYMOUS): `tenant.created`, `tenant.activated`, `tenant.config_changed`, `tenant.suspended`, `tenant.resumed`, `tenant.offboarding_started`, `tenant.deleted`. Payload carries `tenant_id`, changed field names and `revision`; never config values.

## States & transitions
Command-to-transition mapping is in [PS-125-03](workflow_state_machine.md).

## Validation & errors
Codes are in [PS-125-02](validation_rules.md). Shared codes (`SYS.NOT_FOUND`, `EVT.REVISION_CONFLICT`, `CAP.DUAL_APPROVAL_REQUIRED`) are referenced from their contracts.

## Authorization
Per-command rules are in [PS-125-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Same key and same digest returns the original result with no new event. Same key and different digest returns `EVT.IDEMPOTENCY_KEY_REUSED`. Key retention: 7 days (RET-OPS default).

## Privacy, retention, abuse
Payloads are not logged (CTR-ERR-001 R10). `admin_ref` is pseudonymous in events.

## Observability & budgets
Latency and outcome metrics per command (see [PS-125-08](observability_performance.md)).

## Tests
- TEST-PS-125-04-01 (contract): each command validates against its schema; missing `idempotency_key` → `SYS.VALIDATION_FAILED`.
- TEST-PS-125-04-02 (idempotency): replay with same digest returns identical response and one event.
- TEST-PS-125-04-03 (contract): event envelopes validate against CTR-EVT-001.

## Acceptance criteria
1. Each command row maps to exactly one event on success.
2. No event payload contains a config value or a display name.
3. Query `tenant.get_by_slug` returns no fields beyond PUBLIC.

## Assumptions & open decisions
- ASSUMPTION: JSON Merge Patch for config updates.
- PROVISIONAL (D07 default, unapproved): 7-day idempotency retention.
- ASSUMPTION: `SYS.VALIDATION_FAILED` is the shared code for a malformed envelope (to be confirmed in CTR-ERR-001 catalogue).
