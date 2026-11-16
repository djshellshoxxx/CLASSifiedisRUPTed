# PS-033-06 — Failure recovery and idempotency: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-06.R01** Bids are idempotent by (bidder, auction, clientNonce) for 24 h on the host; replays return the original receipt.
- **PS-033-06.R02** All bids of one auction are serialized by the per-auction lease (IDM-8) with a fencing token; ledger append, price projection and soft-close decision commit in one SQLite transaction.
- **PS-033-06.R03** A crash before commit leaves no ledger entry and no receipt; a crash after commit and before reply is repaired by receipt fetch.

## Specification

- **idempotency:** Host stores (bidderId, auctionId, clientNonce) -> receiptCid for 24 h; replay with the same body returns the same receipt; a different body with the same nonce returns IDEMPOTENCY_KEY_REUSED.
- **concurrency:** Lease row auctions_lease with fencing token, TTL 5 s, taken with BEGIN IMMEDIATE; a holder that exceeds TTL loses the lease and its fence token is refused by later writes; the unique index on (auction, seq) prevents duplicate sequence numbers even under a bug.
- **retries:** Bidder vault retries only network errors and RATE_LIMITED with the same nonce at 1 s, 2 s, 4 s up to 3 attempts; business rejections are never retried; the receipt-fetch fallback runs at 5 s, 15 s and 45 s.
- **offline:** Bidding and retraction are disabled offline with a visible reason because order and time are decided by the host; viewing history and verifying held receipts works offline.
- **partial failure:** If the soft-close port (F04.S02.M02) or the eligibility port (F04.S02.M01) fails, the bid is rejected with DEPENDENCY_UNAVAILABLE and nothing is stored; the bid transaction is atomic.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T06 | integration | PS-033-06.R02, PS-033-04.R02 | 20 bids submitted concurrently from 20 vaults to one auction | seq 1..20 without gaps or duplicates, one winning, lease wait metric recorded |
| TEST-PS-033-09.T07 | chaos | PS-033-06.R02, PS-033-06.R03, PS-033-09.R03 | lease expires mid-transaction; process killed before reply | stale fence refused; no half-written entry; receipt fetch by bid cid succeeds |
| TEST-PS-033-09.T09 | integration | PS-033-04.R03, PS-033-06.R01 | replay same bid body and replay same nonce with different body | original receipt; IDEMPOTENCY_KEY_REUSED |

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
