# PS-063-10 — Import, export, backup and rollback: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-10.R01** A user's vault export contains the cards of their threads including card statements and display state.
- **PS-063-10.R02** Import re-verifies card statements and references; cards whose referenced record is missing become unverified read-only history.
- **PS-063-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days; new card kinds are additive enum values.

## Specification

- **export:** Section comms.offer_cards in classrup-export/v1; one line per ThreadOfferCard (schema classrup.comms.offer_card/v1).
- **import:** Signature and hash are re-verified; existing IDs are skipped; displayState is recomputed from locally held owning-module statements.
- **backup:** The vault export is the backup (IOX-6); relays hold no card data.
- **migration rollback:** Additive fields and enum values only in v1; older readers show unknown kinds as unverified references; rollback is safe because card state is recomputed on load.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T12 | integration | PS-063-10.R01, PS-063-10.R02, PS-063-10.R03 | export, import into fresh vault, restore from backup | cards round trip; cards whose record is missing import as unverified |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
