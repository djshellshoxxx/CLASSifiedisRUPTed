# PS-109-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_keyboard. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-109-01.R01 | Every interactive component in the component catalog has exactly one focus contract record before release (100% coverage, CI gate). | MVP |
| PS-109-01.R02 | A binding record holds at most one chord per (action_id, scope, owner_ref). | MVP |
| PS-109-01.R03 | Keyboard records contain no content from listings, messages, attachments or location. | MVP |

## Data / schema
Focus contract (`kbd_component_contract`, static build artifact, data class PUBLIC):
```json
{"component_id":"string ^[a-z]+(\\.[a-z0-9_]+)+$ PK","focus_order":"enum dom_order|explicit_index",
 "focus_order_index":"int 0..9999 (required iff explicit_index)","roving_tabindex":"bool",
 "escape_action":"enum close|cancel_edit|none","focus_return_target":"component_id|null",
 "schema_version":"1.0.0"}
```
Shortcut binding (`kbb_` record, PENDING CTR-ID-001 registry entry; `ulid`):
| Field | Type | Constraint | Class |
|---|---|---|---|
| binding_id | string | `kbb_` + 26 chars | PSEUDONYMOUS |
| action_id | string | registered action, dotted lowercase | PUBLIC |
| chord | object | `{mods:[ctrl\|alt\|shift\|meta] sorted, key:string}`; key from allowlist | PSEUDONYMOUS |
| scope | enum | `account` (server) or `device` (never transmitted) | PSEUDONYMOUS |
| owner_ref | string | `acc_` id; null when scope=device | PSEUDONYMOUS |
| revision | int | ≥1, incremented per write | PSEUDONYMOUS |
| provenance | enum | `default` or `user_set` | PUBLIC |

Ownership: F14.S01.M01 owns focus contracts and binding records. UI modules own components and reference `component_id`.

## Commands / queries / events
See [PS-109-04](commands_queries_events.md). Schema versions follow CTR-SCH-001 registry.

## States & transitions
See [PS-109-03](workflow_state_machine.md).

## Validation & errors
See [PS-109-02](validation_rules.md). Error prefix: `KBD.`

## Authorization
See [PS-109-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Record-level rules in [PS-109-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Data classes above; no content classes. See [PS-109-07](privacy_retention_abuse.md).

## Observability & budgets
Record counts only. See [PS-109-08](observability_performance.md).

## Tests
- TEST-PS-109-01-01 unit: schema accepts all catalog entries; rejects unknown `focus_order` value.
- TEST-PS-109-01-02 property: every binding row satisfies R02 under random insert sequences.
- TEST-PS-109-01-03 CI: catalog coverage equals interactive component count (R01).

## Acceptance criteria
1. Catalog coverage is 100% of interactive components; CI fails otherwise.
2. Binding uniqueness per (action_id, scope, owner_ref) holds in storage and in tests.
3. Schema contains no field with class above PSEUDONYMOUS.

## Assumptions & open decisions
- ASSUMPTION: `kbb_` prefix is not yet registered in CTR-ID-001 (PENDING CTR-ID-001 entry).
- D07 (retention): PROVISIONAL (D07 default, unapproved). Applies to account-scope bindings.
