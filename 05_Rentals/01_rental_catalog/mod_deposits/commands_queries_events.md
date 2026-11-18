# PS-040-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-040-04. **Owner:** [05_Rentals/01_rental_catalog/mod_deposits](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_deposits. **Consumers:** PWA client (offline pending queue), notifications (deposit.state_changed.v1), moderation (dispute events), observability.

## Purpose and scope
Define the command, query and event surface for deposits: signatures, request and response shapes, idempotency keys, schema version and event envelopes. Envelope and schema registry rules come from CTR-EVT-001 and CTR-SCH-001 (owner F15). This file does not duplicate them.

## Requirements
- PS-040-04.R01: Business outcome: a client can create, negotiate, accept and record claims on a deposit using stable, versioned commands, and can read the current state. Exclusions: payment calls, refund calls, and any command that moves money.
- PS-040-04.R02: Case coverage: normal calls, invalid bodies, expired terms, duplicate idempotency keys, stale expected_revision, offline replay from the pending queue, and non-party reads.
- PS-040-04.R03: Each command response contains the state a client needs to show a clear label. Responses carry no free text. Event payloads carry identifiers and states, not amounts.
- PS-040-04.R04: Every state-changing command requires idempotency_key and expected_revision. Queries require neither.
- PS-040-04.R05: Every command body carries schema_version = 1. Unknown fields are rejected (DEPOSITS_VALIDATION_FIELD_UNKNOWN).
- PS-040-04.R06: Events are published through a transactional outbox with at-least-once delivery. Consumers deduplicate on event_id.

## Commands
Signatures are logical. Transport binding is decided by CTR-ID-001 and the platform API conventions (F15). All commands accept `schema_version`, `idempotency_key`, `expected_revision` (except deposit.create), and their own fields. Party IDs are never accepted from the client.

| Command | Actor | Signature (fields) | From → To |
|---|---|---|---|
| deposit.create | receiver | (rental_ref, listing_ref, amount_minor, currency_code, method_code) | none → draft |
| deposit.propose | receiver | (deposit_id, amount_minor, currency_code, method_code) | draft → proposed |
| deposit.counter | non-proposer | (deposit_id, amount_minor, currency_code, method_code) | proposed → proposed |
| deposit.accept | non-proposer | (deposit_id) | proposed → agreed |
| deposit.decline | non-proposer | (deposit_id, closure_reason = declined) | proposed → cancelled |
| deposit.cancel | per state table | (deposit_id, closure_reason) | draft, proposed, agreed → cancelled |
| deposit.claim_paid | depositor | (deposit_id, external_ref?) | agreed → paid_claimed |
| deposit.confirm_received | receiver | (deposit_id, external_ref?) | paid_claimed → received_claimed |
| deposit.claim_return | receiver | (deposit_id) | received_claimed → return_claimed |
| deposit.claim_withhold | receiver | (deposit_id, withheld_minor, reason_code) | received_claimed → withheld_claimed |
| deposit.confirm_return | depositor | (deposit_id, outcome, returned_minor?) | return_claimed → settled |
| deposit.acknowledge_withhold | depositor | (deposit_id) | withheld_claimed → settled |
| deposit.open_dispute | either party | (deposit_id, dispute_reason_code) | paid_claimed, received_claimed, return_claimed, withheld_claimed → disputed |
| deposit.resolve_dispute | dispute_moderator | (deposit_id, outcome, returned_minor?) | disputed → settled |
| deposit.attach_evidence | either party | (deposit_id, evidence_kind, external_ref) | no state change |

## Example: deposit.propose
Request:
```json
{
  "schema_version": 1,
  "idempotency_key": "idem_9f2c4a7e1b3d4c6a",
  "deposit_id": "dep_01JZ8M3QF4T7X2K9R0W5ABCDEF",
  "expected_revision": 1,
  "amount_minor": 25000,
  "currency_code": "EUR",
  "method_code": "bank_transfer_external"
}
```
Response (200):
```json
{
  "deposit_id": "dep_01JZ8M3QF4T7X2K9R0W5ABCDEF",
  "state": "proposed",
  "revision": 2,
  "term_revision_no": 1,
  "proposer_participant_id": "par_01JZ8N0A7B6C5D4E3F2G1H0J9K",
  "expires_at": "2026-11-17T09:00:00.000Z",
  "replayed": false
}
```
Replay of the same key and body returns the same body with `"replayed": true`. Same key with a different body returns 422 DEPOSITS_CONFLICT_IDEMPOTENCY_PAYLOAD_MISMATCH.

## Example: deposit.accept (stale revision)
Request: `{"schema_version":1,"idempotency_key":"idem_5b1e0c9d8a7f6e5d","deposit_id":"dep_01JZ8M3QF4T7X2K9R0W5ABCDEF","expected_revision":1}`
Response (409): `{"error":{"code":"DEPOSITS_CONFLICT_REVISION_MISMATCH","retryable":true,"field":"expected_revision","message_key":"deposits.revision.stale","diagnostic_id":"dgn_01JZ8Q2A3B4C5D6E7F8G9H0J1K"}}`

## Queries
| Query | Actor | Parameters | Response |
|---|---|---|---|
| deposit.get | party or scoped moderator | deposit_id | current deposit view and current revision |
| deposit.list_mine | any participant | state filter (optional), limit (1 to 50), cursor (opaque) | page of deposit views where the caller is a party |
| deposit.list_by_rental | party | rental_ref | deposits for that rental where caller is a party |
| deposit.history | party or scoped moderator | deposit_id, cursor | deposit_event rows, newest first |

Queries are read-only and return DEPOSITS_NOT_FOUND to non-parties.

## Events
| Event | Emitted when | Payload (minimum) | Consumers |
|---|---|---|---|
| deposit.state_changed.v1 | every committed state change | deposit_id, rental_ref, depositor_participant_id, receiver_participant_id, from_state, to_state, revision, occurred_at | notifications, moderation, observability |
| deposit.evidence_attached.v1 | evidence row inserted | deposit_id, evidence_id, evidence_kind, state_at_submit, occurred_at | moderation, observability |
| deposit.timer_fired.v1 | timer transitions a deposit | deposit_id, timer_kind, revision, occurred_at | observability, notifications |

Event envelope fields (event_id, aggregate, revision, actor, correlation ID, provenance, signature when needed) follow CTR-EVT-001 (A-deposits-16). Amounts are excluded from event payloads.

## Idempotency, versioning and limits
- Idempotency key: 16 to 64 characters, `[A-Za-z0-9_-]` (A-deposits-14). Scope: (actor_participant_id, command, idempotency_key). Retained 72 hours.
- Schema version: integer major 1. Only additive optional fields are allowed within v1. Breaking changes produce schema_version 2 under CTR-SCH-001 rules (A-deposits-13).
- List limit: 1 to 50; cursor is opaque and expires after 24 hours (A-deposits-15).

## Assumptions and open decisions
- A-deposits-13: schema_version as integer major; minor changes are additive.
- A-deposits-14: idempotency key format and 72-hour retention.
- A-deposits-15: list limit and cursor lifetime.
- A-deposits-16: event envelope fields provisional until CTR-EVT-001 is final.
- Open: transport binding (REST or RPC) is decided with CTR-ID-001 and platform conventions (F15).

## Test cases
- TEST-PS-040-04-T01: Send propose twice with the same key and body. Pass: second response has replayed = true and identical body; one deposit_event row exists. Fail: two events or differing bodies.
- TEST-PS-040-04-T02: Send a command with a party ID field. Pass: 400 DEPOSITS_VALIDATION_FIELD_UNKNOWN. Fail: accepted.
- TEST-PS-040-04-T03: Subscribe a consumer and replay the same event_id twice. Pass: consumer applies it once. Fail: duplicate effects.
