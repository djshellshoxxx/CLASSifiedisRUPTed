# PS-065-04 — Commands, queries and events: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-04.R01** Check-in and no-show report are vault commands that produce signed statements; share creation and revocation are vault commands that call relay commands put and delete for the encrypted snapshot, and view is a public relay query returning ciphertext only.
- **PS-065-04.R02** Each state-changing vault command emits its event in the same IndexedDB transaction as the change.
- **PS-065-04.R03** The module consumes meetup agreement and cancellation events to create and void check-in records.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.meetup.check_in` | comms.meetup.check_in | [vault command; produces signed statement classrup.comms.checkin/v1] { meetupId, expectedRevision } | { checkinId, status: checked_in, checkedInAtClaim, revision } | NOT_FOUND, FORBIDDEN, CONFLICT_STATE, CONFLICT_REVISION, COMMS_CHECKIN_OUTSIDE_WINDOW, VALIDATION_FAILED | comms.meetup.checked_in | yes (Idempotency-Key) |
| `comms.meetup.report_no_show` | comms.meetup.report_no_show | [vault command; produces signed statement classrup.comms.no_show_report/v1] { meetupId, targetDid, expectedRevision } | { checkinId, status: no_show, revision } | NOT_FOUND, FORBIDDEN, CONFLICT_STATE, CONFLICT_REVISION, COMMS_NO_SHOW_NOT_ALLOWED, RATE_LIMITED | comms.meetup.no_show | yes (Idempotency-Key) |
| `comms.meetup_share.create` | comms.meetup_share.create | [vault command; calls relay command comms.meetup_share.put] { meetupId, expiresInMs (default 21600000, max 86400000) } | { shareId, url (includes key in fragment), expiresAt } | NOT_FOUND, FORBIDDEN, COMMS_SHARE_LIMIT, PAYLOAD_TOO_LARGE, DEPENDENCY_UNAVAILABLE, FEATURE_DISABLED | comms.meetup_share.created | yes (Idempotency-Key) |
| `comms.meetup_share.put` | comms.meetup_share.put | [relay command, relay access token] { shareId, snapshotRevision, ciphertext (≤ 2 048 bytes), keyHash, expiresAt } | { shareId, snapshotRevision } | VALIDATION_FAILED, PAYLOAD_TOO_LARGE, COMMS_SHARE_LIMIT, CONFLICT_REVISION, RATE_LIMITED, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `comms.meetup_share.revoke` | comms.meetup_share.revoke | [vault command; calls relay delete with the owner device signature] { shareId, expectedRevision } | { shareId, revision, revoked: true } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE | comms.meetup_share.revoked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.meetup_share.view` | comms.meetup_share.view | [relay query, public by unguessable share ID] { shareId } | { ciphertext, snapshotRevision, expiresAt } (the viewer page decrypts with the key in the fragment) | NOT_FOUND, RATE_LIMITED |
| `comms.meetup.list_checkins` | comms.meetup.read_checkin | [vault query] { meetupId } | { items: MeetupCheckin[], shares: MeetupShare[] } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.meetup.checked_in` | P2 | { meetupId, partyDid, checkedInAtClaim, origin: local\|federated } |
| `comms.meetup.no_show` | P2 | { meetupId, targetDid, reportedByDid, claim: true, origin: local\|federated } |
| `comms.meetup_share.created` | P3 | { shareId, meetupId, expiresAt } |
| `comms.meetup_share.revoked` | P3 | { shareId, meetupId, reason: owner\|cancelled\|expired } |

### Events consumed

| Type | Effect |
|---|---|
| `comms.meetup.agreed` | create pending MeetupCheckin records for every party for the agreed proposalHash |
| `comms.meetup.cancelled` | void pending check-ins and revoke active shares of the meetup |
| `comms.meetup.proposed` | if an agreed meetup is rescheduled, void its pending check-ins for the old hash and revoke shares |
| `identity.block.added` | drop inbound check-in and no-show statements from the blocked DID |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_CHECKIN_OUTSIDE_WINDOW | 409 | no | check-in is allowed only from 15 minutes before the window to 30 minutes after it ends |
| COMMS_CHECKIN_SIGNATURE_INVALID | 422 | no | inbound check-in or report signature or signer role is invalid; statement quarantined |
| COMMS_NO_SHOW_NOT_ALLOWED | 409 | no | reporter has not checked in, grace period of 30 minutes not over, 24 hour report period ended, or target already checked in |
| COMMS_SHARE_LIMIT | 409 | no | more than 3 active shares for the meetup or expiry beyond 24 hours |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.meetup.check_in  { "meetupId": "0192f3a8-4444-7000-8000-000000000001", "expectedRevision": 4 }
-> { "checkinId": "0192f3a9-5555-7000-8000-000000000001", "status": "checked_in", "checkedInAtClaim": "2026-11-07T13:52:10.000Z", "revision": 2 }
vault command comms.meetup_share.create  { "meetupId": "0192f3a8-4444-7000-8000-000000000001", "expiresInMs": 21600000 }
-> { "shareId": "0192f3a9-6666-7000-8000-000000000001", "url": "https://relay.example/s/0192f3a9-6666-7000-8000-000000000001#k=Zm9v…", "expiresAt": "2026-11-04T16:00:00.000Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T04 | contract | PS-065-04.R01, PS-065-04.R02, PS-065-09.R02 | each command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-065-09.T05 | integration | PS-065-04.R03, PS-065-03.R01 | agreed event, cancellation event and reschedule event delivered | pending records created, then voided with shares revoked |
| TEST-PS-065-09.T14 | a11y | PS-065-04.R01 | check-in and share flows with screen reader | statuses announced as text, buttons reachable, zero serious axe issues |

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F08.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
