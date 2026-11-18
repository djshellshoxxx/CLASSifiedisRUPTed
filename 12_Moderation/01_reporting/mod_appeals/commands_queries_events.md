# PS-092-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_appeals. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-092-04.R01 | State-changing commands require `Idempotency-Key` and `expected_revision`. | MVP |
| PS-092-04.R02 | Submit p95 ≤ 300 ms; decision commands p95 ≤ 300 ms; hard timeout 2 s. | MVP |
| PS-092-04.R03 | Events are `appeal.<past-tense verb>` (CTR-EVT-001 R10), schema_version 1.0.0. | MVP |
| PS-092-04.R04 | Event payloads carry IDs, state and decision code only; never `body` or reviewer notes. | MVP |

## Data / schema
| Command | Body | Event |
|---|---|---|
| `appeal.submit` | `target_id`, `body`, `evidence_refs[]` | `appeal.received` |
| `appeal.withdraw` | `apl_id`, `expected_revision` | `appeal.withdrawn` |
| `appeal.assign` | `apl_id`, `expected_revision`, `reviewer_ref` | `appeal.assigned` |
| `appeal.decide` | `apl_id`, `expected_revision`, `decision_code`, `reason_code`, `modified_action?` | `appeal.decided` |
| `appeal.acknowledge_implementation` | `apl_id`, `enforcement_revision` | `appeal.implemented` |

Queries: `appeal.get` (appellant: own, state only; reviewer: assigned, with body), `appeal.list_backlog` (ope/mod, case scope, cursor ≤ 100).

## Commands / queries / events
Example:
```http
POST /v1/moderation/appeals
Idempotency-Key: 0190f4c2-1a7e-7b3c-9d2e-6f8a0b1c2d3e

{"target_id": "enf_01J9Z5...", "body": "The listing was reported by mistake; photos attached.", "evidence_refs": ["evd_01J9Z6..."]}

201 {"apl_id": "apl_01J9Z7...", "state": "received", "revision": 1, "window_ends_at": "2026-12-18T09:00:00Z"}
```
Event envelope per CTR-EVT-001. `max_data_class` = PSEUDONYMOUS. Events never carry `body`.

## States & transitions
One event per transition in [PS-092-03](workflow_state_machine.md).

## Validation & errors
Codes in [PS-092-02](validation_rules.md), plus `APPEALS.TRANSITION_NOT_ALLOWED` (422, non-retryable).

## Authorization
Capabilities in [PS-092-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Scope and retention of idempotency keys per CTR-EVT-001 R03; retry rules in [PS-092-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Federation export of appeal events is not supported in MVP (PRIVATE_PERSONAL data, CTR-FED-001 R03).

## Observability & budgets
Span `appeals.<command>` with `request_id`, `code`, duration.

## Tests
- `TEST-PS-092-04-01` contract: bodies and events validate against schemas; unknown fields rejected.
- `TEST-PS-092-04-02` contract: event payloads contain no `body` string (schema forbids it).
- `TEST-PS-092-04-03` integration: `appeal.submit` twice with the same key → one `apl_`, one event.

## Acceptance criteria
1. Every command and event has schema, idempotency rule and error list.
2. No event payload includes appeal text in the test corpus.
3. Submit and decide meet the latency budget in the load test.

## Assumptions & open decisions
- ASSUMPTION: `enforcement_revision` in `appeal.acknowledge_implementation` is the revision returned by `mod_enforcement`.
- D01 (federated protocol), PROVISIONAL default: appeals are not federated in MVP (unapproved).
