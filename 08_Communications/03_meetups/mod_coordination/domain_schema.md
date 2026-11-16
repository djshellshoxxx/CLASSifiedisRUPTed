# PS-064-01 — Domain schema: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-01.R01** A Meetup stores the thread, context reference, parties, the current proposal revision (window start and end in UTC, venue snapshot), the reschedule count, the agreement statement IDs, and status, with tenant and revision per CTR-ID-001.
- **PS-064-01.R02** Meetups are P2 and held only in participating vaults; the place is either a SafeSpot snapshot (public P0 data) or an L3 area label, and exact home addresses (P3) and live locations are never stored or accepted.
- **PS-064-01.R03** The proposal revision hash is SHA-256 of the JCS bytes of the proposal payload, and agreement is a ConsentStatement with statement key consent.comms.meetup.agree.v1 and subjectType comms_meetup on that hash.

## Specification

### Meetup

Schema `classrup.comms.meetup/v1` · storage **device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, created by the first proposer |
| tenantId | uuidv7 — tenant scope |
| threadId | uuidv7 — ref F08.S01.M02 Thread; must be active |
| contextType? | enum — listing \| proposal \| cycle \| booking \| rental \| direct |
| contextId? | uuidv7 — context record, copied from the thread |
| partyDids | array — 2..12 did:key items; each is a participant of the thread |
| proposalRevision | int — 1.. increments on each reschedule |
| proposalHash | string — SHA-256 hex of JCS bytes of the current proposal payload |
| windowStart | timestamp — UTC, at least 15 minutes after proposal time claim and at most 30 days ahead |
| windowEnd | timestamp — UTC, 15 minutes to 4 hours after windowStart |
| venueTz | string — IANA time zone used to display the window |
| placeKind | enum — safe_spot \| area |
| safeSpotId? | uuidv7 — ref F08.S03.M01 SafeSpot when placeKind is safe_spot |
| spotSnapshot? | object — { name, publicAddress, venueCell } copied at proposal time |
| areaCell? | string — L3 cell ID when placeKind is area |
| areaLabel? | string — 3..80 characters, no house numbers |
| proposerDid | did:key — signer of the current revision |
| rescheduleCount | int — 0..5 |
| agreements | array — items { partyDid, consentId, proposalHash }, only verified consents for the current hash |
| status | enum — proposed \| agreed \| conflicted \| cancelled \| expired \| elapsed |
| cancelReason? | enum — changed_plans \| unsafe \| item_unavailable \| no_response \| other |
| createdAtClaim | timestamp — proposer clock, a claim |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- status agreed implies every partyDid has a verified agreement for the current proposalHash.
- rescheduleCount never exceeds 5 and increases by exactly 1 per new proposalRevision.
- Two valid proposals by one proposer with the same proposalRevision and different proposalHash make status conflicted and are never merged.
- windowEnd minus windowStart is between 15 minutes and 4 hours.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T01 | unit | PS-064-01.R01, PS-064-01.R02, PS-064-01.R03, PS-064-02.R01 | A proposes a 1-hour window at spot S1 | Meetup stored proposed with proposalHash equal to SHA-256 of JCS payload and spot snapshot copied |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
