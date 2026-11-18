# PS-030-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_disputes. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-030-04.R01 | Commands carry `idempotency_key` (ULID, 26 chars) and, where a subject is mutated, `expected_revision`. | MVP |
| PS-030-04.R02 | Commands: `dispute.create`, `dispute.add_evidence`, `dispute.respond`, `dispute.withdraw`. Queries: `dispute.get_link` (participant), `dispute.list_for_subject` (participant). | MVP |
| PS-030-04.R03 | This module's commands call F09 record commands of the same name; request payloads are validated here before forwarding. | MVP |
| PS-030-04.R04 | Events: `service_dispute.link_opened`, `service_dispute.link_refused`. Envelope per CTR-EVT-001 R01. | MVP |
| PS-030-04.R05 | `dispute.list_for_subject` returns ≤ 20 rows, cursor-based, ordered by `opened_at` then `dispute_ref`. | MVP |
| PS-030-04.R06 | Event payloads contain `dispute_ref`, `subject_id`, `reason_code`, and `link_state`; never narrative, evidence bodies or amounts above PSEUDONYMOUS class. | MVP |
| PS-030-04.R07 | Schemas registered as `service_dispute.link_opened` 1.0.0 per CTR-SCH-001. | MVP |

## Data / schema
Request body example (create):
```
{ "subject_type": "milestone", "subject_id": "…", "reason_code": "NOT_DELIVERED",
  "requested_minor": "15000", "currency": "EUR", "idempotency_key": "01J…" }
```
Event payload: `{ dispute_ref, subject_id, reason_code, link_state, occurred_at }`.

## Commands / queries / events
| Name | Kind | Idempotent | Errors |
|---|---|---|---|
| dispute.create | command | yes (key + digest) | DISPUTE.* validation codes; F09 unavailable |
| dispute.add_evidence | command | yes | DISPUTE.EVIDENCE_LIMIT; EVT.REVISION_CONFLICT |
| dispute.respond | command | yes | DISPUTE.WINDOW_CLOSED |
| dispute.withdraw | command | yes | DISPUTE.INVALID_TRANSITION |
| dispute.get_link | query | n/a | SYS.NOT_FOUND |
| dispute.list_for_subject | query | n/a | DISPUTE.QUERY_TOO_BROAD |

## States & transitions
Commands map to [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Codes in [validation_rules.md](validation_rules.md); envelope per CTR-ERR-001 R01.

## Authorization
Capabilities in [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope (actor, command, key) per CTR-EVT-001 R03. Replays return the original result and emit no event.

## Privacy, retention, abuse
Query results are restricted to participants (CTR-CAP-001 R04). `dispute.list_for_subject` does not reveal the other party's `acc_`.

## Observability & budgets
Latency histogram per command; `dispute.create` p95 ≤ 1 s including F09 call (ASSUMPTION).

## Tests
- TEST-PS-030-04-01 contract: golden fixtures for six operations.
- TEST-PS-030-04-02 integration: replay of `dispute.create` produces one link and one event.
- TEST-PS-030-04-03 negative: list over 20 rows returns cursor, not overflow.

## Acceptance criteria
1. Every command has a registered schema and error set.
2. Replays emit zero extra events.
3. No query reveals a non-participant's identity.

## Assumptions & open decisions
- ASSUMPTION: list limit 20.
- Payment checklist applies: payloads carry amounts only as decimal strings (CTR-COM-001 R02).
