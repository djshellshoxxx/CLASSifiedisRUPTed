# PS-096-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_enforcement. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-096-04.R01 | State-changing commands require `Idempotency-Key` and `expected_revision` (per action). | MVP |
| PS-096-04.R02 | Apply and approve p95 ≤ 300 ms; hard timeout 2 s. Effect propagation is asynchronous and not part of the command latency. | MVP |
| PS-096-04.R03 | Events are `enf.<past-tense verb>` with schema_version 1.0.0 (CTR-EVT-001 R10). | MVP |
| PS-096-04.R04 | Payloads contain IDs, action type, reason code and times only. | MVP |

## Data / schema
| Command | Body | Event |
|---|---|---|
| `enf.apply` | `action_type`, `target_type`, `target_id`, `case_id`, `reason_code`, `expires_at?` | `enf.applied` |
| `enf.approve` | `enf_id`, `expected_revision` | `enf.approved` |
| `enf.reject` | `enf_id`, `expected_revision` | `enf.rejected` |
| `enf.reverse` | `enf_id`, `expected_revision`, `appeal_ref?` | `enf.reversed` |
| `enf.supersede` | `enf_id`, `expected_revision`, replacement action body | `enf.superseded` |

Queries: `enf.get` (operator, case scope; target owner sees own action type, dates and reason category), `enf.list_by_target` (operator, cursor ≤ 100).

## Commands / queries / events
Example:
```http
POST /v1/moderation/enforcement
Idempotency-Key: 0190f5d0-2b3c-7e4f-8a5b-7c6d5e4f3a2b

{"action_type": "hide", "target_type": "lst", "target_id": "lst_01J9Z8...", "case_id": "cas_01J9Z9...", "reason_code": "PROHIBITED_ITEM", "expires_at": "2026-12-18T09:00:00Z"}

201 {"enf_id": "enf_01JA00...", "state": "active", "revision": 1, "effect_status": "pending", "event_id": "evt_01JA01..."}
```
Event payloads: `enf_id`, `action_type`, `target_type`, `target_id`, `reason_code`, `expires_at`. `max_data_class` = PSEUDONYMOUS.

## States & transitions
Event names map to rows in [PS-096-03](workflow_state_machine.md).

## Validation & errors
Codes in [PS-096-02](validation_rules.md).

## Authorization
Capabilities in [PS-096-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Scope of idempotency keys per CTR-EVT-001 R03; effect retry per [PS-096-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Federation: only `enf.applied` with `reason_code = FEDERATION_TOMBSTONE` may be exported, as a tombstone (CTR-FED-001 R07). All other enforcement events stay local.

## Observability & budgets
Span `enforce.<command>` with `request_id`, outcome code and duration.

## Tests
- `TEST-PS-096-04-01` contract: bodies and events validate against schemas.
- `TEST-PS-096-04-02` contract: no event payload contains free text.
- `TEST-PS-096-04-03` integration: duplicate `enf.apply` with same key → one action.
- `TEST-PS-096-04-04` contract: federation export of a non-tombstone enforcement event is refused.

## Acceptance criteria
1. Every command has schema, idempotency rule, error list and event.
2. No event carries free text or case narrative.
3. Apply latency budget met in load test.

## Assumptions & open decisions
- ASSUMPTION: `enf.applied` payload field `effect_status` is not in events; it is read through `enf.get`.
- D01 (federated protocol), PROVISIONAL default: tombstone-only federation of enforcement (unapproved).
