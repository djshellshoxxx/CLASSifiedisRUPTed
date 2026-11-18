# PS-066-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_safe (Platform Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R10), CTR-SCH-001, CTR-ERR-001, CTR-ID-001. **Decisions:** D08 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-066-04.R01 | Every state-changing command carries `expected_revision` and `idempotency_key` (UUID v4 or ULID, ≥ 128 bits). | MVP |
| PS-066-04.R02 | Command responses return `meetup_plan_id`, `revision` and `status` only. | MVP |
| PS-066-04.R03 | Events use `meetup_plan.<past-tense-verb>` (CTR-EVT-001 R10). | MVP |
| PS-066-04.R04 | Event payloads exclude trusted-contact handles and codes; they carry hashes only where needed for audit. | MVP |

## Data / schema
Schema `meetup_plan` version `1.0.0`, registered per CTR-SCH-001 (`schema_id` = `meetup_plan`). Event schema IDs equal `event_type`.

## Commands / queries / events
| Command | Event(s) | Expected revision | Key scope |
|---|---|---|---|
| `meetup.propose` | `meetup_plan.proposed` | null | actor + command + key |
| `meetup.confirm` | `meetup_plan.confirmed` | required | same |
| `meetup.cancel` | `meetup_plan.cancelled` | required | same |
| `meetup.check_in` | `meetup_plan.checked_in` (+ `meetup_plan.both_checked_in`) | required | same |
| `meetup.check_out` | `meetup_plan.checked_out` | required | same |
| `meetup.safe_exit` | `meetup_plan.safe_exited` | required | same |
| `meetup.set_trusted_contact` | `meetup_plan.trusted_contact_set` | required | same |
| `meetup.get` (query) | none | n/a | n/a |
| timers (`sys_`) | `meetup_plan.expired`, `meetup_plan.activated` | required | timer ID |

`max_data_class` = PRIVATE_PERSONAL for all events. `meetup_plan.both_checked_in` is emitted in the same commit as the second check-in.

## States & transitions
Events map to PS-066-03 transitions one-to-one, except `both_checked_in`, which is a second event in the same transaction.

## Validation & errors
Shared codes: `SYS.CONFLICT`, `SYS.NOT_FOUND`, `SYS.REQUEST_MALFORMED`. Module codes per PS-066-02 and `SAFE.INVALID_TRANSITION`.

## Authorization
Command authorization in PS-066-05.

## Failure, idempotency, concurrency, offline
Same key and same digest → original result. Same key, different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Offline commands queue per D08; `meetup.safe_exit` is queued with the highest priority in the client outbox.

## Privacy, retention, abuse
No event is federated. Event subscribers receive `mtp_` IDs and enums.

## Observability & budgets
Per-command counter by result code. Event envelope logged by ID and type only.

## Tests
- TEST-PS-066-04-01 (contract): every command response matches the response schema; no extra fields.
- TEST-PS-066-04-02 (contract): every emitted event validates against CTR-EVT-001 and `meetup_plan` schema.
- TEST-PS-066-04-03 (unit): replayed `meetup.check_in` with same key returns original revision.
- TEST-PS-066-04-04 (unit): key reuse with a different digest returns `EVT.IDEMPOTENCY_KEY_REUSED`.

## Acceptance criteria
1. Command and event tables match the implementation (generated test).
2. No event payload contains a handle, code or venue free text.
3. All `meetup_plan.*` events have `max_data_class` = PRIVATE_PERSONAL.

## Assumptions & open decisions
- ASSUMPTION: event schema `meetup_plan` starts at 1.0.0.
- D08 (PROVISIONAL default, unapproved).
