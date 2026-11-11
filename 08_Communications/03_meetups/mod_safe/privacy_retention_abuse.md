# PS-066-07 — Privacy, retention and abuse: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-07.R01** No user location is stored, transmitted or logged; the user picks a region cell label and the app reads from its own cache.
- **PS-066-07.R02** Spot data is public P0 and contains only venue information at L2 precision (name, kind, hours, access note and a geohash-5 cell), never a street address; curators must not publish private homes.
- **PS-066-07.R03** The module does not claim safety; the UI states that listing a place is not a guarantee.
- **PS-066-07.R04** Privacy duties (N6): fields are classified per F10.S02.M02, local trust settings and checklist progress are P3 vault data, and ExportSectionPort, DeletionPort and RetentionPurgePort are registered with F10.

## Specification

**Data classification**
- SafeSpot: P0 public statement at L2 precision.
- comms.safe_spot.suggested event: P2 local event with the chosen L2 cell and meeting window; not sent anywhere.
- Local trust settings (pinned curators, hidden starter entries) and checklist progress: P3 vault data.
- Spot reports: P2 between the reporter's device key and the hosting relay.

**Retention**
- Active spots and caches: RET-STANDARD; tombstones 180 days after retirement.
- Reports of unsuitable spots: held by the receiving relay under RET-SHORT (30 days).
- Local trust settings: RET-STANDARD, deleted with the vault.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Malicious spot at a private or unsafe location | only curator keys in the hosting relay's signed curator list are accepted, curators are accountable by DID, relay operator can retire, users can report, and the UI says listing is not a safety guarantee |
| T02 | Location inference from which cell a user browses | cells are L2 regions of many thousands of residents; the list is fetched in bulk per cell with no per-user parameters; users may preload several cells |
| T03 | Hostile relay makes itself a curator and injects a fake police station at an ambush location | every spot shows its trust source (pinned curator, app starter list, or curator delegated by relay R); relay-delegated curators rank below pinned curators and starter entries; the vault pins curator keys per relay on first use and warns when the relay's curator list changes |
| T04 | Curator flooding with junk spots | 200 changes per day per curator and 5 000 active spots per cell per relay through RateLimitPort |
| T05 | Spot used for targeted ambush because both parties announce it | spots are public by design; the checklist advises companions and daylight and the Meetup module lets either party change the place |
| T06 | Precision leak through a fine venue cell or street address | statements carry only a geohash-5 cell checked by assertPublicCell in draft, sign, publish, verify and contract tests, and no street address field exists |
| T07 | App publisher acting as a global curator nobody can retire | the app bundles no curator keys; the starter list is unsigned, labelled and can be hidden or overridden by users and relays |

**Abuse controls**
- comms.safe_spot.report sends the spot ID, reason and text to the hosting relay under that relay's policy; no global takedown is claimed.
- Relay operators can remove a curator from that relay's curator list only.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T08 | abuse | PS-066-07.R01, PS-066-07.R02, PS-066-09.R03 | capture all network traffic and IndexedDB writes during suggest, checklist and trust changes | no coordinates, addresses or device location present |
| TEST-PS-066-09.T19 | unit | PS-066-07.R03 | render spot list, detail and checklist texts in en and de | no text calls a spot safe or verified safe; the not-a-guarantee notice is present |
| TEST-PS-066-09.T20 | integration | PS-066-04.R05, PS-066-07.R04 | account deletion of a member and of curator C1 | DeletionPort plans export and erase trust settings and checklist progress; C1's published spots stay public until retired, as the plan states |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, F16.S02.M03, F11.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
