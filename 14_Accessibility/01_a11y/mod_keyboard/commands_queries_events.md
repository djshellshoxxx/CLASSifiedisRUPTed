# PS-109-04 — commands, queries and events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_keyboard. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-109-04.R01 | Every state-changing command requires `idempotency_key` and `expected_revision`. | MVP |
| PS-109-04.R02 | Commands return within 300 ms p95 at the server (ASSUMPTION). | MVP |
| PS-109-04.R03 | Event payloads validate against `keyboard_binding.changed` schema_version 1.0.0. | MVP |

## Data / schema
Command `kbd.binding.set` v1.0.0 input:
```json
{"idempotency_key":"ULID","action_id":"listing.publish","chord":{"mods":["ctrl","shift"],"key":"KeyP"},
 "scope":"account","expected_revision":3}
```
Response `200`: `{"binding_id":"kbb_01...","revision":4}`.
Command `kbd.binding.reset` v1.0.0 input: `{idempotency_key, action_id | "all", expected_revision}`.
Query `kbd.binding.list` v1.0.0: `{scope:"account"}` → array, max 200 items, no cursor needed.

## Commands / queries / events
Event `keyboard_binding.changed` (aggregate `kbb`, data class PSEUDONYMOUS): `{binding_id, action_id, change: set|reset, revision}`.
Errors: KBD.INVALID_BINDING, KBD.RESERVED_KEY, KBD.SHORTCUT_CONFLICT, KBD.PREFERENCE_STALE (see [PS-109-02](validation_rules.md)); `SYS.NOT_FOUND` for unreadable records.

## States & transitions
Event emission follows [PS-109-03](workflow_state_machine.md).

## Validation & errors
Request validation per [PS-109-02](validation_rules.md) before idempotency lookup.

## Authorization
Actor must be the owning `acc_` ([PS-109-05](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Idempotency scope = (actor, command type, idempotency_key) per CTR-EVT-001 R03. Retry policy in [PS-109-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Events carry no chord value beyond `action_id` and revision. Device-scope bindings never produce commands or events.

## Observability & budgets
Per-command counters and latency histogram. Event lag to subscribers p95 ≤ 2 s (ASSUMPTION).

## Tests
- TEST-PS-109-04-01 contract: request and response validate against v1.0.0 schemas.
- TEST-PS-109-04-02 integration: same key and same digest returns original result, no second event.
- TEST-PS-109-04-03 integration: same key with different digest returns idempotency error (CTR-EVT-001 R03).

## Acceptance criteria
1. Each command has a documented schema, error list and idempotency scope.
2. Duplicate delivery produces exactly one event.
3. The event validates against its registry entry.

## Assumptions & open decisions
- ASSUMPTION: list endpoint returns the full set (≤200) without pagination.
- No Dxx decision directly affects the interface.
