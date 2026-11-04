# PS-035-10 — Import, export, backup and rollback: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-10.R01** The seller's vault export contains their auctions, signed terms, host acceptances and the encrypted reserve; the reserve appears in no other user's export.
- **PS-035-10.R02** Import verifies signatures and cids; auctions that were open on import are marked needs host check and re-verified with the host before being shown as open.
- **PS-035-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section auctions.auctions in classrup-export/v1 with Auction lines and the original terms and host_acceptance envelopes; reservePrice included only in the seller's own export.
- **import:** Closed and cancelled auctions import as history; scheduled and open auctions import as proposed with needs host check until the host confirms its state; unknown host keys are kept as read-only history.
- **backup:** The vault export is the primary backup (IOX-6); the host relay uses relay SQLite backup (IOX-3, IOX-7) and holds only auction operational data.
- **migration rollback:** Additive optional fields only in v1; rollback is safe because signed statements are immutable and older readers ignore unknown fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T14 | integration | PS-035-10.R01, PS-035-10.R02, PS-035-10.R03 | export, import into fresh vault, restore host from backup | auctions round-trip; reserve stays out of other exports; host restore keeps scheduled auctions |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
