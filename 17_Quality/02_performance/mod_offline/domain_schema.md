# PS-140-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_offline. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-140-01.R01 | Each scenario record names exactly one fault profile, one expected outcome and one budget reference. | MVP |
| PS-140-01.R02 | `fixture_class` is `synthetic` on 100% of scenario and run records; any other value is rejected at write. | MVP |
| PS-140-01.R03 | Run records are append-only. A rerun creates a new record with `attempt` = previous + 1. | MVP |
| PS-140-01.R04 | `max_data_class` is `PUBLIC` on all records (CTR-PRV-001 ordering). | MVP |
| PS-140-01.R05 | The MVP catalogue holds at least 12 scenarios, one per fault profile below. | MVP |

## Data / schema
`offline_scenario` (JSON Schema, `additionalProperties: false`):
- `scenario_key`: string, pattern `^OFFSCN-[0-9]{2,3}$`, unique, immutable.
- `title_key`: string, message catalogue key (no prose).
- `fault_profile`: enum `airplane_mode`, `drop_mid_request`, `duplicate_delivery`, `clock_skew_5m`, `revoked_grant_at_reconnect`, `expired_proposal_at_reconnect`, `partial_sync`, `stale_peer_record`.
- `expected_outcome`: enum `queued_then_synced`, `rejected_with_code`, `conflict_surfaced`.
- `budget_ref`: string, resolves to a row in [observability_performance](observability_performance.md).
- `fixture_class`: const `synthetic`.
- `version`: semver. `revision`: integer ≥ 1.

`offline_run`:
- `run_id`: entity ID `<prefix>_<body>`; prefix PENDING CTR-ID-001 registry entry.
- `scenario_key`, `scenario_version`, `build_ref` (40 lowercase hex, commit SHA).
- `attempt`: integer ≥ 1. `outcome`: enum `pass`, `fail`, `aborted_infra`.
- `failed_assertions`: array of assertion codes; never values.
- `duration_ms`: integer ≥ 0. `started_at`, `finished_at`: RFC 3339 UTC.
- `runner_ref`: `sys_` principal ID.
- `max_data_class`: const `PUBLIC`.

Provenance: each run records `runner_ref` and `build_ref`. No field may hold a device ID, IP address or account ID.

## Canonical owner (B-06)
Pending-write, sync-state and device records for the offline queue: canonical owner `F15.S01.M01` at [15_Platform/01_pwa/mod_offline](../../../15_Platform/01_pwa/mod_offline/SPEC.md) (PS-116-*). This module references those records by full ID only.

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-140-01-01 (unit): offline_scenario with fixture_class other than synthetic is rejected at write.
- TEST-PS-140-01-02 (property): attempt numbers strictly increase per (build_ref, scenario_key).

## Acceptance criteria
1. TEST-PS-140-01-01, TEST-PS-140-01-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

