# PS-041-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-041-04. **Owner:** [05_Rentals/02_rental_lifecycle/mod_damage](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_damage. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); named in the Dependencies section of this file.

## Purpose and scope
Defines the versioned commands, queries and domain events for damage claims. Each command has a signature, a request example, a response example, an idempotency key and a schema version.

Exclusions: transport (HTTP or relay framing), authentication mechanics (F07), and the envelope itself (CTR-EVT-001, CTR-ERR-001).

## Requirements
- **PS-041-04.R01** Contract surface. Ten commands, three queries and twelve events, all named `damage.<resource>.<action>.v<major>` for commands and queries, and `DamageXxx` for events. Field lists are in domain_schema.md.
- **PS-041-04.R02** Case coverage. Each command documents its replay response, its invalid codes, and its behavior when offline or stale. Commands return the same response shape on replay with `replayed: true`.
- **PS-041-04.R03** Payload budgets. Request bodies are at most 16 KiB excluding evidence bytes (uploaded separately). Query pages are at most 50 items. Responses exclude free text except for the requester's own text fields.

## Common envelope
Every command carries these fields:
```json
{
  "command": "damage.respond.v1",
  "idempotency_key": "01J9ZKEY0000000000000000G7",
  "schema_version": "1.0",
  "claim_id": "01J9ZCMX0000000000000000A1",
  "expected_revision": 2,
  "payload": {}
}
```
Every successful response carries:
```json
{
  "status": "ok",
  "replayed": false,
  "claim": { "claim_id": "01J9ZCMX0000000000000000A1", "state": "COUNTER_PROPOSED", "revision": 3 },
  "event_ids": ["01J9ZEVT0000000000000000H8"]
}
```
Errors follow CTR-ERR-001 once published. Until then, they use the shape in validation_rules.md: `{"status":"error","error":{"code","retryable","http_status","details"}}`.

## Commands
| Command | Actor | Signature (payload fields) | Idempotency key | Schema |
|---|---|---|---|---|
| damage.open_claim.v1 | lender | rental_ref_id, return_ref_id, rental_item_ref, renter_participant_id, category, claimed_amount_minor, currency_code, description_text | required | 1.0 |
| damage.revise_claim.v1 | lender | category?, description_text?, claimed_amount_minor? (at least one) | required | 1.0 |
| damage.attach_evidence.v1 | party | kind, media_ref?, sha256_hex?, content_type?, byte_size?, caption_text?, note_text? | required | 1.0 |
| damage.respond.v1 | renter | response_kind, counter_amount_minor?, comment_text? | required | 1.0 |
| damage.counter.accept.v1 | lender | (none beyond envelope) | required | 1.0 |
| damage.claim.withdraw.v1 | lender | (none beyond envelope) | required | 1.0 |
| damage.claim.escalate.v1 | party | reason_code (renter_dispute, counter_disagreement, other) | required | 1.0 |
| damage.external.attest.v1 | party | amount_minor, currency_code | required | 1.0 |
| damage.moderation.resolve.v1 | moderator | outcome (agreed, no_charge), agreed_amount_minor?, moderation_case_ref | required | 1.0 |
| damage.moderation.hold.v1 | moderator | active (boolean), moderation_case_ref | required | 1.0 |

Queries (no idempotency key):
- `damage.get_claim.v1(claim_id)`: returns the claim view for a party or moderator. Non-parties receive DAMAGE_CLAIM_NOT_FOUND.
- `damage.list_claims.v1(role, state?, limit<=50, cursor?)`: returns only the caller's own claims.
- `damage.get_timeline.v1(claim_id, after_sequence, limit<=100)`: returns events in sequence order.

## Request and response examples
Open a claim (lender):
```json
{
  "command": "damage.open_claim.v1",
  "idempotency_key": "01J9ZKEY0000000000000000J1",
  "schema_version": "1.0",
  "payload": {
    "rental_ref_id": "01J9ZRNT0000000000000000B2",
    "return_ref_id": "01J9ZRTN0000000000000000D4",
    "rental_item_ref": "01J9ZITM0000000000000000E5",
    "renter_participant_id": "participant_id_renter",
    "category": "functional",
    "claimed_amount_minor": 4500,
    "currency_code": "USD",
    "description_text": "Left hinge bent."
  }
}
```
```json
{
  "status": "ok",
  "replayed": false,
  "claim": { "claim_id": "01J9ZCMX0000000000000000A1", "state": "OPEN", "revision": 1, "state_due_at": "2026-11-24T10:00:00.000Z" },
  "event_ids": ["01J9ZEVT0000000000000000K2"]
}
```

Counter (renter), with a stale revision error:
```json
{
  "command": "damage.respond.v1",
  "idempotency_key": "01J9ZKEY0000000000000000M3",
  "schema_version": "1.0",
  "claim_id": "01J9ZCMX0000000000000000A1",
  "expected_revision": 1,
  "payload": { "response_kind": "counter", "counter_amount_minor": 3000 }
}
```
```json
{
  "status": "error",
  "error": { "code": "DAMAGE_STALE_REVISION", "retryable": false, "http_status": 409, "details": { "current_revision": 2 } }
}
```

## Idempotency
- Every command requires `idempotency_key`: a client-generated ULID (V21).
- Scope is (actor, command name, key). Keys are kept 72 hours (A-damage-12).
- Same scope and same payload hash: return the stored response with `replayed: true`. No second write occurs.
- Same scope and different payload hash: DAMAGE_IDEMPOTENCY_KEY_REUSED.
- Key older than 72 hours: DAMAGE_IDEMPOTENCY_KEY_EXPIRED. The client must treat the outcome as unknown and fetch the claim.

## Schema version
- `schema_version` is a required string. Only "1.0" is supported in this spec.
- Additive optional fields are a minor change and keep the major version.
- Breaking changes create a new command name with `.v2`. Old and new versions coexist for at least one release.
- Registry and compatibility rules are owned by CTR-SCH-001.

## Domain events
Each event uses the CTR-EVT-001 envelope with `aggregate_type` "damage_claim", `aggregate_id` = claim_id, `sequence`, `revision`, `actor`, `occurred_at`, `correlation_id` and `idempotency_key` (absent for system events). Payloads carry identifiers, states, amounts and enums only (A-damage-13).

| Event | Emitted by | Payload fields beyond envelope |
|---|---|---|
| DamageClaimOpened | open_claim | category, claimed_amount_minor, currency_code, state_due_at |
| DamageClaimRevised | revise_claim | changed_fields (names only), revision |
| DamageEvidenceAttached | attach_evidence | evidence_id, kind, content_type, byte_size |
| DamageResponseRecorded | respond | response_kind, seen_revision |
| DamageCounterProposed | respond (counter) | counter_amount_minor, state_due_at |
| DamageClaimWithdrawn | withdraw | none |
| DamageClaimEscalated | respond (dispute), escalate | reason_code, state_due_at |
| DamageAttestationRecorded | external.attest | role, amount_minor, match (boolean) |
| DamageClaimResolved | counter.accept, attestations match, moderation.resolve | resolution_kind, agreed_amount_minor |
| DamageClaimExpired | system timer | previous_state |
| DamageHoldChanged | moderation.hold | hold_active, moderation_case_ref |

Consumer map:
- F13 notifications: DamageClaimOpened, DamageCounterProposed, DamageClaimEscalated, DamageClaimExpired, DamageClaimResolved.
- F12 moderation: DamageClaimEscalated, DamageAttestationRecorded (match = false), DamageHoldChanged.
- F09 commerce evidence: DamageClaimResolved as an assertion only. No payment is initiated by this module.
- F10 privacy: all events, for retention and export.

## Open decisions
- **Assumption A-damage-12:** Idempotency keys are ULIDs, scoped per actor and command, kept 72 hours.
- **Assumption A-damage-13:** Event payloads never contain free text (description, comment, caption, note). Consumers fetch text through the authorized query.
- D08 (offline pending queue) decides how clients store unacknowledged commands. This file assumes the same key is reused on retry.
