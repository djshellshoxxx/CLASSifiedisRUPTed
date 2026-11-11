# PS-008-07 — Privacy, retention and abuse: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-07.R01** Quantities and holders are P2 and never appear in public projections, relay indexes or notification payloads; the public sees only in stock or out of stock.
- **PS-008-07.R02** Reservation statements travel only as end-to-end encrypted envelopes to the listed audience (PRV-5).
- **PS-008-07.R03** Holds are retained RET-EVIDENCE when linked to a deal or cycle; other holds follow RET-STANDARD purge with the listing.

## Specification

**Data classification**
- InventoryItem and InventoryHold: P2 in the owner's vault.
- Reservation statement: P2, encrypted to audience, signed by the owner key.

**Retention**
- Holds with linkedDealId or holderType cycle: RET-EVIDENCE (2 years after last related activity).
- Other terminal holds: RET-STANDARD, purged 30 days after the listing is deleted.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Hold hoarding to block a seller (denial of stock) | holds are created only by the seller's vault on its own decisions; buyers cannot create holds; limits of 500 active holds and 30 days life |
| T02 | Double promise of the last unit across two devices | frozen state and conflict event; no automatic conversion; signed statements make the conflict provable |
| T03 | Forged reservation statement shown to a buyer | verification of the listing owner's key; unverified statements are quarantined and never rendered as reservations |
| T04 | Stock probing to infer sales volume | quantities are not published; check results to peers are boolean only via signed statements |

**Abuse controls**
- At most 200 hold commands per hour per vault.
- Cycle holds beyond 14 days ttl are refused; maximum lifetime 30 days.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T02 | unit | PS-008-01.R03, PS-008-07.R01 | read public projection and event payloads | no quantities or holder ids outside P2 events; projection has only in-stock boolean |
| TEST-PS-008-09.T08 | integration | PS-008-04.R03, PS-008-07.R03 | reservation travels via relay mailbox | relay sees ciphertext and routing metadata only; no network call from hold/release/convert |
| TEST-PS-008-09.T13 | integration | PS-008-07.R02 | deal completed event then listing deleted | hold converted once; evidence kept per class; non-converted holds removed |
| TEST-PS-008-09.T14 | abuse | PS-008-07.R01, PS-008-07.R03 | 201 hold commands in one hour | 201st returns RATE_LIMITED; holds above 14 d ttl refused |

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
