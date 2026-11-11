# PS-063-05 — Authorization and capabilities: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-05.R01** Vault policy lets only the unlocked local principal post cards, and only for records where it is a party and in threads where it participates.
- **PS-063-05.R02** Inbound cards are accepted only when signed by a key of a party of the referenced record; other signers lead to the unverified state.
- **PS-063-05.R03** Cards have no relay-side resource; relays only carry the encrypted message and hold no card data.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| comms.offer_card.post | local principal | vault policy; party of the referenced record; participant(thread); thread active |
| comms.offer_card.read | local principal | participant(thread) |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T07 | abuse | PS-063-05.R01, PS-063-05.R02, PS-063-05.R03, PS-063-09.R03 | stranger posts card for B's offer; card signed by non-party; relay operator inspects stored data | quarantined unverified with no actions; relay holds no card data |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
