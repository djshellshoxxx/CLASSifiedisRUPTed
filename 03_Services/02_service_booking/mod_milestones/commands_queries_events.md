# PS-031-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_milestones. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-031-04.R01 | State-changing commands carry `idempotency_key` (ULID) and `expected_revision`. | MVP |
| PS-031-04.R02 | Commands: `milestone.plan_set` (replace whole plan in `planned` booking), `milestone.start`, `milestone.submit`, `milestone.accept`, `milestone.reject`, `milestone.cancel`. Queries: `milestone.list_for_booking`, `milestone.get`. | MVP |
| PS-031-04.R03 | `milestone.plan_set` is atomic: all rows or none; max 12 rows. | MVP |
| PS-031-04.R04 | Events use past-tense verbs (CTR-EVT-001 R10) listed in [workflow_state_machine.md](workflow_state_machine.md). | MVP |
| PS-031-04.R05 | Event payload ≤ 4 KiB; contains `milestone_id`, `booking_id`, `state`, `revision`, `amount_minor` as decimal string. No acceptance text. | MVP |
| PS-031-04.R06 | `milestone.list_for_booking` returns ≤ 12 rows (plan size), ordered by `order_index`. | MVP |
| PS-031-04.R07 | Schemas registered per CTR-SCH-001 (`milestone.submitted` 1.0.0, etc.). | MVP |

## Data / schema
Submit request example:
```
{ "milestone_id": "…", "expected_revision": 4, "idempotency_key": "01J…",
  "evidence_digests": ["sha256:…"] }
```
`evidence_digests` ≤ 10 entries.

## Commands / queries / events
| Name | Kind | Idempotent | Errors |
|---|---|---|---|
| milestone.plan_set | command | yes | MILESTON.COUNT_INVALID, SUM_MISMATCH, PLAN_LOCKED |
| milestone.start | command | yes | INVALID_TRANSITION |
| milestone.submit | command | yes | INVALID_TRANSITION, EVT.REVISION_CONFLICT |
| milestone.accept | command | yes | INVALID_TRANSITION |
| milestone.reject | command | yes | REASON_INVALID (via MILESTON.TEXT_INVALID) |
| milestone.cancel | command | yes | INVALID_TRANSITION |
| milestone.list_for_booking | query | n/a | SYS.NOT_FOUND |

## States & transitions
Commands map to [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
[validation_rules.md](validation_rules.md); envelope per CTR-ERR-001 R01.

## Authorization
[authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope (actor, command, key) per CTR-EVT-001 R03. Replay returns original result; no new event.

## Privacy, retention, abuse
Evidence digests only; no media. Query results limited to booking participants.

## Observability & budgets
`milestone.submit` p95 ≤ 300 ms (ASSUMPTION).

## Tests
- TEST-PS-031-04-01 contract: fixtures for all commands and events.
- TEST-PS-031-04-02 integration: `plan_set` partial failure leaves prior plan intact.
- TEST-PS-031-04-03 integration: replay of `milestone.accept` emits one event.

## Acceptance criteria
1. Every command has schema and error set registered.
2. `plan_set` is all-or-nothing under injected failure.
3. Event payloads contain no acceptance text.

## Assumptions & open decisions
- ASSUMPTION: 4 KiB event cap.
- Payment checklist applies: amounts as decimal strings only (CTR-COM-001 R02).
