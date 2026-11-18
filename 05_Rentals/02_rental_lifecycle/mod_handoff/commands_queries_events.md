# PS-042-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

**Decision labels:** D04 OPEN. D08 PROVISIONAL (offline).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-042-04.R01 | Every command requires `idempotency_key`; state-changing commands require `expected_revision`. | MVP |
| PS-042-04.R02 | Events use `aggregate_type = rental_handoff` (distinct from meetup `handoff`), so event types never collide. | MVP |
| PS-042-04.R03 | One event per command; no event contains coordinates or photo bytes. | MVP |
| PS-042-04.R04 | `rental_handoff.attest` p95 ≤ 300 ms (ASSUMPTION). | MVP |

## Data / schema
`schedule` payload: `rental_id`, `window_start`, `window_end`, `place_region_cell?`. `attest` payload: `checklist[]`, `photo_digests[]`, `signature`. Event payloads: IDs, status, state version.

## Commands / queries / events
| Command | Caller | Event | Error codes |
|---|---|---|---|
| `rental_handoff.schedule` | owner or renter | rental_handoff.scheduled | WINDOW_INVALID, LOCATION_TOO_PRECISE, SYS.UNPROCESSABLE_STATE |
| `rental_handoff.attest` | party | rental_handoff.attested | CHECKLIST_INCOMPLETE, EXPIRED, ALREADY_COMPLETE |
| `rental_handoff.contest` | party | rental_handoff.contested | INVALID_TRANSITION |
| `rental_handoff.cancel` | party or `mod` (case) | rental_handoff.cancelled | INVALID_TRANSITION |

Queries: `rental_handoff.get`, `rental_handoff.list_by_rental` (participants). `max_data_class = PRIVATE_PERSONAL`.

## States & transitions
Event mapping in PS-042-03.

## Validation & errors
PS-042-02 gates.

## Authorization
Caller column is minimum; capabilities in PS-042-05.

## Failure, idempotency, concurrency, offline
Same key with different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Attestation payload is signed over the stored content (PS-042-01 R05).

## Privacy, retention, abuse
Events omit checklist detail beyond state; `max_data_class` PRIVATE_PERSONAL; never federated.

## Observability & budgets
`rental_handoff_command_latency_ms` per command.

## Tests
- TEST-PS-042-04-01 (contract): payload and envelope validation for each command.
- TEST-PS-042-04-02 (idempotency): duplicate attest → one event.
- TEST-PS-042-04-03 (namespace): event types for this module never equal meetup handoff types.
- TEST-PS-042-04-04 (concurrency): stale `expected_revision` → `SYS.CONFLICT`.

## Acceptance criteria
1. Each command maps to one event and one transition.
2. Event type namespace is disjoint from F08.S03.M02.
3. No coordinates in any payload.

## Assumptions & open decisions
- ASSUMPTION: 300 ms budget.
- PENDING CTR-ID-001 `hnd` prefix and CTR-SCH-001 registration.
