# PS-064-01 — Domain schema: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-01.R01** A Meetup stores the thread, context reference, parties, the current proposal revision (window start and end in UTC, venue snapshot with the spot statement cid), the reschedule count, the agreement statement IDs, and status, with tenant and revision per CTR-ID-001.
- **PS-064-01.R02** Meetups are P2 and held only in participating vaults; the place is either a SafeSpot snapshot matched to a curator-verified spot statement (public P0 data at L2) or an L3 area label, and exact home addresses (P3) and live locations are never stored or accepted.
- **PS-064-01.R03** The proposal revision hash is the CTR-ID-001 ID-3 cid (sha256-<base64url> of the JCS bytes of the proposal payload), and agreement is a ConsentStatement with statement key consent.comms.meetup.agree.v1 and subjectType comms_meetup on that hash, signed by every party including the proposer.
- **PS-064-01.R04** Signed proposal and cancellation statements are evidence under RET-EVIDENCE (2 years after last related activity), kept independently of the thread purge so the agreement consents can still be re-verified against the subject bytes, and pseudonymized on principal deletion.
- **PS-064-01.R05** The module registers the F08.S02.M02 SubjectCanonicalizerPort for subjectType comms_meetup - canonicalBytes(meetupId, rev) returns the JCS bytes of that proposal revision, currentRevision the proposalRevision, partyRole party for every partyDid, and isCommitted true only once the local clock passed windowStart of the agreed revision - so an agreed meetup is not committed and its consents may be revoked until windowStart.

## Specification

### Meetup

Schema `classrup.comms.meetup/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, created by the first proposer |
| tenantId | uuidv7 — tenant scope |
| threadId | uuidv8 — ref F08.S01.M02 Thread; must be active |
| contextType? | enum — listing \| proposal \| cycle \| booking \| rental \| direct |
| contextId? | uuidv7 — context record, copied from the thread |
| partyDids | array — 2..12 did:key items; each is a participant of the thread |
| proposalRevision | int — 1.. increments on each reschedule |
| proposalHash | string — sha256-<base64url> ID-3 cid of the JCS bytes of the current proposal payload |
| proposalCids | array — cids of every signed proposal statement received for this meetup, kept as evidence |
| windowStart | timestamp — UTC, at least 15 minutes after proposal time claim and at most 30 days ahead |
| windowEnd | timestamp — UTC, 15 minutes to 4 hours after windowStart |
| venueTz | string — IANA time zone used to display the window |
| placeKind | enum — safe_spot \| area |
| safeSpotId? | uuidv7 — ref F08.S03.M01 SafeSpot when placeKind is safe_spot |
| spotSnapshot? | object — { spotId, spotCid, version, name, kind, l2Cell, accessNote? } copied from the verified spot statement at proposal time |
| areaCell? | string — geohash of at most 6 characters (L3 or coarser) when placeKind is area |
| areaLabel? | string — 3..80 characters, no house numbers |
| proposerDid | did:key — signer of the current revision |
| rescheduleCount | int — 0..5 |
| agreements | array — items { partyDid, consentId, proposalHash }, only verified consents for the current hash, including the proposer's |
| competingProposals? | array — while conflicted: { proposerDid, proposalHash, windowStart } of every valid proposal with the current proposalRevision |
| status | enum — proposed \| agreed \| conflicted \| cancelled \| expired \| elapsed |
| cancelReason? | enum — changed_plans \| unsafe \| item_unavailable \| no_response \| other |
| createdAtClaim | timestamp — proposer clock, a claim |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- status agreed implies every partyDid, the proposer included, has a verified agreement for the current proposalHash.
- rescheduleCount never exceeds 5 and increases by exactly 1 per new proposalRevision.
- Any two valid proposals with the same proposalRevision and different proposalHash, whoever proposed them, make status conflicted and are never merged.
- windowEnd minus windowStart is between 15 minutes and 4 hours.
- spotSnapshot always equals the fields of the verified spot statement named by spotCid.
- Field classes are annotated per F10.S02.M02 (window, place and party DIDs P2; areaCell P2 at L3).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T01 | unit | PS-064-01.R01, PS-064-01.R02, PS-064-01.R03, PS-064-02.R01 | A proposes a 1-hour window at spot S1 | Meetup stored proposed with proposalHash equal to the ID-3 cid of the JCS payload, spot snapshot and spotCid copied from the verified statement, and A's own agreement consent signed |
| TEST-PS-064-09.T15 | integration | PS-064-03.R04, PS-064-01.R05, PS-064-09.R03 | two vaults: A proposes (A's consent included), B agrees; B revokes before windowStart; repeat with B trying to revoke after windowStart | agreed in both vaults; then proposed again in both (reason agreement_revoked); after windowStart the local revoke is refused because isCommitted is true |
| TEST-PS-064-09.T20 | integration | PS-064-01.R04, PS-064-07.R04 | archive and purge thread TH after an agreed meetup, then re-verify; delete B's account | meetup, proposal statements and consents remain and re-verify; B's own vault pseudonymizes B's DID in its kept evidence while A's copy is unchanged |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, F06.S02.M01, F07.S02.M02, F16.S02.M02, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [module SPEC](SPEC.md).
