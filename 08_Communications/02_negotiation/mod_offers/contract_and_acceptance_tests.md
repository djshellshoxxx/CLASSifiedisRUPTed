# PS-063-09 — Contract and acceptance tests: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-063-09.R02** Contract tests check command input and output, the signed statement and event payload against the schema registry.
- **PS-063-09.R03** Role and hash verification are covered by adversarial fixtures.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults S (seller) and B (buyer) with thread TH, bazaar offer O revision 1 signed by B and held by both, mutiny proposal P revision 2, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T01 | unit | PS-063-01.R01, PS-063-01.R02, PS-063-01.R03, PS-063-02.R01 | B posts a card for offer O revision 1 | card stored posted with refRevisionHash equal to SHA-256 of JCS of O revision 1 and snapshot at most 280 characters |
| TEST-PS-063-09.T02 | unit | PS-063-02.R02, PS-063-02.R03 | each rule V01 to V08 violated in turn | documented error code returned and nothing stored |
| TEST-PS-063-09.T03 | property | PS-063-03.R01, PS-063-03.R02 | random sequences of owning-module events and card posts | transitions only as declared; closed and superseded never change; closed only follows verified terminal events |
| TEST-PS-063-09.T04 | integration | PS-063-03.R03 | card arrives before its referenced offer statement; statement arrives on day 3, another card never arrives for 7 days | first becomes posted, second becomes unverified |
| TEST-PS-063-09.T05 | contract | PS-063-04.R01, PS-063-04.R02, PS-063-09.R02 | post and list executes | output, statement and event payload validate against registry schemas |
| TEST-PS-063-09.T06 | integration | PS-063-04.R03 | deliver offer accepted, negotiation countered, proposal revised and thread archived events | cards become closed, superseded, superseded and frozen respectively |
| TEST-PS-063-09.T07 | abuse | PS-063-05.R01, PS-063-05.R02, PS-063-05.R03, PS-063-09.R03 | stranger posts card for B's offer; card signed by non-party; relay operator inspects stored data | quarantined unverified with no actions; relay holds no card data |
| TEST-PS-063-09.T08 | integration | PS-063-06.R01, PS-063-06.R02, PS-063-06.R03 | post twice, replay inbound statement three times, and kill the app before message delivery | single card, one event per origin, card remains with prepared delivery state |
| TEST-PS-063-09.T09 | abuse | PS-063-07.R01, PS-063-07.R02, PS-063-07.R03 | card with link text and address-like snapshot; 21st card in a day | links not rendered, no P3 fields accepted, RATE_LIMITED |
| TEST-PS-063-09.T10 | load | PS-063-08.R01, PS-063-08.R02, PS-063-08.R03 | thread with 50 cards and 500 events replayed | budgets met |
| TEST-PS-063-09.T11 | unit | PS-063-09.R01 | traceability tool run | every PS-063 requirement maps to a passing test |
| TEST-PS-063-09.T12 | integration | PS-063-10.R01, PS-063-10.R02, PS-063-10.R03 | export, import into fresh vault, restore from backup | cards round trip; cards whose record is missing import as unverified |
| TEST-PS-063-09.T13 | a11y | PS-063-04.R01 | thread with all card states on mobile with screen reader | regions named, status announced, zero serious axe issues |

## Acceptance criteria

- All tests T01 to T13 pass in CI.
- No card ever shows accepted or closed unless a verified owning-module statement exists locally.
- A relay database dump after test traffic contains no card or offer data.

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
