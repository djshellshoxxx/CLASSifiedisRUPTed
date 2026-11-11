# PS-066-02 — Validation rules: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-02.R01** Curator input is validated strictly before signing and again by every verifying vault and relay.
- **PS-066-02.R02** Suggestion inputs are validated so that no user location can enter the module.
- **PS-066-02.R03** Every violation maps to one stable error code.
- **PS-066-02.R04** Every cell in a statement, a suggestion input and an event payload passes F06.S02.M01 assertPublicCell, so a 6-character cell fails drafting, publishing, verification and the build (N8).

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | name 2..80 characters, kind in the enum, hours 1..14 entries with open earlier than close in venueTz | VALIDATION_FAILED |
| V02 | accessNote is at most 160 characters and matches no house-number or street-address pattern, and the statement carries no street address, coordinates or extra cell fields | VALIDATION_FAILED |
| V03 | statement signature verifies and curatorDid is listed in the hosting relay's verified curator-list statement; app starter list entries are unsigned defaults and never accepted as curated | COMMS_SAFE_SPOT_CURATOR_UNTRUSTED |
| V04 | l2Cell exists in the supported region list (F06.S02.M01) | NOT_FOUND |
| V05 | suggest input contains an L2 cell ID and a time window only; coordinates, addresses or device location fields are rejected | VALIDATION_FAILED |
| V06 | a curator publishes at most 200 spot changes per day and a relay hosts at most 5 000 active spots per L2 cell, enforced by the relay through RateLimitPort (F12.S03.M03) | RATE_LIMITED |
| V07 | retirement carries a reason from the enum (closed, unsuitable, duplicate, policy, expired) | VALIDATION_FAILED |
| V08 | l2Cell passes assertPublicCell (exactly 5 characters) in draft, sign, publish, verify and suggest | DISCOVERY_PRECISION_FORBIDDEN |
| V09 | a spot whose validUntil has passed on the local clock is never suggested and is retired with reason expired; publishing with validUntil in the past is refused | EXPIRED |
| V10 | report reason is in the enum, text is at most 280 characters, a registered device files at most 10 reports per day and holds one open report per spot | RATE_LIMITED |
| V11 | curator-list updates are requested by a key holding the operator role on that relay (F16.S01.M01) and are signed by the relay key | FORBIDDEN |
| V12 | publish and report requests to the relay carry an RFC 9421 request signature of a registered device key, made with F11.S01.M03 signRequest under the request-signature tag classrup/relay-request/v1 (not an F16.S02.M03 envelope) and covering @method, @target-uri, content-digest, created, keyid and nonce | UNAUTHENTICATED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T01 | unit | PS-066-01.R01, PS-066-01.R03, PS-066-02.R01 | C1 drafts and publishes a valid police-station spot at u33db; drafts with a 6-character cell and with a house number in the access note | first stored active signed; second refused DISCOVERY_PRECISION_FORBIDDEN; third refused VALIDATION_FAILED |
| TEST-PS-066-09.T02 | unit | PS-066-02.R02, PS-066-02.R03 | each rule V01 to V12 violated in turn | documented error code returned and nothing stored |
| TEST-PS-066-09.T05 | unit | PS-066-04.R02, PS-066-02.R02 | suggest for window 14:00 to 15:00 | at most 5 spots, in-hours first, outside-hours labelled, trust source shown, no network call made |
| TEST-PS-066-09.T21 | unit | PS-066-02.R04 | static and runtime checks of every code path that writes or reads a cell | assertPublicCell is called in draft, sign, publish, verify and suggest, and a 6-character cell fails each path and the contract build |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
