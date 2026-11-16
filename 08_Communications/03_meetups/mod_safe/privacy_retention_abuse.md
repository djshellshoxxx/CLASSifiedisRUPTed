# PS-066-07 — Privacy, retention and abuse: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-07.R01** No user location is stored, transmitted or logged; the user picks a region cell label and the app reads from its own cache.
- **PS-066-07.R02** Spot data is public P0 and contains only venue information; curators must not publish private homes or addresses.
- **PS-066-07.R03** The module does not claim safety; the UI states that listing a place is not a guarantee.

## Specification

**Data classification**
- SafeSpot: P0 public statement.
- comms.safe_spot.suggested event: P1 local event with the chosen L2 cell and window; not sent anywhere.

**Retention**
- Active spots and caches: RET-STANDARD; tombstones 180 days after retirement.
- Reports of unsuitable spots: held by the receiving relay operator under RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Malicious spot at a private or unsafe location | only trusted curator keys are accepted, curators are accountable by DID, relay operator can retire, users can report, and the UI says listing is not a safety guarantee |
| T02 | Location inference from which cell a user browses | cells are L2 regions of many thousands of residents; the list is fetched in bulk per cell with no per-user parameters; users may preload several cells |
| T03 | Forged spot injected by a hostile relay | statements are verified by curator signature in the vault; invalid ones are discarded |
| T04 | Curator flooding with junk spots | 200 changes per day per curator and 5 000 active spots per cell per relay |
| T05 | Spot used for targeted ambush because both parties announce it | spots are public by design; the checklist advises companions and daylight and the Meetup module lets either party change the place |

**Abuse controls**
- Report spot sends the spot ID and reason to the hosting relay operator under that relay's policy; no global takedown is claimed.
- Relay operator can suspend a curator key on that relay only.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T08 | abuse | PS-066-07.R01, PS-066-07.R02 | capture all network traffic and IndexedDB writes during suggest and checklist | no coordinates, addresses or device location present |
| TEST-PS-066-09.T09 | abuse | PS-066-07.R03, PS-066-03.R02 | 201st change in a day by one curator; forged relay statement | RATE_LIMITED; forged statement discarded and cache unchanged |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
