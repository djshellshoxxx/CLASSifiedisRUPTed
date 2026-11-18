# PS-043-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-043-04. **Owner:** [05_Rentals/02_rental_lifecycle/mod_return](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_return. **Consumers:** subscriber map in Section "Event subscribers" (provisional, A-return-02).

## Purpose and scope
Public interface of mod_return: HTTP commands and queries, domain event types, envelope use and schema versioning. Business behavior is in [workflow_state_machine.md](workflow_state_machine.md); validation codes in [validation_rules.md](validation_rules.md).

**Exclusions:** rental agreement reads and writes (mod_handoff); damage intake (mod_damage); deposit operations (mod_deposits); internal scheduler entry point (not public, see PS-043-06).

## Requirements
- PS-043-04.R01: Every state-changing command takes `Idempotency-Key`, `schema_version` and `expected_revision` and returns the post-transition view.
- PS-043-04.R02: Case coverage: happy path, each invalid code, replay with same key, replay with different payload, stale revision, unsupported schema version, offline replay. Each has an example in this file or in the tests file.
- PS-043-04.R03: Responses are JSON, UTF-8, with `Cache-Control: no-store` on all return endpoints. Field names are snake_case. Timestamps are RFC 3339 UTC with `Z`.
- PS-043-04.R04: Events use the CTR-EVT-001 envelope. Event payloads never include renter_note, owner_note or dispute text.
- PS-043-04.R05: Adding optional fields is a compatible change within a major version; removing or renaming a field requires a new `.vN` event type and a new schema_version.

## Commands (signatures)
```text
InitiateReturn(rental_id: ULID, return_point_ref: ULID?, idempotency_key, schema_version: 1)
  -> ReturnView | RETURN_*                       POST /v1/rentals/{rental_id}/returns       actor: renter
DeclareReturn(return_id: ULID, expected_revision: int>=1, returned_at: RFC3339,
  condition_declared: unchanged|changed_noted, renter_note: str<=280?, idempotency_key, schema_version: 1)
  -> ReturnView | RETURN_*                       POST /v1/returns/{return_id}/declare       actor: renter
CancelReturn(return_id, expected_revision, idempotency_key, schema_version: 1)
  -> ReturnView | RETURN_*                       POST /v1/returns/{return_id}/cancel        actor: renter
ConfirmReturn(return_id, expected_revision, owner_note?: str<=280, idempotency_key, schema_version: 1)
  -> ReturnView | RETURN_*                       POST /v1/returns/{return_id}/confirm       actor: owner
DisputeReturn(return_id, expected_revision, dispute_reason_code, owner_note?, idempotency_key, schema_version: 1)
  -> ReturnView | RETURN_*                       POST /v1/returns/{return_id}/dispute       actor: owner
ResolveReturnDispute(return_id, expected_revision, resolution: confirmed|closed,
  moderation_decision_ref: ULID, idempotency_key, schema_version: 1)
  -> ReturnView | RETURN_*                       POST /v1/returns/{return_id}/resolve       actor: moderator
```
`str<=280?` means optional text, maximum 280 code points after NFC.

## Queries
```text
GetReturn(return_id) -> ReturnView | RETURN_NOT_FOUND          GET /v1/returns/{return_id}
ListReturnsByRental(rental_id, cursor?, limit: 1..50 = 20)    GET /v1/rentals/{rental_id}/returns
GetReturnTransitions(return_id, cursor?, limit: 1..100 = 50)  GET /v1/returns/{return_id}/transitions
```
Pagination is opaque-cursor based, ordered by `(initiated_at, return_id)` ascending.

## Request and response examples
InitiateReturn request (`Idempotency-Key: 01J8XIDK0000000000000000A1`):
```json
{ "schema_version": 1, "return_point_ref": "01J8XRPT000000000000000001", "client_requested_at": "2026-11-14T17:40:12Z" }
```
InitiateReturn response, 201:
```json
{ "return_id": "01J8XRTN000000000000000001", "rental_id": "01J8XRNT000000000000000001",
  "state": "initiated", "revision": 1, "due_at": "2026-11-14T18:00:00Z",
  "initiated_at": "2026-11-14T17:40:13Z", "schema_version": 1 }
```
DeclareReturn request:
```json
{ "schema_version": 1, "expected_revision": 1, "returned_at": "2026-11-14T17:35:00Z",
  "condition_declared": "unchanged", "renter_note": "Returned in same condition." }
```
DeclareReturn response, 200:
```json
{ "return_id": "01J8XRTN000000000000000001", "state": "declared", "revision": 2,
  "returned_at": "2026-11-14T17:35:00Z", "declared_at": "2026-11-14T17:40:20Z",
  "timing": "on_time", "lateness_minutes": 0, "condition_declared": "unchanged",
  "renter_note": "Returned in same condition.", "owner_responded_at": null, "terminal_at": null }
```
ConfirmReturn request and response (owner view):
```json
{ "schema_version": 1, "expected_revision": 2, "owner_note": "Received." }
```
```json
{ "return_id": "01J8XRTN000000000000000001", "state": "confirmed", "revision": 3,
  "owner_responded_at": "2026-11-15T09:12:00Z", "terminal_at": "2026-11-15T09:12:00Z" }
```

## Idempotency and schema version
- `Idempotency-Key` is required on every POST. Retention and replay rules are in PS-043-06.
- `schema_version` must equal 1 (A-return-11). Any other value returns RETURN_SCHEMA_VERSION_UNSUPPORTED.
- The request hash is SHA-256 over RFC 8785 canonical JSON, excluding `Idempotency-Key` and `client_requested_at`.

## Event envelope (CTR-EVT-001)
```json
{
  "event_id": "01J8XEVT000000000000000001",
  "event_type": "rental.return.declared.v1",
  "schema_version": 1,
  "aggregate_type": "rental_return",
  "aggregate_id": "01J8XRTN000000000000000001",
  "revision": 2,
  "actor": { "role": "renter", "participant_id": "01J8XPART00000000000000001" },
  "occurred_at": "2026-11-14T17:40:20Z",
  "correlation_id": "01J8XCOR000000000000000001",
  "idempotency_key": "01J8XIDK0000000000000000A2",
  "provenance": { "source_module": "F05.S02.M02", "signature": "not_signed_internal" },
  "payload": { "rental_id": "01J8XRNT000000000000000001", "state": "declared",
               "timing": "on_time", "lateness_minutes": 0, "condition_declared": "unchanged" }
}
```

## Event types
| Event type | Emitted on | Payload fields beyond envelope |
|---|---|---|
| rental.return.initiated.v1 | InitiateReturn | rental_id, due_at, return_point_ref |
| rental.return.declared.v1 | DeclareReturn | rental_id, state, timing, lateness_minutes, condition_declared |
| rental.return.cancelled.v1 | CancelReturn | rental_id |
| rental.return.abandoned.v1 | abandon timer | rental_id |
| rental.return.unconfirmed.v1 | owner_response timer | rental_id |
| rental.return.confirmed.v1 | ConfirmReturn, or ResolveReturnDispute(confirmed) | rental_id, confirmed_via: owner_confirmed or dispute_resolved |
| rental.return.disputed.v1 | DisputeReturn | rental_id, dispute_reason_code |
| rental.return.closed_unconfirmed.v1 | owner_final timer | rental_id |
| rental.return.closed_disputed.v1 | ResolveReturnDispute(closed) or dispute_final timer | rental_id, resolution_path: moderator or timer |

Events are emitted once per transition. Envelope `revision` equals the row revision after the transition.

## Event subscribers (provisional, A-return-02 and CTR-EVT-001 map pending)
- declared with changed_noted: mod_damage opens an inspection record by reading GetReturn with its own capability.
- confirmed or closed_unconfirmed or closed_disputed: mod_deposits and mod_handoff consume the outcome. Neither module infers settlement from this event alone.
- disputed: moderation intake and mod_damage.
- every type: notifications (participant-facing text is produced there, not here).

## Open decisions
- A-return-02: Subscriber map and handoff/deposit consumption contracts are not in CONTRACTS.md; this list is provisional.
- A-return-11: MVP supports schema_version 1 only; N-1 compatibility starts with the first version bump.
- A-return-15: Event delivery is at-least-once via transactional outbox owned by F15; consumers dedupe by event_id.
