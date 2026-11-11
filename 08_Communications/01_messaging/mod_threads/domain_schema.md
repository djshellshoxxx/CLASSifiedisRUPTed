# PS-061-01 — Domain schema: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-01.R01** A Thread is a vault record storing its context type and ID, a participant roster of DIDs with roles and mute state, status and tenant plus revision per CTR-ID-001; there is no relay copy.
- **PS-061-01.R02** Threads are P2 and visible only to participants; retention is RET-STANDARD and archived threads are purged locally 30 days after archive together with their messages unless the user keeps them.
- **PS-061-01.R03** Participant timestamps in a received thread-open statement are claims; the vault stores its own receivedAt separately.
- **PS-061-01.R04** The context binding is immutable after creation; a different context needs a new thread.

## Specification

### Thread

Schema `classrup.comms.thread/v1` · storage **device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| contextType | enum — listing \| proposal \| cycle \| booking \| rental \| direct |
| contextId? | uuidv7 — ref to the owning context record; absent only for direct |
| participants | array — 2..12 items { did, role: owner\|member, joinedAtClaim, leftAt?; the local principal's entry also holds mutedUntil?: timestamp and muteForever: boolean } |
| openStatementCid? | string — sha256 cid of the signed thread-open statement that created or mirrored this thread |
| origin | enum — local \| mirrored |
| receivedAt? | timestamp — local clock when a mirrored thread was accepted |
| status | enum — active \| archived |
| archiveReason? | enum — context_closed \| blocked \| manual \| idle \| account_deleted |
| archivedAt? | timestamp — set when archived |
| createdBy | did:key — thread initiator |
| createdAt | timestamp — RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one active thread exists per (tenantId, contextType, contextId, sorted participant pair) for one-to-one contexts.
- A participant has at most one entry with leftAt unset; leftAt is never cleared.
- status archived implies archivedAt and archiveReason are set and no new messages are accepted.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T01 | unit | PS-061-01.R01, PS-061-01.R02, PS-061-01.R03, PS-061-02.R01 | create a listing thread between B and A | Thread stored with contextType listing, participants 2, origin local, thread-open statement signed |
| TEST-PS-061-09.T08 | integration | PS-061-06.R01, PS-061-01.R04 | create twice and concurrent creates from both vaults A and B for one pair | one thread after exchange, lowest threadId kept, other archived superseded, existing true on repeat |

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
