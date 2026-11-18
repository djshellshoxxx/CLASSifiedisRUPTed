# PS-126-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_authorization](SPEC.md) (Security Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-EVT-001, CTR-ERR-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-126-04.R01 | `authz.decide` returns within 5 ms p95 and always returns a `dec_` ID. | MVP |
| PS-126-04.R02 | `grant.*` and `policy.*` mutations carry `idempotency_key` and `expected_revision`. | MVP |
| PS-126-04.R03 | `authz.decide` is callable only by service identities; never by clients. | MVP |
| PS-126-04.R04 | `authz.explain` returns reason codes and policy version only, never object content. | MVP |

## Data / schema
Command and event payloads use CTR-CAP-001 grant and decision shapes. `policy.publish` payload: `policy_version`, `rules_hash`, `approvals[]`.

## Commands / queries / events
| Command | Input | Idempotency | Emits | Errors |
|---|---|---|---|---|
| `authz.decide` (internal) | principal, action, resource, context | none (new `dec_` each call) | decision record | SYS.UNAVAILABLE |
| `grant.create` | grant body | key | `grant.granted` | CAP.* |
| `grant.approve` | grant_id, approver | key | `grant.approved` | CAP.SELF_APPROVAL_FORBIDDEN, CAP.GRANT_NOT_ACTIVE |
| `grant.revoke` | grant_id, reason | key | `grant.revoked` | CAP.GRANT_NOT_ACTIVE |
| `policy.draft` | rules | key | none | AUTHZ.RULESET_TOO_LARGE |
| `policy.publish` | policy_version, approvals[2] | key | `policy.published`, `policy.superseded` | AUTHZ.ACTION_NOT_DECLARED, CAP.DUAL_APPROVAL_REQUIRED |
| `policy.rollback` | to_version | key | `policy.published` | AUTHZ.POLICY_NOT_FOUND |

Queries: `authz.explain(decision_id)` (ope with purpose), `grant.list(subject_ref)` (own grants for `acc_`; ope with purpose).

Events (aggregate `grant` or `policy`): `grant.granted`, `grant.approved`, `grant.revoked`, `grant.expired`, `policy.published`, `policy.superseded`.

## States & transitions
Mapping in [PS-126-03](workflow_state_machine.md).

## Validation & errors
Codes in [PS-126-02](validation_rules.md) and CTR-CAP-001.

## Authorization
Actions in [PS-126-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Key scope = (actor, command, key) per CTR-EVT-001 R03. `grant.approve` appends under revision check so two approvers racing do not overwrite each other.

## Privacy, retention, abuse
Event payloads carry IDs and reason codes. `grant.list` returns only grants where the subject is the caller.

## Observability & budgets
`authz_commands_total{command,outcome}`; decide latency p95 ≤ 5 ms.

## Tests
- TEST-PS-126-04-01 (contract): `authz.decide` output validates against the decision record schema.
- TEST-PS-126-04-02 (idempotency): replayed `grant.create` returns the same `grt_` and one event.
- TEST-PS-126-04-03 (negative): client token calling `authz.decide` receives SYS.FORBIDDEN.

## Acceptance criteria
1. Every mutation emits exactly one event on success.
2. No event payload contains object content.
3. `authz.explain` output contains no field values.

## Assumptions & open decisions
- ASSUMPTION: `authz.explain` available to ope with purpose only.
- PROVISIONAL (D10 default, unapproved): portability export of grants is a subject request, not an operator query.
