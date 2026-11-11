# PS-064-04 — Commands, queries and events: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-04.R01** All commands are vault commands; propose and reschedule produce the signed proposal statement together with the proposer's agreement consent, and agree uses comms.consent.sign, so nothing is a relay command.
- **PS-064-04.R02** Each command emits its event in the same IndexedDB transaction as the state change, and inbound verified statements derive the same events with actor kind federated.
- **PS-064-04.R03** The module consumes thread, block, context and consent events to keep meetups consistent.
- **PS-064-04.R04** Statements are registered with F11.S01.M01 (N2): classrup.comms.meetup/v1 { meetupId, threadId, proposalRevision, window, place with spotCid, partyDids } and classrup.comms.meetup_cancel/v1 { meetupId, reason }, each signed by a device key of a party; agreements are classrup.comms.consent/v1 statements of F08.S02.M02.
- **PS-064-04.R05** Event payloads carry the party DIDs needed for notification routing (N4) - comms.meetup.proposed, comms.meetup.agreed and comms.meetup.cancelled all include partyDids.
- **PS-064-04.R06** The module registers ExportSectionPort (section comms.meetups with the signed proposal statements), DeletionPort (plan, execute, pseudonymize - proposal and cancellation statements kept as evidence get the deleted party's DID replaced by the deletion pseudonym) and RetentionPurgePort (RET-EVIDENCE, independent of the thread purge) with F10 (N6).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.meetup.propose` | comms.meetup.propose | [vault command; produces signed statement classrup.comms.meetup/v1 and the proposer's consent.comms.meetup.agree.v1 consent] { threadId, windowStart, windowEnd, venueTz, placeKind, safeSpotId?, areaCell?, areaLabel? } | { meetupId, proposalRevision: 1, proposalHash, proposerConsentId } | VALIDATION_FAILED, COMMS_MEETUP_WINDOW_INVALID, COMMS_MEETUP_PLACE_INVALID, BLOCKED_PARTY, NOT_FOUND, RATE_LIMITED | comms.meetup.proposed | yes (Idempotency-Key) |
| `comms.meetup.agree` | comms.meetup.agree | [vault command; calls comms.consent.sign with statement key consent.comms.meetup.agree.v1] { meetupId, expectedRevision } | { meetupId, revision, consentId, status: proposed\|agreed } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, COMMS_MEETUP_WINDOW_INVALID, COMMS_MEETUP_AGREEMENT_INVALID | comms.meetup.agreed | yes (Idempotency-Key) |
| `comms.meetup.reschedule` | comms.meetup.reschedule | [vault command; produces signed statement classrup.comms.meetup/v1 with higher revision and the proposer's agreement consent] { meetupId, expectedRevision, windowStart, windowEnd, placeKind, safeSpotId?, areaCell?, areaLabel? } | { meetupId, proposalRevision, proposalHash, rescheduleCount, proposerConsentId } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, COMMS_MEETUP_WINDOW_INVALID, COMMS_MEETUP_PLACE_INVALID, COMMS_MEETUP_RESCHEDULE_LIMIT, BLOCKED_PARTY | comms.meetup.proposed | yes (Idempotency-Key) |
| `comms.meetup.cancel` | comms.meetup.cancel | [vault command; produces signed statement classrup.comms.meetup_cancel/v1] { meetupId, expectedRevision, reason } | { meetupId, revision, status: cancelled } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | comms.meetup.cancelled | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.meetup.list_for_thread` | comms.meetup.read | [vault query] { threadId, status?, limit ≤ 50 } | { items: Meetup[] with per-party agreement status and competing proposals when conflicted } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.meetup.proposed` | P2 | { meetupId, threadId, proposalRevision, proposalHash, reason: new\|reschedule\|agreement_revoked\|conflict_resolved, windowStart, windowEnd, placeKind, proposerDid, partyDids[], origin: local\|federated } |
| `comms.meetup.agreed` | P2 | { meetupId, threadId, proposalRevision, proposalHash, partyDids[], windowStart, windowEnd } |
| `comms.meetup.cancelled` | P2 | { meetupId, threadId, cancelledByDid, partyDids[], reason, origin: local\|federated } |

### Events consumed

| Type | Effect |
|---|---|
| `comms.consent.received` | when the consent is an agreement on the current meetup proposalHash, record it after comms.consent.verify and re-evaluate agreed |
| `comms.consent.revoked` | before windowStart remove the agreement and move an agreed meetup back to proposed (reason agreement_revoked); when verify reports conflicted (revocation after windowStart) freeze the meetup as conflicted |
| `comms.thread.archived` | cancel open meetups of the thread with reason other |
| `identity.block.added` | in the blocker's vault only: cancel open meetups with the DID the local principal blocked, silently; nothing is sent and the blocked party's vault is unaffected |
| `mutiny.cycle.cancelled` | cancel meetups whose context is the cycle |
| `services.booking.cancelled` | cancel meetups whose context is the booking |
| `rentals.reservation.cancelled` | cancel meetups whose context is the reservation |
| `privacy.deletion.completed` | replace remaining references to the deleted principal by the payload pseudonym in meetups and signed proposal and cancellation statements kept under RET-EVIDENCE |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_MEETUP_WINDOW_INVALID | 422 | no | window length is outside 15 minutes to 4 hours, or starts too soon or too far ahead |
| COMMS_MEETUP_PLACE_INVALID | 422 | no | place is not a verified active safe spot or a valid L3 area label without an address |
| COMMS_MEETUP_RESCHEDULE_LIMIT | 409 | no | the meetup already used 5 reschedules |
| COMMS_MEETUP_AGREEMENT_INVALID | 422 | no | agreement consent does not verify for the current proposal hash, signer is not a party, or the proposer's own consent is missing |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.meetup.propose
{ "threadId": "5f3a9c1e-7b2d-8e4f-9a01-23456789abcd", "windowStart": "2026-11-07T14:00:00Z", "windowEnd": "2026-11-07T15:00:00Z",
  "venueTz": "Europe/Berlin", "placeKind": "safe_spot", "safeSpotId": "0192f3a4-7777-7000-8000-000000000001" }
-> { "meetupId": "0192f3a8-4444-7000-8000-000000000001", "proposalRevision": 1, "proposalHash": "sha256-n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg", "proposerConsentId": "sha256-Lw2…" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T05 | contract | PS-064-04.R01, PS-064-04.R02, PS-064-09.R02 | each command and the query execute | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-064-09.T06 | integration | PS-064-04.R03 | thread archived, block added by the local principal, cycle cancelled events | open meetups cancelled; blocker side silent |
| TEST-PS-064-09.T21 | contract | PS-064-04.R04, PS-064-04.R05 | registry entries for meetup and meetup_cancel; payloads of proposed, agreed and cancelled in TC | signer role party; every payload carries partyDids so notifications reach the other parties |
| TEST-PS-064-09.T22 | integration | PS-064-04.R06 | account deletion with open and elapsed meetups | DeletionPort plan pseudonymizes kept proposal statements and purges open meetups; export section comms.meetups present beforehand |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, F06.S02.M01, F07.S02.M02, F16.S02.M02, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
