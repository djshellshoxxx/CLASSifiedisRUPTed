# PS-066-02 — Validation rules: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-02.R01** Curator input is validated strictly before signing and again by every verifying vault and relay.
- **PS-066-02.R02** Suggestion inputs are validated so that no user location can enter the module.
- **PS-066-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | name 2..80 characters, kind in the enum, hours 1..14 entries with open earlier than close in venueTz | VALIDATION_FAILED |
| V02 | publicAddress is at most 160 characters and venueCell precision is L3 or coarser | VALIDATION_FAILED |
| V03 | statement signature verifies and curatorDid is in the trusted curator list of the hosting relay or the bundled list | COMMS_SAFE_SPOT_CURATOR_UNTRUSTED |
| V04 | l2Cell exists in the supported region list (F06.S02.M01) | NOT_FOUND |
| V05 | suggest input contains an L2 cell ID and a time window only; coordinates, addresses or device location fields are rejected | VALIDATION_FAILED |
| V06 | a curator publishes at most 200 spot changes per day and a relay hosts at most 5 000 active spots per L2 cell | RATE_LIMITED |
| V07 | retirement carries a reason from the enum | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T01 | unit | PS-066-01.R01, PS-066-01.R02, PS-066-01.R03, PS-066-02.R01 | publish a valid police-station spot and a spot with exact coordinates in venueCell | first stored active signed; second refused VALIDATION_FAILED |
| TEST-PS-066-09.T02 | unit | PS-066-02.R02, PS-066-02.R03 | each rule V01 to V07 violated in turn | documented error code returned and nothing stored |
| TEST-PS-066-09.T05 | unit | PS-066-04.R02, PS-066-02.R02 | suggest for window 14:00 to 15:00 | at most 5 spots, in-hours first, outside-hours labelled, no network call made |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
