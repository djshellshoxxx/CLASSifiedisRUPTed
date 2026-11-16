# PS-066-05 — Authorization and capabilities: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-05.R01** Relay policy lets only device keys listed as curators of that relay publish or retire spots, and the relay operator may retire any spot it hosts with a recorded reason.
- **PS-066-05.R02** Anyone, including anonymous clients, may read the public spot list; no authentication and no location are required.
- **PS-066-05.R03** Vault policy lets the local principal request suggestions and read the checklist; suggestions never leave the device.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| comms.safe_spot.publish | operator | relay policy; request signed by a curator key in the relay curator list |
| comms.safe_spot.retire | operator | curator who published the spot, or relay operator under hosting policy with recorded reason |
| comms.safe_spot.read_public | anonymous | relay public read; l2Cell required; 60 requests per minute per IP |
| comms.safe_spot.suggest | local principal | vault policy; no network access |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T06 | abuse | PS-066-05.R01, PS-066-05.R02, PS-066-05.R03 | statement signed by untrusted C2; anonymous publish; anonymous read | COMMS_SAFE_SPOT_CURATOR_UNTRUSTED for C2, UNAUTHENTICATED for anonymous publish, and anonymous read allowed within the rate limit |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
