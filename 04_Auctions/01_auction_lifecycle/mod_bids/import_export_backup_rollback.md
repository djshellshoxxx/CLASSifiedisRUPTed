# PS-033-10 — Import, export, backup and rollback: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-10.R01** The bidder's vault export contains their bids, receipts and own maxima; it does not contain other bidders' data.
- **PS-033-10.R02** Import verifies receipt signatures and chain hashes against the stored host key; failures are kept as read-only history with a warning.
- **PS-033-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section auctions.bids in classrup-export/v1; one line per own Bid with bid, receipt, retraction and bid_outbid envelopes; the host's ledger export for sellers contains aliases and amounts only.
- **import:** Closed-auction bids import as history; bids on auctions still open import read-only until the host confirms its state; submitted bids without a receipt import as not_placed; no bid is ever re-sent on import.
- **backup:** The vault export is the primary backup (IOX-6); the host uses relay SQLite backup (IOX-3, IOX-7) and restoring it must keep the hash chain intact, verified by a post-restore chain check.
- **migration rollback:** Additive optional fields only in v1; the ledger hash input (including bidCid) is frozen for v1 so rollback never breaks chain verification.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T15 | integration | PS-033-10.R01, PS-033-10.R02, PS-033-10.R03 | export bidder vault, import into fresh vault, check the ledger against held receipts | receipts round-trip; verify_ledger consistent with receipts; tampered receipt detected at its seq |

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
