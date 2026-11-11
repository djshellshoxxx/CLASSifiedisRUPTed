# PS-066-09 — Contract and acceptance tests: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-066-09.R02** Contract tests check relay commands, the vault command and the event payload against the schema registry.
- **PS-066-09.R03** A privacy test asserts that no network request or storage write contains user location.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay R with curator C1 (trusted) and C2 (untrusted), region cell l2:DE-BE-001 with 8 spots incl. 2 outside hours, fixed clock 2026-11-04T10:00:00Z, venue tz Europe/Berlin.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T01 | unit | PS-066-01.R01, PS-066-01.R02, PS-066-01.R03, PS-066-02.R01 | publish a valid police-station spot and a spot with exact coordinates in venueCell | first stored active signed; second refused VALIDATION_FAILED |
| TEST-PS-066-09.T02 | unit | PS-066-02.R02, PS-066-02.R03 | each rule V01 to V07 violated in turn | documented error code returned and nothing stored |
| TEST-PS-066-09.T03 | property | PS-066-03.R01, PS-066-03.R02, PS-066-03.R03 | random sequences of publish, retire, refresh | retired never returns to active; at most one active version per curator and venue; tombstone purged at 180 days |
| TEST-PS-066-09.T04 | contract | PS-066-04.R01, PS-066-04.R02, PS-066-04.R03, PS-066-09.R02 | publish, retire, suggest, list, checklist | outputs and event payloads validate against registry schemas |
| TEST-PS-066-09.T05 | unit | PS-066-04.R02, PS-066-02.R02 | suggest for window 14:00 to 15:00 | at most 5 spots, in-hours first, outside-hours labelled, no network call made |
| TEST-PS-066-09.T06 | abuse | PS-066-05.R01, PS-066-05.R02, PS-066-05.R03 | statement signed by untrusted C2; anonymous publish; anonymous read | COMMS_SAFE_SPOT_CURATOR_UNTRUSTED for C2, UNAUTHENTICATED for anonymous publish, and anonymous read allowed within the rate limit |
| TEST-PS-066-09.T07 | integration | PS-066-06.R01, PS-066-06.R02, PS-066-06.R03 | replay publish, interrupt refresh after page 2, run offline | idempotent result, cursor resumes, cached suggestions still work |
| TEST-PS-066-09.T08 | abuse | PS-066-07.R01, PS-066-07.R02 | capture all network traffic and IndexedDB writes during suggest and checklist | no coordinates, addresses or device location present |
| TEST-PS-066-09.T09 | abuse | PS-066-07.R03, PS-066-03.R02 | 201st change in a day by one curator; forged relay statement | RATE_LIMITED; forged statement discarded and cache unchanged |
| TEST-PS-066-09.T10 | load | PS-066-08.R01, PS-066-08.R02, PS-066-08.R03 | 5 000 cached spots suggest 1 000 times; list 100 items at 50 req/s | budgets met |
| TEST-PS-066-09.T11 | unit | PS-066-09.R01, PS-066-09.R03 | traceability tool run | every PS-066 requirement maps to a passing test |
| TEST-PS-066-09.T12 | integration | PS-066-10.R01, PS-066-10.R02, PS-066-10.R03 | export, import into fresh vault, restore relay from backup | spots round trip; imported spots are re-verified against the curator list |
| TEST-PS-066-09.T13 | a11y | PS-066-04.R01 | suggest sheet and checklist with screen reader | list semantics, checklist progress announced, zero serious axe issues |

## Acceptance criteria

- All tests T01 to T13 pass in CI.
- Network and storage captures show zero user location data in any flow of this module.
- The UI never describes a listed spot as safe or verified safe.

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
