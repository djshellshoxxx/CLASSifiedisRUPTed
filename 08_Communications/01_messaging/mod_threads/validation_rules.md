# PS-061-02 — Validation rules: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-02.R01** Thread creation and inbound thread-open statements are validated against the context record, the signer's entitlement and the local block list before persistence.
- **PS-061-02.R02** Roster changes are validated against the participant cap and the owning context's own membership.
- **PS-061-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | contextType is one of the enum values and contextId exists, is visible to the creator and is not closed (checked through the context port of the owning module) | VALIDATION_FAILED |
| V02 | creator is not blocked by and does not block any other participant (F07.S02.M02) | BLOCKED_PARTY |
| V03 | participants count between 2 and 12 | COMMS_THREAD_PARTICIPANT_LIMIT |
| V04 | no active thread with the same context and pair exists; if it does its ID is returned instead of creating | COMMS_THREAD_EXISTS |
| V05 | mute duration is one of 1 h, 8 h, 24 h or until unmuted, and the actor is a current participant | VALIDATION_FAILED |
| V06 | direct threads require both parties to have at least one known device key | VALIDATION_FAILED |
| V08 | inbound thread-open statement carries a valid Ed25519 signature by a key of createdBy and createdBy is entitled for the context (listing author, counterparty of the offer or proposal party); otherwise it is quarantined | COMMS_THREAD_OPEN_REJECTED |
| V07 | a member creates at most 30 new threads per day | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T01 | unit | PS-061-01.R01, PS-061-01.R02, PS-061-01.R03, PS-061-02.R01 | create a listing thread between B and A | Thread stored with contextType listing, participants 2, origin local, thread-open statement signed |
| TEST-PS-061-09.T02 | unit | PS-061-02.R02, PS-061-02.R03 | each rule V02 to V07 violated in turn | the documented error code returned and nothing stored |
| TEST-PS-061-09.T12 | abuse | PS-061-07.R03, PS-061-02.R01 | 31st thread creation in a day; thread-open statement signed by a stranger for a listing they do not own | RATE_LIMITED; COMMS_THREAD_OPEN_REJECTED and message-request quarantine |

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
