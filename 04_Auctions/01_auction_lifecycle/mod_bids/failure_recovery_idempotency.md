# PS-033-06 — Failure recovery and idempotency: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-06.R01** Bids are idempotent by (bidder, auction, clientNonce) for 24 h on the host, looked up before validation; a replay with the same body returns the original receipt and a different body returns IDEMPOTENCY_KEY_REUSED.
- **PS-033-06.R02** All bids of one auction are serialized by the per-auction lease (IDM-8) with a fencing token; ledger append, price projection and soft-close decision commit in one SQLite transaction.
- **PS-033-06.R03** A crash before commit leaves no ledger entry and no receipt; a crash after commit and before reply is repaired by receipt fetch.
- **PS-033-06.R04** A signed bid is valid only until its notAfter (at most 60 s after the bidder's createdAt claim), so neither the host nor delayed transport can place it later, and a bid with no receipt resolves to not_placed.
- **PS-033-06.R05** After a host restore this module's AuctionHostPort implementation freezes, before the restored relay accepts a bid, every hosted auction whose bids may lie in the announced lost window, so the host never assigns a sequence number that a receipt it signed before the restore already holds; bidders keep their receipts and relay receipts as evidence.

## Specification

- **idempotency:** Host stores (bidderId, auctionId, clientNonce) -> receiptCid for 24 h and looks it up before V02; replay with the same body returns the same receipt; a different body with the same nonce returns IDEMPOTENCY_KEY_REUSED; retractions dedupe on retraction cid; receive dedupes on statement cid.
- **concurrency:** Lease row auctions_lease with fencing token, TTL 5 s, taken with BEGIN IMMEDIATE; a holder that exceeds TTL loses the lease and its fence token is refused by later writes; the unique index on (auction, seq) prevents duplicate sequence numbers even under a bug. The lease is local to the host (IDM-8); no lock spans vaults.
- **retries:** Bidder vault retries only network errors and RATE_LIMITED with the same nonce at 1 s, 2 s, 4 s up to 3 attempts and never after notAfter; business rejections are never retried; the receipt-fetch fallback runs at 5 s, 15 s and 45 s.
- **offline:** Bidding and retraction are disabled offline with a visible reason because order and time are decided by the host; viewing history and checking held receipts works offline.
- **partial failure:** If the soft-close port (F04.S02.M02) fails, or the eligibility port (F04.S02.M01) cannot run the seller-key equality check (port unreachable or host data unreadable), the bid is rejected with DEPENDENCY_UNAVAILABLE and nothing is stored. Stale F07 linkage data is not a port failure - the eligibility port uses its cache while it is at most 24 h old, and beyond that allows the bid while flagging linkage_stale for review, per F04.S02.M01. If the F12.S03.M04 limits check cannot answer, the bid is rejected with DEPENDENCY_UNAVAILABLE. The bid transaction is atomic.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T06 | integration | PS-033-06.R02, PS-033-04.R02 | 20 bids submitted concurrently from 20 vaults to one auction | seq 1..20 without gaps or duplicates, one winning, lease wait metric recorded |
| TEST-PS-033-09.T07 | chaos | PS-033-06.R02, PS-033-06.R03, PS-033-09.R03 | lease expires mid-transaction; process killed before reply; eligibility port unreachable; F07 linkage cache 25 h old | stale fence refused; no half-written entry; receipt fetch by bid cid succeeds; unreachable port rejects the bid with DEPENDENCY_UNAVAILABLE and stores nothing; stale linkage accepts the bid and F04.S02.M01 records a linkage_stale flag |
| TEST-PS-033-09.T09 | integration | PS-033-06.R01, PS-033-02.R01 | replay same bid body and replay same nonce with different body | original receipt; IDEMPOTENCY_KEY_REUSED from the lookup before validation, never VALIDATION_FAILED |
| TEST-PS-033-09.T18 | integration | PS-033-06.R04 | bid delivered to the host after notAfter; receipt lost and never fetched; host receipt with hostTime after notAfter | EXPIRED from the host; the vault shows not_placed after notAfter plus 45 s; the late receipt is rejected with AUCTIONS_RECEIPT_INVALID |
| TEST-PS-033-09.T29 | integration | PS-033-06.R05 | restore host H from a backup whose lost window covers bids on open auction A and starts after auction B closed; bidder B1 holds a receipt for seq 9 that the restored ledger lacks | freeze_activity freezes A only, before the port opens; a new bid on A gets AUCTIONS_NOT_OPEN and no seq is assigned again; the vault of B1 shows A frozen and its bid possibly lost |

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F12.S03.M04, F13.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
