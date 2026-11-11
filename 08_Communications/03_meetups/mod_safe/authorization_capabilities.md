# PS-066-05 — Authorization and capabilities: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-05.R01** Relay policy lets only curator keys listed in that relay's signed curator list publish or retire their spots, lets the relay operator retire any spot it hosts with a recorded reason, and lets only operators (F16.S01.M01) change the curator list.
- **PS-066-05.R02** Anyone, including anonymous clients, may read the public spot list and the curator list; no authentication and no location are required.
- **PS-066-05.R03** Vault policy lets the local principal request suggestions, read the checklist and change its own trust settings, and lets a curator draft and sign spots; suggestions never leave the device.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| comms.safe_spot.author | local principal | vault policy; local principal acting as curator; drafts stay in the vault until signed and published |
| comms.safe_spot.publish | curator | relay-local role defined by this module: request and statement signed by a key in this relay's signed curator list; anonymous requests refused with UNAUTHENTICATED |
| comms.safe_spot.retire | curator, operator | curator who published the spot, or relay operator under hosting policy with recorded reason |
| comms.safe_spot.report | registered relay device | relay policy; signed request; at most 10 reports per device per day and one open report per device and spot |
| comms.curator_list.update | operator | relay policy; requester holds the F16.S01.M01 operator role on this relay; the relay key signs the list |
| comms.curator_list.read_public | anonymous | relay public read; 60 requests per minute per IP |
| comms.safe_spot.read_public | anonymous | relay public read; l2Cell required; 60 requests per minute per IP |
| comms.safe_spot.suggest | local principal | vault policy; no network access |
| comms.safe_spot.manage_trust | local principal | vault policy; changes only the local trust settings |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T06 | abuse | PS-066-05.R01, PS-066-05.R02, PS-066-05.R03 | statement signed by unlisted C2; anonymous publish; anonymous read; curator-list update by a non-operator key | COMMS_SAFE_SPOT_CURATOR_UNTRUSTED for C2, UNAUTHENTICATED for anonymous publish, anonymous read allowed within the rate limit, FORBIDDEN for the update |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, F16.S02.M03, F11.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
