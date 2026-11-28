# PS-066-09 — Contract and acceptance tests: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-066-09.R02** Contract tests check relay commands, the vault commands and the event payload against the schema registry.
- **PS-066-09.R03** A privacy test asserts that no network request or storage write contains user location.
- **PS-066-09.R04** Screens meet CTR-UX-001 (WCAG 2.2 AA, 44 px targets, explicit async states, polite announcements) and the a11y items listed for this module.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay R with operator O, curator C1 (in R's curator list) and C2 (not listed), region cell u33db (geohash 5) with 8 spots incl. 2 outside hours and 1 with validUntil tomorrow, app starter list for the region, fixed clock 2026-11-04T10:00:00Z, venue tz Europe/Berlin.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T01 | unit | PS-066-01.R01, PS-066-01.R03, PS-066-02.R01 | C1 drafts and publishes a valid police-station spot at u33db; drafts with a 6-character cell and with a house number in the access note | first stored active signed; second refused DISCOVERY_PRECISION_FORBIDDEN; third refused VALIDATION_FAILED |
| TEST-PS-066-09.T02 | unit | PS-066-02.R02, PS-066-02.R03 | each rule V01 to V12 violated in turn | documented error code returned and nothing stored |
| TEST-PS-066-09.T03 | property | PS-066-03.R01, PS-066-03.R03 | random sequences of draft, sign, publish, retire, refresh and clock jumps | retired never returns to active; at most one active version per curator and venue; tombstone purged at 180 days |
| TEST-PS-066-09.T04 | contract | PS-066-04.R01, PS-066-04.R02, PS-066-04.R03, PS-066-09.R02 | draft, sign, publish, retire, report, curator-list update, suggest, list, curator list and checklist | outputs and event payloads validate against registry schemas |
| TEST-PS-066-09.T05 | unit | PS-066-04.R02, PS-066-02.R02 | suggest for window 14:00 to 15:00 | at most 5 spots, in-hours first, outside-hours labelled, trust source shown, no network call made |
| TEST-PS-066-09.T06 | abuse | PS-066-05.R01, PS-066-05.R02, PS-066-05.R03 | statement signed by unlisted C2; anonymous publish; anonymous read; curator-list update by a non-operator key | COMMS_SAFE_SPOT_CURATOR_UNTRUSTED for C2, UNAUTHENTICATED for anonymous publish, anonymous read allowed within the rate limit, FORBIDDEN for the update |
| TEST-PS-066-09.T07 | integration | PS-066-06.R01, PS-066-06.R02, PS-066-06.R03 | replay publish, interrupt refresh after page 2, run offline | idempotent result, cursor resumes, cached suggestions still work |
| TEST-PS-066-09.T08 | abuse | PS-066-07.R01, PS-066-07.R02, PS-066-09.R03 | capture all network traffic and IndexedDB writes during suggest, checklist and trust changes | no coordinates, addresses or device location present |
| TEST-PS-066-09.T09 | abuse | PS-066-03.R02 | 201st change in a day by one curator; statement altered by the relay after signing | RATE_LIMITED; altered statement discarded and cache unchanged |
| TEST-PS-066-09.T10 | load | PS-066-08.R01, PS-066-08.R02, PS-066-08.R03 | 5 000 cached spots suggest 1 000 times; list 100 items at 50 req/s | budgets met |
| TEST-PS-066-09.T11 | unit | PS-066-09.R01 | traceability tool run | every PS-066 requirement maps to a passing test |
| TEST-PS-066-09.T12 | integration | PS-066-10.R01, PS-066-10.R02, PS-066-10.R03 | export, import into fresh vault, restore relay from backup | spots and trust settings round trip; imported spots are re-verified against the curator list |
| TEST-PS-066-09.T13 | a11y | PS-066-09.R04 | suggest sheet, trust settings and checklist with screen reader | list semantics, trust source announced, checklist progress announced, targets ≥ 44 px, zero serious axe issues |
| TEST-PS-066-09.T14 | abuse | PS-066-01.R02, PS-066-01.R04 | R adds its own key to its curator list and publishes a police station; the user had pinned C1 | the spot shows 'curator delegated by relay R', ranks below C1 spots and starter entries, and a curator-list-changed warning is shown until acknowledged |
| TEST-PS-066-09.T15 | unit | PS-066-03.R04 | clock passes a spot's validUntil before the relay retirement arrives | spot filtered from suggestions immediately and stored retired with reason expired; relay sweep issues the expired tombstone |
| TEST-PS-066-09.T16 | integration | PS-066-04.R01, PS-066-04.R04 | C1 drafts and signs offline, publishes on reconnect; a member reports the spot; registry lookup | spot active only after relay acceptance; report stored with RET-SHORT expiry; registry lists spot, retirement and curator-list statements with signer roles |
| TEST-PS-066-09.T17 | contract | PS-066-04.R02 | comms.safe_spot.suggested declared privacy class and payload | class P2 and payload holds only l2Cell, spotIds and the window |
| TEST-PS-066-09.T18 | unit | PS-066-01.R05 | load the app starter list; user hides an entry; relay overrides an entry | entries unsigned and labelled app starter list; no curator key ships with the app; hidden and overridden entries are not suggested |
| TEST-PS-066-09.T19 | unit | PS-066-07.R03 | render spot list, detail and checklist texts in en and de | no text calls a spot safe or verified safe; the not-a-guarantee notice is present |
| TEST-PS-066-09.T20 | integration | PS-066-04.R05, PS-066-07.R04 | account deletion of a member and of curator C1 | DeletionPort plans export and erase trust settings and checklist progress; C1's published spots stay public until retired, as the plan states |
| TEST-PS-066-09.T21 | unit | PS-066-02.R04 | static and runtime checks of every code path that writes or reads a cell | assertPublicCell is called in draft, sign, publish, verify and suggest, and a 6-character cell fails each path and the contract build |

## Acceptance criteria

- All tests T01 to T21 pass in CI.
- Network and storage captures show zero user location data in any flow of this module, and no spot statement contains a cell finer than L2 or a street address.
- The UI never describes a listed spot as safe or verified safe and always shows the trust source.

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
