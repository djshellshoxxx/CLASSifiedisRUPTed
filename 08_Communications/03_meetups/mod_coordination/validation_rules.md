# PS-064-02 — Validation rules: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-02.R01** Proposals are validated for time window, place and party rules before signing and again on receipt.
- **PS-064-02.R02** Agreement is accepted only through verified consent statements on the current proposal hash.
- **PS-064-02.R03** Every violation maps to one stable error code.
- **PS-064-02.R04** The house-number check applies to the free-text areaLabel only; a safe-spot snapshot is validated by matching it to a curator-verified SafeSpot statement in the local cache (same spot id, version, statement cid and signature).
- **PS-064-02.R05** Block checks use only the local principal's own blocks; statements from DIDs it blocked are dropped silently, and a party blocked by someone else sees no difference in its own vault.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | windowEnd - windowStart is between 15 minutes and 4 hours, windowStart is at least 15 minutes and at most 30 days after the local clock | COMMS_MEETUP_WINDOW_INVALID |
| V02 | placeKind safe_spot requires safeSpotId and spotCid of a SafeSpot statement held in the local cache, active and verified against the hosting relay's curator list (F08.S03.M01); placeKind area requires areaCell of at most 6 characters (L3 or coarser, F06.S02.M01) and areaLabel 3..80 characters | COMMS_MEETUP_PLACE_INVALID |
| V03 | areaLabel contains no house-number address pattern, coordinates or P3 fields; spotSnapshot equals the name, kind, l2Cell and accessNote of the verified spot statement named by spotCid | COMMS_MEETUP_PLACE_INVALID |
| V04 | thread is active, the actor is a participant, and partyDids equals the thread participants involved in the context | VALIDATION_FAILED |
| V05 | the local principal has not blocked any party in its own block list (F07.S02.M02 isBlockedEither over local data); BLOCKED_PARTY is returned only when the actor blocked the other party, and statements from DIDs the local principal blocked are dropped silently (N7) | BLOCKED_PARTY |
| V06 | rescheduleCount is below 5 when creating a new revision | COMMS_MEETUP_RESCHEDULE_LIMIT |
| V07 | expectedRevision equals the current proposalRevision | CONFLICT_REVISION |
| V08 | an agreement counts only when comms.consent.verify (F08.S02.M02) returns valid for that party, statement key consent.comms.meetup.agree.v1 and the current proposalHash; a conflicted result freezes the meetup | COMMS_MEETUP_AGREEMENT_INVALID |
| V09 | UX guard in the proposer vault: at most 20 proposals per day; receiving vaults keep at most 10 open meetups per thread and 5 new proposals per party per day and drop the rest silently | RATE_LIMITED |
| V10 | an inbound proposal is accompanied by the proposer's own valid agreement consent for its proposalHash | COMMS_MEETUP_AGREEMENT_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T01 | unit | PS-064-01.R01, PS-064-01.R02, PS-064-01.R03, PS-064-02.R01 | A proposes a 1-hour window at spot S1 | Meetup stored proposed with proposalHash equal to the ID-3 cid of the JCS payload, spot snapshot and spotCid copied from the verified statement, and A's own agreement consent signed |
| TEST-PS-064-09.T02 | unit | PS-064-02.R02, PS-064-02.R03 | each rule V01 to V10 violated in turn including areaLabel 12 Main Street | documented error code returned and nothing stored |
| TEST-PS-064-09.T17 | integration | PS-064-02.R04 | propose at S1 with the verified snapshot; inbound proposal whose snapshot differs from the statement named by spotCid; area label with a house number | first accepted (a street-like accessNote in the verified statement is not checked by the house-number rule); second and third rejected with COMMS_MEETUP_PLACE_INVALID |
| TEST-PS-064-09.T18 | abuse | PS-064-02.R05 | A has blocked B; B proposes and later cancels | A's vault drops both silently; B's vault state and responses are identical to an unblocked control run |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, F06.S02.M01, F07.S02.M02, F16.S02.M02, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
