# PS-064-02 — Validation rules: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-02.R01** Proposals are validated for time window, place and party rules before signing and again on receipt.
- **PS-064-02.R02** Agreement is accepted only through verified consent statements on the current proposal hash.
- **PS-064-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | windowEnd - windowStart is between 15 minutes and 4 hours, windowStart is at least 15 minutes and at most 30 days after the local clock | COMMS_MEETUP_WINDOW_INVALID |
| V02 | placeKind safe_spot requires a safeSpotId held in the local cache and active, placeKind area requires areaCell at L3 or coarser and areaLabel 3..80 characters | COMMS_MEETUP_PLACE_INVALID |
| V03 | areaLabel and spot snapshot contain no house-number address pattern, coordinates or P3 fields | COMMS_MEETUP_PLACE_INVALID |
| V04 | thread is active, the actor is a participant, and partyDids equals the thread participants involved in the context | VALIDATION_FAILED |
| V05 | the actor is not blocked by any party in the local block list | BLOCKED_PARTY |
| V06 | rescheduleCount is below 5 when creating a new revision | COMMS_MEETUP_RESCHEDULE_LIMIT |
| V07 | expectedRevision equals the current proposalRevision | CONFLICT_REVISION |
| V08 | agreeing consent verifies for the current proposalHash and signer is a party | COMMS_MEETUP_AGREEMENT_INVALID |
| V09 | a vault creates at most 20 proposals per day | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T01 | unit | PS-064-01.R01, PS-064-01.R02, PS-064-01.R03, PS-064-02.R01 | A proposes a 1-hour window at spot S1 | Meetup stored proposed with proposalHash equal to SHA-256 of JCS payload and spot snapshot copied |
| TEST-PS-064-09.T02 | unit | PS-064-02.R02, PS-064-02.R03 | each rule V01 to V09 violated in turn including areaLabel 12 Main Street | documented error code returned and nothing stored |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
