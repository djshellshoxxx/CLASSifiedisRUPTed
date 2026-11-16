# PS-064-04 — Commands, queries and events: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-04.R01** All commands are vault commands; propose and reschedule produce the signed proposal statement and agree uses comms.consent.sign, so nothing is a relay command.
- **PS-064-04.R02** Each command emits its event in the same IndexedDB transaction as the state change, and inbound verified statements derive the same events with actor kind federated.
- **PS-064-04.R03** The module consumes thread, block, context and consent events to keep meetups consistent.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.meetup.propose` | comms.meetup.propose | [vault command; produces signed statement classrup.comms.meetup/v1] { threadId, windowStart, windowEnd, venueTz, placeKind, safeSpotId?, areaCell?, areaLabel? } | { meetupId, proposalRevision: 1, proposalHash } | VALIDATION_FAILED, COMMS_MEETUP_WINDOW_INVALID, COMMS_MEETUP_PLACE_INVALID, BLOCKED_PARTY, NOT_FOUND, RATE_LIMITED | comms.meetup.proposed | yes (Idempotency-Key) |
| `comms.meetup.agree` | comms.meetup.agree | [vault command; calls comms.consent.sign with statement key consent.comms.meetup.agree.v1] { meetupId, expectedRevision } | { meetupId, revision, consentId, status: proposed\|agreed } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, COMMS_MEETUP_WINDOW_INVALID, COMMS_MEETUP_AGREEMENT_INVALID | comms.meetup.agreed | yes (Idempotency-Key) |
| `comms.meetup.reschedule` | comms.meetup.reschedule | [vault command; produces signed statement classrup.comms.meetup/v1 with higher revision] { meetupId, expectedRevision, windowStart, windowEnd, placeKind, safeSpotId?, areaCell?, areaLabel? } | { meetupId, proposalRevision, proposalHash, rescheduleCount } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, COMMS_MEETUP_WINDOW_INVALID, COMMS_MEETUP_PLACE_INVALID, COMMS_MEETUP_RESCHEDULE_LIMIT, BLOCKED_PARTY | comms.meetup.proposed | yes (Idempotency-Key) |
| `comms.meetup.cancel` | comms.meetup.cancel | [vault command; produces signed statement classrup.comms.meetup_cancel/v1] { meetupId, expectedRevision, reason } | { meetupId, revision, status: cancelled } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | comms.meetup.cancelled | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.meetup.list_for_thread` | comms.meetup.read | [vault query] { threadId, status?, limit ≤ 50 } | { items: Meetup[] with per-party agreement status } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.meetup.proposed` | P2 | { meetupId, threadId, proposalRevision, proposalHash, windowStart, windowEnd, placeKind, proposerDid, origin: local\|federated } |
| `comms.meetup.agreed` | P2 | { meetupId, threadId, proposalRevision, proposalHash, partyDids[], windowStart, windowEnd } |
| `comms.meetup.cancelled` | P2 | { meetupId, threadId, cancelledByDid, reason, origin: local\|federated } |

### Events consumed

| Type | Effect |
|---|---|
| `comms.consent.received` | when the consent is an agreement on the current meetup proposalHash, record it and re-evaluate agreed |
| `comms.consent.revoked` | remove the agreement and move an agreed meetup back to proposed |
| `comms.thread.archived` | cancel open meetups of the thread with reason other |
| `identity.block.added` | cancel open meetups between the two parties silently on the blocker side |
| `mutiny.cycle.cancelled` | cancel meetups whose context is the cycle |
| `services.booking.cancelled` | cancel meetups whose context is the booking |
| `rentals.reservation.cancelled` | cancel meetups whose context is the reservation |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_MEETUP_WINDOW_INVALID | 422 | no | window length is outside 15 minutes to 4 hours, or starts too soon or too far ahead |
| COMMS_MEETUP_PLACE_INVALID | 422 | no | place is not an active safe spot or a valid L3 area label without an address |
| COMMS_MEETUP_RESCHEDULE_LIMIT | 409 | no | the meetup already used 5 reschedules |
| COMMS_MEETUP_AGREEMENT_INVALID | 422 | no | agreement consent does not verify for the current proposal hash or signer is not a party |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.meetup.propose
{ "threadId": "0192f3a4-0000-7000-8000-0000000000aa", "windowStart": "2026-11-07T14:00:00Z", "windowEnd": "2026-11-07T15:00:00Z",
  "venueTz": "Europe/Berlin", "placeKind": "safe_spot", "safeSpotId": "0192f3a4-7777-7000-8000-000000000001" }
-> { "meetupId": "0192f3a8-4444-7000-8000-000000000001", "proposalRevision": 1, "proposalHash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T05 | contract | PS-064-04.R01, PS-064-04.R02, PS-064-09.R02 | each command and the query execute | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-064-09.T06 | integration | PS-064-04.R03 | thread archived, block added, cycle cancelled events | open meetups cancelled; blocker side silent |
| TEST-PS-064-09.T14 | a11y | PS-064-04.R01 | propose and agree flow with screen reader and keyboard | statuses announced as text, zero serious axe issues |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
