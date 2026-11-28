# PS-008-07 — Privacy, retention and abuse: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-07.R01** Quantities and holders are P2 and never appear in public projections, relay indexes or notification payloads; the public sees only in stock or out of stock.
- **PS-008-07.R02** Reservation statements travel only as end-to-end encrypted envelopes to the listed audience (PRV-5).
- **PS-008-07.R03** Holds are retained RET-EVIDENCE when linked to a deal or cycle; other holds follow RET-STANDARD purge with the listing.
- **PS-008-07.R04** The module registers ExportSectionPort, DeletionPort and RetentionPurgePort with F10 (N6), annotates every InventoryItem, InventoryHold and PeerReservation field with its F10.S02.M02 class, and pseudonymizes the deleted principal in retained evidence on privacy.deletion.completed.

## Specification

**Data classification**
- InventoryItem and InventoryHold: P2 in the owner's vault; field classes annotated per F10.S02.M02.
- Reservation and release statements: P2, encrypted to audience, signed by the owner key.
- PeerReservation: P2 evidence in the audience member's vault.

**Retention**
- Holds with linkedDealId or holderType cycle: RET-EVIDENCE (2 years after last related activity), DIDs pseudonymized after principal deletion.
- Other terminal holds: RET-STANDARD, purged 30 days after the listing is deleted.
- PeerReservation: RET-EVIDENCE; quarantined statements RET-SHORT 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Hold hoarding to block a seller (denial of stock) | holds are created only by the seller's vault on its own decisions; buyers cannot create holds; limits of 500 active holds and 30 days life |
| T02 | Double promise of the last unit across two devices | allocationSeq in every reservation, F11.S02.M03 commitment conflict, frozen state checked synchronously by is_frozen (fail closed), conflict event and signed frozen release to each audience; no automatic conversion; signed statements make the conflict provable |
| T03 | Forged reservation or release statement shown to a buyer | verification against the author of the verified listing projection; releases must bind a stored reservationCid; unverified statements are quarantined and never rendered |
| T04 | Stock probing to infer sales volume | quantities are not published; check results to peers are boolean only via signed statements |
| T05 | Stale promise after the seller released early | signed release queued to the audience on every early release or freeze; the peer marks its copy released or frozen |

**Abuse controls**
- At most 200 hold commands per hour per vault.
- Cycle holds beyond 14 days ttl are refused; maximum lifetime 30 days.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T02 | unit | PS-008-01.R03, PS-008-07.R01 | read public projection and event payloads | no quantities or holder ids outside P2 events; projection has only in-stock boolean |
| TEST-PS-008-09.T08 | integration | PS-008-04.R03, PS-008-07.R02 | reservation travels via relay mailbox | relay sees ciphertext and routing metadata only; no network call from hold/release/convert |
| TEST-PS-008-09.T13 | integration | PS-008-07.R03 | deal completed event then listing deleted | hold converted once; evidence kept per class; non-converted holds removed |
| TEST-PS-008-09.T24 | integration | PS-008-07.R04 | export sections, deletion plan, retention purge, then privacy.deletion.completed | sections present with field classes; buyer DID pseudonymized in retained evidence holds and peer reservations |

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M02, F11.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
