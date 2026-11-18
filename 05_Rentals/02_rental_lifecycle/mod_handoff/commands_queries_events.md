# PS-042-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-042-04. **Owner:** [05_Rentals/02_rental_lifecycle/mod_handoff](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Consumers:** provisional, per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and sibling [mod_return](../mod_return/SPEC.md); subscriber map confirmed in Prompt 3.

## Purpose and scope
Defines the versioned command, query and event surface of mod_handoff. Event envelope follows CTR-EVT-001 (owner F15, OPEN). Errors follow [validation_rules.md](validation_rules.md). Commands map to transitions in [workflow_state_machine.md](workflow_state_machine.md).

## Requirements
- PS-042-04.R01 — Business outcome: each state change is reachable through exactly one named command, returns the new revision, and emits exactly one primary event.
- PS-042-04.R02 — Cases covered: normal create and two confirmations; replayed command with same key; same key with changed body; stale `expected_revision`; query by non-party; event consumed twice; event arriving out of order across aggregates.
- PS-042-04.R03 — Every mutating command requires `Idempotency-Key` (ULID) and `schema_version`. Every mutating command except `handoff.create` requires `expected_revision`.
- PS-042-04.R04 — Events are published at least once. Consumers deduplicate by `event_id` and order per aggregate by `aggregate_revision`.
- PS-042-04.R05 — Schema versions are integers. Additive optional fields are minor changes within v1. Removal, renaming or type change requires v2 and a parallel run under CTR-SCH-001.

## Commands
| Command | Signature (logical) | Actor | Transition | Event emitted |
|---|---|---|---|---|
| `handoff.create` | `create(input: CreateHandoffV1, key) -> HandoffV1` | lessor or renter | T01 | `HandoffCreated.v1` |
| `handoff.propose_reschedule` | `proposeReschedule(handoff_id, window, expected_revision, key) -> HandoffV1` | party | T02 | `HandoffRescheduleProposed.v1` |
| `handoff.respond_reschedule` | `respondReschedule(handoff_id, action: accept\|decline\|withdraw, expected_revision, key) -> HandoffV1` | counterparty or proposer | T03–T05 | `HandoffRescheduleResolved.v1` |
| `handoff.confirm` | `confirm(handoff_id, role_implied_by_actor, attestation: ConfirmV1, expected_revision, key) -> HandoffV1` | lessor or renter | T06–T09 | `HandoffAttested.v1`, plus `HandoffCompleted.v1` when T08/T09 |
| `handoff.cancel` | `cancel(handoff_id, expected_revision, key) -> HandoffV1` | party | T10 | `HandoffCancelled.v1` |
| `handoff.dispute` | `dispute(handoff_id, reason_code, note?, expected_revision, key) -> HandoffV1` | party | T11 | `HandoffDisputed.v1` |
| `handoff.resolve_dispute` | `resolveDispute(handoff_id, outcome: completed\|cancelled, evidence_ref, expected_revision, key) -> HandoffV1` | moderator | T12 | `HandoffDisputeResolved.v1` plus `HandoffCompleted.v1` or `HandoffCancelled.v1` |

Queries (no key, no revision): `handoff.get(handoff_id)`, `handoff.list(role_filter, state_filter, cursor, limit ≤ 50)`, `handoff.get_transitions(handoff_id, cursor, limit ≤ 100)`. Queries return `HANDOFF_NOT_FOUND` for non-parties.

## Request and response examples
Create request (`POST /handoffs`):
```json
{
  "schema_version": 1,
  "rental_agreement_id": "01HZX3M1B5W0E6Y8R2K4T9N7QA",
  "item_ref": "catalog_item_example_001",
  "item_version": 3,
  "window_start_utc": "2026-11-20T16:00:00.000Z",
  "window_end_utc": "2026-11-20T18:00:00.000Z",
  "handoff_mode": "in_person_meeting",
  "region_code": "REG-0042",
  "meeting_note": "North entrance, ring once"
}
```
Create response (`201`): `{"schema_version":1,"handoff_id":"01HZX3K8Q2M7V9R4T6N1P5C8D0","state":"scheduled","revision":1,"window_start_utc":"2026-11-20T16:00:00.000Z","window_end_utc":"2026-11-20T18:00:00.000Z","created_at":"2026-11-10T09:12:00.000Z"}`

Confirm request (`POST /handoffs/{handoff_id}/confirm`, header `Idempotency-Key: 01HZX3V8H2J4K6M8N0P2Q4R6S8`):
```json
{
  "schema_version": 1,
  "expected_revision": 2,
  "condition_code": "as_described",
  "condition_note": "No visible marks",
  "evidence_refs": [],
  "client_recorded_at": "2026-11-20T16:03:55.000Z"
}
```
Confirm response (`200`): `{"schema_version":1,"handoff_id":"01HZX3K8Q2M7V9R4T6N1P5C8D0","state":"lessor_confirmed","revision":3,"attestation_id":"01HZX3S6F0G3H8J2K5L7M9N1PQ"}`

## Idempotency and replay
- Key is a ULID, scope = (`participant_id`, command name). TTL 7 days ([A-handoff-09](failure_recovery_idempotency.md)).
- Same key and same canonical body hash returns the stored status and body with header `Idempotent-Replayed: true`.
- Same key and different body hash returns `HANDOFF_IDEMPOTENCY_KEY_REUSED`.

## Event envelope (CTR-EVT-001 fields used)
`event_id` (ULID), `event_type` (for example `HandoffCompleted`), `event_version` (1), `schema_version` (1), `aggregate_id` (`handoff_id`), `aggregate_revision`, `occurred_at`, `actor` (`kind`, `participant_id` or null), `correlation_id`, `causation_id` (request ID), `producer` (`mod_handoff`), `signature` (null in v1).

## Event payload minimums
- `HandoffCreated.v1`: handoff_id, rental_agreement_id, lessor and renter IDs, window, state.
- `HandoffCompleted.v1`: handoff_id, rental_agreement_id, `completed_at`, `terminal_reason_code`, attestation IDs. No notes or region code.
- `HandoffCancelled.v1`: handoff_id, rental_agreement_id, `terminal_reason_code`.
- `HandoffExpired.v1`: handoff_id, rental_agreement_id, `lessor_confirmed_at`, `renter_confirmed_at`.
- Other events carry state and IDs only. Free text is never placed in events.

## Assumptions and open decisions
- **Assumption A-handoff-15:** `schema_version` is an integer major version in every body and envelope. v1 is fixed by [domain_schema.md](domain_schema.md). The schema registry rules are owned by CTR-SCH-001, which is OPEN.
- Open decisions in this file: CTR-EVT-001 envelope field names (OPEN); CTR-ID-001 (OPEN).
- Declared consumers (provisional): mod_return subscribes `HandoffCompleted.v1` and `HandoffCancelled.v1`; notifications subscribe `HandoffRescheduleProposed.v1`, `HandoffAttested.v1`, `HandoffDisputed.v1`, `HandoffExpired.v1`.
