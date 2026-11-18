# PS-132-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_response. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-SCH-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-132-01.R01 | One `containment_action` record per action taken or proposed; immutable after `executed`. | MVP |
| PS-132-01.R02 | `action_type` is a closed enum (see table); unknown type is rejected. | MVP |
| PS-132-01.R03 | Every action records `reversible` (bool), `blast_radius` (enum), and `rollback_plan` (text ≤ 1,000 characters). | MVP |
| PS-132-01.R04 | Actions reference the parent incident by `inc_` ID; no action exists without an incident for SEV1–SEV2. | MVP |
| PS-132-01.R05 | Action results record counts and IDs of affected aggregates only, never personal content. | MVP |

## Data / schema
```json
{
  "action_id": "rsp_<26 Crockford base32> (PENDING CTR-ID-001 prefix, proposed rsp, class ulid)",
  "incident_id": "inc_...",
  "action_type": "flag_disable | session_revoke_scope | key_revoke_request | peer_quarantine | federation_pause | notice_publish | data_hold",
  "target_ref": "typed ref (flg_, key_, fpr_, acc_ scope)",
  "blast_radius": "single_record | scope_group | platform_wide",
  "reversible": "boolean",
  "rollback_plan": "string <= 1000 chars",
  "status": "proposed | approved | executing | executed | failed | rolled_back | expired",
  "approvers": ["ope_...", "ope_..."],
  "requested_by": "ope_... | sys_...",
  "executed_at": "RFC 3339 UTC | null",
  "result": {"affected_count": "integer", "error_code": "closed enum | null"}
}
```
- `flg_` is a feature-flag reference owned by F15 (`15_Platform/04_configuration`); used as a target only.
- Classes: all fields ≤ PRIVATE_PERSONAL; `target_ref` values are IDs (PSEUDONYMOUS).

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Each action has `action_id` idempotency; executor is idempotent on (`action_id`, step).

## Privacy, retention, abuse
Action records retained with their incident (PS-131-07). No content of revoked sessions is recorded.

## Observability & budgets
Gauge `containment_open_actions{blast_radius}`.

## Tests
- TEST-PS-132-01-01: unit, closed action types.
- TEST-PS-132-01-02: unit, rejection of action without rollback plan.

## Acceptance criteria
1. 100% of records include `reversible` and `rollback_plan`.
2. No record stores revoked session tokens or key bytes.

## Assumptions & open decisions
- ASSUMPTION: 1,000-character rollback plan limit.
- PENDING CTR-ID-001: prefix `rsp`.
- D10 (key revocation and rotation): PROVISIONAL (D10 default, unapproved).
