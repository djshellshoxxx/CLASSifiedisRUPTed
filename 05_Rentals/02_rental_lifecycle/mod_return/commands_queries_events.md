# PS-043-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_return. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

**Decision labels:** D08 PROVISIONAL (offline). D04 OPEN.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-043-04.R01 | Every command requires `idempotency_key`; state-changing commands require `expected_revision`. | MVP |
| PS-043-04.R02 | One `rental_return.*` event per command; `aggregate_type = rental_return`. | MVP |
| PS-043-04.R03 | Damage reporting delegates to `damage.report` (F05.S02.M03); this module stores only the link. | MVP |
| PS-043-04.R04 | Deposit release is requested by event `rental_return.closed`; this module does not call deposit commands that move money state. | MVP |
| PS-043-04.R05 | `return.declare` p95 ≤ 300 ms (ASSUMPTION). | MVP |

## Data / schema
`return.declare` payload: `return_place_cell?`, `renter_checklist[]`, `renter_note?`. `return.confirm` payload: `owner_result`. Events carry IDs, status, `late_minutes`, `state_version`.

## Commands / queries / events
| Command | Caller | Event | Error codes |
|---|---|---|---|
| `return.declare` | renter | rental_return.declared | TOO_EARLY, ALREADY_DECLARED, CHECKLIST_INCOMPLETE, LOCATION_TOO_PRECISE, NOTE_CONTACT_DATA |
| `return.confirm` | owner | rental_return.confirmed | WINDOW_CLOSED, INVALID_TRANSITION |
| `return.report_damage` | owner | rental_return.damage_opened | WINDOW_CLOSED, plus DAMAGE.* from `damage.report` |
| `return.close` | system | rental_return.closed | ALREADY_CLOSED |

Queries: `return.get`, `return.list_by_rental` (participants).

## States & transitions
Event mapping in PS-043-03.

## Validation & errors
PS-043-02 gates.

## Authorization
Caller column is minimum; PS-043-05.

## Failure, idempotency, concurrency, offline
Same key with different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. A late commit keeps server-time `late_minutes`.

## Privacy, retention, abuse
Events omit `renter_note` and checklist detail. `max_data_class = PRIVATE_PERSONAL`.

## Observability & budgets
`return_command_latency_ms` per command.

## Tests
- TEST-PS-043-04-01 (contract): command and event schema validation.
- TEST-PS-043-04-02 (idempotency): duplicate declare → one event.
- TEST-PS-043-04-03 (delegation): report_damage creates a `dmg_` and links it; no amount written here.
- TEST-PS-043-04-04 (concurrency): confirm racing with close → one wins; other gets `SYS.CONFLICT`.

## Acceptance criteria
1. Each command maps to one event and one transition.
2. No amount is stored in this module (TEST-PS-043-04-03).
3. Deposit release is requested only through `rental_return.closed`.

## Assumptions & open decisions
- ASSUMPTION: 300 ms budget.
- PENDING CTR-ID-001 `rtn` prefix and CTR-SCH-001 registration.
