# PS-063-09 — Contract and acceptance tests: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-063-09.R02** Contract tests check command input and output, the signed statement and event payload against the schema registry.
- **PS-063-09.R03** Role and hash verification are covered by adversarial fixtures.
- **PS-063-09.R04** Screens meet CTR-UX-001 (WCAG 2.2 AA, 44 px targets, explicit async states, polite announcements) and the a11y items listed for this module.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults S (seller) and B (buyer) with thread TH, bazaar offer O revision 1 (amount 500 EUR) signed by B and held by both, negotiation N rooted at O, mutiny proposal P revision 2, stranger X, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T01 | unit | PS-063-01.R01, PS-063-01.R02, PS-063-01.R03, PS-063-02.R01 | B posts a card for offer O revision 1 with a poster note | card stored posted with refRevisionHash equal to the ID-3 cid of JCS of O revision 1; note at most 280 characters labelled poster note; amount rendered from O |
| TEST-PS-063-09.T02 | unit | PS-063-02.R02, PS-063-02.R03 | each rule V01 to V09 violated in turn | documented error code returned and nothing stored |
| TEST-PS-063-09.T03 | property | PS-063-03.R01, PS-063-03.R02 | random sequences of owning-module events and card posts | transitions only as declared; closed, superseded and unverified never change; closed only follows verified terminal events |
| TEST-PS-063-09.T04 | integration | PS-063-03.R03 | card arrives before its referenced offer statement; statement arrives on day 3, another card never arrives for 7 days | first becomes posted, second becomes unverified |
| TEST-PS-063-09.T05 | contract | PS-063-04.R01, PS-063-04.R02, PS-063-09.R02 | post and list execute | output, statement and event payload validate against registry schemas |
| TEST-PS-063-09.T06 | integration | PS-063-04.R03 | deliver offer accepted, negotiation countered, negotiation closed with timeout, proposal revised and thread archived events | cards become closed, superseded, closed with expired, superseded and frozen read-only respectively |
| TEST-PS-063-09.T07 | abuse | PS-063-05.R01, PS-063-05.R02, PS-063-05.R03, PS-063-07.R01, PS-063-09.R03 | X posts a card for B's offer; card signed by a non-party; relay operator inspects stored data | quarantined unverified with no actions; relay holds no card data |
| TEST-PS-063-09.T08 | integration | PS-063-06.R01, PS-063-06.R02, PS-063-06.R03 | post twice, replay inbound statement three times, and kill the app before message delivery | single card, one event per origin, card remains with prepared delivery state |
| TEST-PS-063-09.T09 | abuse | PS-063-07.R02, PS-063-07.R03 | poster note with link text and an address-like string; 21st card in a day; 51 waiting cards from one poster | links not rendered, no P3 fields accepted, RATE_LIMITED as UX guard, 51st waiting card dropped |
| TEST-PS-063-09.T10 | load | PS-063-08.R01, PS-063-08.R02, PS-063-08.R03 | thread with 50 cards and 500 events replayed | budgets met |
| TEST-PS-063-09.T11 | unit | PS-063-09.R01 | traceability tool run | every PS-063 requirement maps to a passing test |
| TEST-PS-063-09.T12 | integration | PS-063-10.R01, PS-063-10.R02, PS-063-10.R03 | export, import into fresh vault, restore from backup | cards round trip; cards whose record is missing import as unverified |
| TEST-PS-063-09.T13 | a11y | PS-063-09.R04 | thread with all card states on mobile with screen reader | regions named, status announced, targets ≥ 44 px, zero serious axe issues |
| TEST-PS-063-09.T14 | abuse | PS-063-01.R02, PS-063-07.R03 | B posts a card for O (500 EUR) whose poster note says 50 EUR | S's vault shows 500 EUR from the verified offer and the 50 EUR text only under poster note |
| TEST-PS-063-09.T15 | abuse | PS-063-03.R04 | after a verified card for O revision 1, a card for revision 2 arrives whose referenced statement never verifies | the revision 1 card stays posted; the new card ends unverified and supersedes nothing |
| TEST-PS-063-09.T16 | integration | PS-063-03.R04, PS-063-04.R03 | mutiny.proposal.withdrawn and mutiny.revision.forked for P | P cards close with reason withdrawn, or freeze without actions and later close or are superseded when the owning module resolves |
| TEST-PS-063-09.T17 | unit | PS-063-04.R04, PS-063-04.R03 | bazaar.negotiation.countered for N without rootOfferId; registry lookup for classrup.comms.offer_card/v1 | rootOfferId resolved through bazaar.negotiation.get and the O card superseded; registry entry lists signer role party of the referenced record |
| TEST-PS-063-09.T18 | integration | PS-063-04.R05, PS-063-07.R04 | account deletion with cards in two threads | DeletionPort plan lists the cards, execute purges them with their threads; export section comms.offer_cards present beforehand |

## Acceptance criteria

- All tests T01 to T18 pass in CI.
- No card ever shows accepted or closed unless a verified owning-module statement exists locally, and no card shows an amount that differs from its verified referenced revision.
- A relay database dump after test traffic contains no card or offer data.

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F01.S04.M02, F02.S01.M01, F02.S01.M04, F07.S02.M02, F16.S02.M02, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
