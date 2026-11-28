# PS-061-01 — Domain schema: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-01.R01** A Thread is a vault record storing its context type and ID, a participant roster of DIDs with roles and mute state, status and tenant plus revision per CTR-ID-001; there is no relay copy.
- **PS-061-01.R02** Threads are P2 and visible only to participants; retention is RET-STANDARD and archived threads are purged locally 30 days after archive together with their messages unless the user keeps them.
- **PS-061-01.R03** Participant timestamps in a received thread-open statement are claims; the vault stores its own receivedAt separately.
- **PS-061-01.R04** The context binding is immutable after creation; a different context needs a new thread.
- **PS-061-01.R05** The threadId is derived, never random: UUIDv8 from the first 122 bits of SHA-256('classrup.comms.thread.v1' || 0x00 || JCS([contextTenantId, contextType, contextId, sortedPair, generation])), where contextTenantId is the tenantId named in the context's signed statement, sortedPair is present only for one-to-one contexts (listing, proposal, direct) and generation starts at 1 and increases only when a new thread replaces a locally archived one with the same key.

## Specification

### Thread

Schema `classrup.comms.thread/v1` · storage **device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv8 — derived threadId (domain requirement 05); identical in every participant vault |
| tenantId | uuidv7 — tenant scope of this vault |
| contextTenantId? | uuidv7 — tenantId named in the context's signed statement; derivation input; absent for direct threads |
| contextType | enum — listing \| proposal \| cycle \| booking \| rental \| direct |
| contextId? | uuidv7 — ref to the owning context record; absent only for direct |
| generation | int — 1.. ; increments only when a new thread replaces a locally archived thread with the same derivation key |
| threadKeyHash | string — SHA-256 hex of the derivation key without generation; indexed |
| participants | array — 2..12 items { did, role: owner\|member, joinedAtClaim, leftAt?, departedByNotice? (cid of the verified departure notice whose envelope author is this did); the local principal's entry also holds mutedUntil?: timestamp and muteForever: boolean } |
| openStatementCid? | string — sha256 cid of the signed thread-open statement that created or mirrored this thread |
| origin | enum — local \| mirrored |
| receivedAt? | timestamp — local clock when a mirrored thread was accepted |
| status | enum — active \| request \| archived |
| requestReason? | enum — unknown_sender \| context_missing |
| archiveReason? | enum — context_closed \| blocked \| manual \| idle \| account_deleted \| participant_departed \| declined \| superseded |
| supersededBy? | uuidv8 — newer-generation thread that took over; in-flight messages are re-homed there for 7 days |
| archivedAt? | timestamp — set when archived |
| createdBy | did:key — thread initiator |
| createdAt | timestamp — RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one non-archived thread exists per derivation key (contextTenantId, contextType, contextId, sorted pair for one-to-one contexts), and its id equals the derivation of that key and its generation.
- A participant has at most one entry with leftAt unset; leftAt is never cleared.
- status archived implies archivedAt and archiveReason are set and no new messages are accepted, except that a superseded thread re-homes envelopes from its participants into supersededBy for 7 days.
- contextTenantId, contextType, contextId and generation never change after creation.
- status request threads show only the first statement of the sender and send nothing back until the local user accepts.
- Field classes are annotated per F10.S02.M02 (roster DIDs and context IDs P2, mute settings P3).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T01 | unit | PS-061-01.R01, PS-061-01.R02, PS-061-01.R03, PS-061-02.R01 | create a listing thread between B and A | Thread stored with contextType listing, participants 2, origin local, derived threadId, thread-open statement signed |
| TEST-PS-061-09.T08 | integration | PS-061-06.R01, PS-061-01.R05 | create twice and concurrent creates from vaults A and B for one pair while offline | both derive the same threadId and generation, one thread after exchange, nothing superseded, existing true on repeat |
| TEST-PS-061-09.T17 | integration | PS-061-01.R05, PS-061-04.R03 | three vaults A, B, C receive mutiny.party.joined for cycle X in different orders and then exchange messages | all derive the same threadId; C verifies and decrypts A's message bound to that threadId |
| TEST-PS-061-09.T21 | unit | PS-061-01.R04 | attempt to change contextType, contextId or generation of a stored thread, and accept a thread-open whose threadId does not match its derivation | CONFLICT_STATE for the change; COMMS_THREAD_OPEN_REJECTED for the mismatch |

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, F02.S01.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [module SPEC](SPEC.md).
