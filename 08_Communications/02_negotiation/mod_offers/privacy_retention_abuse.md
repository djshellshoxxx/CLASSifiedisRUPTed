# PS-063-07 — Privacy, retention and abuse: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-07.R01** Cards are P2 and travel only inside end-to-end encrypted messages; relays never see card content or amounts.
- **PS-063-07.R02** Cards never include P3 data such as exact addresses and never include payment instructions.
- **PS-063-07.R03** Spoofed cards are contained by signature and role verification, and unverified cards expose no actions.

## Specification

**Data classification**
- ThreadOfferCard: P2, visible to thread participants; snapshot text limited to 280 characters.

**Retention**
- Cards follow the thread: RET-STANDARD, purged locally with the thread.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Forged card showing a fake accepted offer | card state derives only from verified owning-module statements; card statement alone never sets closed or accepted |
| T02 | Card pinned to one revision but shown as the current deal | revision hash is displayed in the details sheet and superseding cards are marked; actions apply to the live record only |
| T03 | Phishing text inside snapshot | snapshot is plain text, links are not rendered as links, max 280 characters |
| T04 | Card spam in a thread | 20 cards per thread per day limit and local block |

**Abuse controls**
- Recipient can report a card; the report carries the card statement and referenced statement (F12.S01.M01).
- Unverified cards are collapsed by default.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T09 | abuse | PS-063-07.R01, PS-063-07.R02, PS-063-07.R03 | card with link text and address-like snapshot; 21st card in a day | links not rendered, no P3 fields accepted, RATE_LIMITED |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
