# PS-063-07 — Privacy, retention and abuse: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-07.R01** Cards are P2 and travel only inside end-to-end encrypted messages; relays never see card content or amounts.
- **PS-063-07.R02** Cards never include P3 data such as exact addresses and never include payment instructions.
- **PS-063-07.R03** Spoofed cards are contained by signature, key status and role verification, unverified cards expose no actions, and every amount, item and term is rendered from the verified referenced revision, so a poster cannot show a different amount than the signed record.
- **PS-063-07.R04** Privacy duties (N6): fields are classified per F10.S02.M02 and ExportSectionPort, DeletionPort and RetentionPurgePort are registered with F10.

## Specification

**Data classification**
- ThreadOfferCard: P2, visible to thread participants; poster note limited to 280 characters.

**Retention**
- Cards follow the thread: RET-STANDARD, purged locally with the thread.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Forged card showing a fake accepted offer | card state derives only from verified owning-module statements; card statement alone never sets closed or accepted |
| T02 | Card pinned to one revision but shown as the current deal | revision cid is displayed in the details sheet and superseding cards are marked; actions apply to the live record only |
| T03 | Phishing text inside the poster note | note is plain text under the label poster note, links are not rendered as links, max 280 characters |
| T04 | Card spam in a thread | receiving vaults keep at most 50 waiting cards per thread and poster and the local block applies; the 20 per day poster limit is a UX guard |
| T05 | Poster shows a different amount than the signed offer | amounts and items are rendered from the verified pinned revision through the owning module's renderer; the poster note never holds money fields |
| T06 | Burying the real card under an unverifiable card with a higher revision | only cards that reached posted, or owning-module revision events, supersede |

**Abuse controls**
- Recipient can report a card; the report carries the card statement and referenced statement (F12.S01.M01).
- Unverified cards are collapsed by default.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T07 | abuse | PS-063-05.R01, PS-063-05.R02, PS-063-05.R03, PS-063-07.R01, PS-063-09.R03 | X posts a card for B's offer; card signed by a non-party; relay operator inspects stored data | quarantined unverified with no actions; relay holds no card data |
| TEST-PS-063-09.T09 | abuse | PS-063-07.R02, PS-063-07.R03 | poster note with link text and an address-like string; 21st card in a day; 51 waiting cards from one poster | links not rendered, no P3 fields accepted, RATE_LIMITED as UX guard, 51st waiting card dropped |
| TEST-PS-063-09.T14 | abuse | PS-063-01.R02, PS-063-07.R03 | B posts a card for O (500 EUR) whose poster note says 50 EUR | S's vault shows 500 EUR from the verified offer and the 50 EUR text only under poster note |
| TEST-PS-063-09.T18 | integration | PS-063-04.R05, PS-063-07.R04 | account deletion with cards in two threads | DeletionPort plan lists the cards, execute purges them with their threads; export section comms.offer_cards present beforehand |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F01.S04.M02, F02.S01.M01, F02.S01.M04, F07.S02.M02, F16.S02.M02, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
