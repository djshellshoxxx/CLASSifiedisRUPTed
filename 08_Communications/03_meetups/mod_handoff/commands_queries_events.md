# PS-065-04 — Commands, queries and events: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-04.R01** Check-in and no-show report are vault commands that produce signed statements; share creation and revocation are vault commands that call the relay commands comms.meetup_share.put and comms.meetup_share.delete for the share blob, and view is a public relay query returning ciphertext only.
- **PS-065-04.R02** Each state-changing vault command emits its event in the same IndexedDB transaction as the change.
- **PS-065-04.R03** The module consumes meetup agreement, reschedule and cancellation events to create and void check-in records.
- **PS-065-04.R04** Statements are registered with F11.S01.M01 (N2): classrup.comms.checkin/v1 { meetupId, proposalHash, partyDid, checkedInAtClaim } signed by a device key of that party, and classrup.comms.no_show_report/v1 { meetupId, proposalHash, targetDid, reportedAtClaim } signed by a device key of a checked-in party; share blob requests are classrup/relay-request/v1 envelopes of F16.S02.M03.
- **PS-065-04.R05** The trusted-contact viewer is served from the app's static, integrity-pinned PWA origin with relay ID, share ID and key in the URL fragment; the relay answers comms.meetup_share.view with ciphertext only, under a CORS allowance for the app origin, and never serves viewer code.
- **PS-065-04.R06** The module registers ExportSectionPort (section comms.checkins), DeletionPort (plan, execute, pseudonymize - kept check-in and report evidence gets the deleted party's DID replaced by the deletion pseudonym, share blobs are deleted while the keys exist) and RetentionPurgePort (RET-EVIDENCE independent of the thread purge, shares RET-EPHEMERAL) with F10 (N6).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.meetup.check_in` | comms.meetup.check_in | [vault command; produces signed statement classrup.comms.checkin/v1] { meetupId, expectedRevision } | { checkinId, status: checked_in, checkedInAtClaim, revision } | NOT_FOUND, FORBIDDEN, CONFLICT_STATE, CONFLICT_REVISION, COMMS_CHECKIN_OUTSIDE_WINDOW, VALIDATION_FAILED | comms.meetup.checked_in | yes (Idempotency-Key) |
| `comms.meetup.report_no_show` | comms.meetup.report_no_show | [vault command; produces signed statement classrup.comms.no_show_report/v1] { meetupId, targetDid, expectedRevision } | { checkinId, status: no_show, contradicted, revision } | NOT_FOUND, FORBIDDEN, CONFLICT_STATE, CONFLICT_REVISION, COMMS_NO_SHOW_NOT_ALLOWED, RATE_LIMITED | comms.meetup.no_show | yes (Idempotency-Key) |
| `comms.meetup_share.create` | comms.meetup_share.create | [vault command; calls relay command comms.meetup_share.put] { meetupId, expiresInMs (default 21600000, max 86400000) } | { shareId, url (app-origin viewer URL with relay ID, share ID and key in the fragment), expiresAt } | NOT_FOUND, FORBIDDEN, COMMS_SHARE_LIMIT, PAYLOAD_TOO_LARGE, DEPENDENCY_UNAVAILABLE, FEATURE_DISABLED | comms.meetup_share.created | yes (Idempotency-Key) |
| `comms.meetup_share.put` | comms.meetup_share.put | [relay command, request signed by the creating device key] { shareId, snapshotRevision, ciphertext (≤ 2 048 bytes), keyHash, expiresAt } | { shareId, snapshotRevision } | UNAUTHENTICATED, FORBIDDEN, VALIDATION_FAILED, PAYLOAD_TOO_LARGE, COMMS_SHARE_LIMIT, CONFLICT_REVISION, RATE_LIMITED, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `comms.meetup_share.delete` | comms.meetup_share.delete | [relay command, request signed by the creating device key] { shareId } | { shareId, deleted: true } | UNAUTHENTICATED, FORBIDDEN, NOT_FOUND |  | yes (Idempotency-Key) |
| `comms.meetup_share.revoke` | comms.meetup_share.revoke | [vault command; calls relay command comms.meetup_share.delete with the creating device's signature] { shareId, expectedRevision } | { shareId, revision, revoked: true } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE | comms.meetup_share.revoked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.meetup_share.view` | comms.meetup_share.view | [relay query, public by unguessable share ID; called by the app-origin viewer] { shareId } | { ciphertext, snapshotRevision, expiresAt } (the app-origin viewer decrypts with the key in the fragment) | NOT_FOUND, RATE_LIMITED |
| `comms.meetup.list_checkins` | comms.meetup.read_checkin | [vault query] { meetupId } | { items: MeetupCheckin[], shares: MeetupShare[] } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.meetup.checked_in` | P2 | { meetupId, partyDid, partyDids[], checkedInAtClaim, checkinStatementCid, origin: local\|federated } |
| `comms.meetup.no_show` | P2 | { meetupId, targetDid, reportedByDid, reportStatementCid, claim: true, contradicted, origin: local\|federated } |
| `comms.meetup.no_show_contradicted` | P2 | { meetupId, targetDid, reportedByDid, reportStatementCid, checkinStatementCid } |
| `comms.meetup_share.created` | P3 | { shareId, meetupId, expiresAt } |
| `comms.meetup_share.revoked` | P3 | { shareId, meetupId, reason: owner\|cancelled\|rescheduled\|expired } |

### Events consumed

| Type | Effect |
|---|---|
| `comms.meetup.agreed` | create pending MeetupCheckin records for every party for the agreed proposalHash |
| `comms.meetup.cancelled` | void pending check-ins and revoke active shares of the meetup |
| `comms.meetup.proposed` | if a previously agreed meetup returns to proposed (reschedule or revoked agreement), void its pending check-ins for the old hash and revoke shares with reason rescheduled |
| `identity.block.added` | drop later inbound check-in and no-show statements from the DID the local principal blocked; nothing is sent |
| `privacy.deletion.completed` | replace remaining references to the deleted principal by the payload pseudonym in check-in and no-show evidence kept under RET-EVIDENCE |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_CHECKIN_OUTSIDE_WINDOW | 409 | no | check-in is allowed only from 15 minutes before the window to 30 minutes after it ends |
| COMMS_CHECKIN_SIGNATURE_INVALID | 422 | no | inbound check-in or report signature, key status or signer role is invalid; statement quarantined |
| COMMS_NO_SHOW_NOT_ALLOWED | 409 | no | reporter has not checked in, grace period of 30 minutes not over, 24 hour report period ended, or target already checked in |
| COMMS_SHARE_LIMIT | 409 | no | more than 3 active shares for the meetup or expiry beyond 24 hours |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.meetup.check_in  { "meetupId": "0192f3a8-4444-7000-8000-000000000001", "expectedRevision": 4 }
-> { "checkinId": "0192f3a9-5555-7000-8000-000000000001", "status": "checked_in", "checkedInAtClaim": "2026-11-07T13:52:10.000Z", "revision": 2 }
vault command comms.meetup_share.create  { "meetupId": "0192f3a8-4444-7000-8000-000000000001", "expiresInMs": 21600000 }
-> { "shareId": "0192f3a9-6666-7000-8000-000000000001", "url": "https://app.example/share#r=relay.example&s=0192f3a9-6666-7000-8000-000000000001&k=Zm9v…", "expiresAt": "2026-11-07T19:30:00.000Z" }
the viewer at https://app.example/share (integrity-pinned app code) calls GET https://relay.example/api/v1/relay/comms.meetup_share.view?shareId=… and receives ciphertext only
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T04 | contract | PS-065-04.R01, PS-065-04.R02, PS-065-09.R02 | each command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-065-09.T05 | integration | PS-065-04.R03, PS-065-03.R01 | agreed event, cancellation event and a return to proposed (reschedule) delivered | pending records created, then voided with shares revoked |
| TEST-PS-065-09.T15 | abuse | PS-065-04.R05, PS-065-07.R02 | open a share link; request the viewer path and any HTML or script from the relay origin | the viewer loads from the app origin with integrity-pinned assets; the relay serves no viewer code and answers only the ciphertext query |
| TEST-PS-065-09.T18 | integration | PS-065-04.R06, PS-065-07.R04 | account deletion of B with an active share and kept check-ins | the share blob is deleted while keys exist; B's own kept evidence carries the pseudonym after privacy.deletion.completed; A's copy unchanged |
| TEST-PS-065-09.T19 | contract | PS-065-04.R04, PS-065-03.R02 | registry entries for checkin and no_show_report; share expiry | signer roles listed; expiry deletes the relay blob and emits comms.meetup_share.revoked with reason expired |

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
