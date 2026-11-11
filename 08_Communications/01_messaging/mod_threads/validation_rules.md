# PS-061-02 — Validation rules: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-02.R01** Thread creation and inbound thread-open statements are validated against the context record through the context owner's ThreadContextPort, the per-context entitlement table and the local principal's own block list before persistence.
- **PS-061-02.R02** Roster changes are validated against the participant cap and the owning context's own membership.
- **PS-061-02.R03** Every violation maps to one stable error code.
- **PS-061-02.R04** Limits enforced only in the creator's vault are UX guards; receiving vaults enforce their own caps on pending message requests (5 per unknown DID, 100 in total), so a modified client cannot flood an inbox.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | contextType is one of the enum values and contextId exists, is visible to the creator and is not closed, checked through the ThreadContextPort of the owning module | VALIDATION_FAILED |
| V02 | the creator has not blocked any other participant in its own block list (F07.S02.M02 isBlockedEither over local data); BLOCKED_PARTY is returned only when the actor blocked the other party, and whether the creator is blocked by someone else is unknown to its vault and never checked | BLOCKED_PARTY |
| V03 | participants count between 2 and 12 | COMMS_THREAD_PARTICIPANT_LIMIT |
| V04 | no non-archived thread with the derived threadId of (key, generation) exists; if it does its ID is returned with existing true instead of creating | COMMS_THREAD_EXISTS |
| V05 | mute duration is one of 1 h, 8 h, 24 h or until unmuted, and the actor is a current participant | VALIDATION_FAILED |
| V06 | direct threads require both parties to have at least one known device key (F16.S02.M02) | VALIDATION_FAILED |
| V08 | inbound thread-open statement carries a valid Ed25519 signature by an active device key of createdBy (F16.S02.M02) and createdBy is entitled per context type - listing: any signer, provided the listing author is a participant and this vault owns the listing or holds its verified projection; proposal: a party of the record (ThreadContextPort.isParty); cycle, booking, rental: createdBy and every listed participant are on the context roster; direct: any signer; entitled but unknown senders go to status request, others are quarantined | COMMS_THREAD_OPEN_REJECTED |
| V07 | UX guard in the creator vault: at most 30 new threads per day (a modified client can skip it; receivers enforce V10) | RATE_LIMITED |
| V09 | inbound thread-open: the statement's threadId equals the derivation of its own contextTenantId, contextType, contextId, participants and generation | COMMS_THREAD_OPEN_REJECTED |
| V10 | receiving vault cap: at most 5 pending requests per unknown DID and 100 in total; excess statements are dropped silently | RATE_LIMITED |
| V11 | accept_request and decline_request target a thread in status request | CONFLICT_STATE |
| V12 | an inbound classrup.privacy.deletion_notice/v1 is applied only when signed by a device key of the departing participant that F16.S02.M02 reports active at receipt | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T01 | unit | PS-061-01.R01, PS-061-01.R02, PS-061-01.R03, PS-061-02.R01 | create a listing thread between B and A | Thread stored with contextType listing, participants 2, origin local, derived threadId, thread-open statement signed |
| TEST-PS-061-09.T02 | unit | PS-061-02.R02, PS-061-02.R03 | each rule V01 to V12 violated in turn | the documented error code returned and nothing stored |
| TEST-PS-061-09.T12 | abuse | PS-061-07.R03, PS-061-02.R01 | 31st thread creation in a day; buyer B (not the listing author) opens a thread about A's listing; D (outside the cycle roster) opens a cycle thread | RATE_LIMITED as UX guard; B's thread is accepted in A's vault (request while B is unknown, active after accept); COMMS_THREAD_OPEN_REJECTED and quarantine for D |
| TEST-PS-061-09.T19 | abuse | PS-061-02.R04, PS-061-07.R04 | 50 unknown DIDs send 6 thread-open statements each to A | 5 per DID kept until the total of 100 pending requests, the rest dropped silently; no reply sent |

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, F02.S01.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
