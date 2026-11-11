# PS-033-07 — Privacy, retention and abuse: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-07.R01** Proxy maxima, bidder keys and nonces never appear in public projections, logs, errors or other users' exports, and maxima never in events; the host holds them, received only inside envelopes encrypted to hostKeyId, and the UI says so.
- **PS-033-07.R02** Aliases are stable only within one auction and derived under a per-auction host secret, so they cannot be linked across auctions; this is pseudonymity, not anonymity, because the host sees keys.
- **PS-033-07.R03** Bid spam, probing of proxy maxima and rapid retract abuse are limited by increments, rate limits, a single retraction and host quotas.
- **PS-033-07.R04** The module registers ExportSectionPort (section auctions.bids), DeletionPort and RetentionPurgePort with F10 (N6), annotates Bid fields with their F10.S02.M02 class (maxAmount, bidderId and clientNonce P3 in the vault and P2 with the host as the only listed participant), consumes privacy.deletion.completed, and sets pushOptIn only after privacy.consent.check(notify_push) for the host is granted.

## Specification

**Data classification**
- Bid (bidder vault): maxAmount, bidderId and clientNonce P3; receipts P2.
- Bid (host copy): maxAmount, bidderId and clientNonce P2 with the host as the only listed participant, received only inside the bid envelope E2E-encrypted to hostKeyId (PRV-5) and kept under the host's published retention; public projection P0 (alias, amount, kind, host time, hash).
- Bid receipt, retraction receipt and bid_outbid: P2 host-signed statements delivered end-to-end encrypted to the bidder.
- Seller copy of a bid_receipt: P2 host-signed statement end-to-end encrypted to the seller; alias, amount, price, seq and bidCount only, no bidder key, nonce or maximum.
- Relay receipt: classrup.platform.relay_receipt/v1 binding the destination and the digest of the request bytes; no cid, amount or bidder key.

**Retention**
- Bids and receipts: RET-EVIDENCE (2 years) in the bidder vault; the host keeps the ledger for its published retention, default 90 days after close; idempotency records RET-SHORT (24 h).
- On account deletion: bidderId in retained bids and receipts is replaced with a per-deletion pseudonym.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Host reorders, omits or inserts bids | the hash chain over bidCid and host-signed receipts let a bidder detect omission or reordering of their own bids, and nothing more; entries inserted under fresh aliases, and different chains shown to different bidders, are not detectable without comparing ledger heads with other bidders, and the host trust panel says so; verify_ledger reports consistent with your receipts, never verified |
| T02 | Probing for a proxy maximum by incremental bids | each probe is a real bid at a real increment, per-minute and per-auction bid limits, shill heuristics flag probe patterns |
| T03 | Replay of a captured bid | the idempotency lookup by clientNonce returns the original receipt or IDEMPOTENCY_KEY_REUSED, the signed notAfter ends validity 60 s after the bid, and host acceptance is bound to the terms cid |
| T04 | Retract-and-rebid to manipulate price | one retraction per bidder per auction, 12 h cutoff, retraction only of the leading bid, recorded in the ledger |
| T05 | Alias deanonymization across auctions | per-auction HMAC secret held by the host; documented that the host can link keys |
| T06 | Delayed or withheld bid placed later by the host or by slow transport | signed notAfter; the host refuses with EXPIRED after it; the vault shows not placed after notAfter plus 45 s; a receipt with hostTime after notAfter is rejected with AUCTIONS_RECEIPT_INVALID and kept as evidence |
| T07 | Seller revokes a linked key and bids with it | revoked keys are rejected with the generic AUCTIONS_BIDDER_NOT_ELIGIBLE and F04.S02.M01 keeps revoked keys linked to the seller |

**Abuse controls**
- 10 bids per minute per bidder per auction and 200 per auction through RateLimitPort.consume (F12.S03.M03, N18); host-wide relay quota per key.
- bids_per_day account limit through the in-process F12.S03.M04 moderation.accountlimit.check (N18) - 20, 100 or 500 bids per day by tier on the host.
- Probe and retract patterns reach F04.S02.M01 scoring through the host-local auctions.bid.placed and auctions.bid.retracted events.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T11 | abuse | PS-033-07.R03 | 11 bids in a minute; probing pattern of 5 minimum raises against one leader; seller bids | 11th AUCTIONS_BID_LIMIT through RateLimitPort; probing passed to scoring; seller AUCTIONS_BIDDER_NOT_ELIGIBLE with no detail |
| TEST-PS-033-09.T12 | integration | PS-033-01.R02, PS-033-07.R01 | inspect events, logs, errors, exports of other users and the F10.S02.M02 classification map | no maximum, bidder key or nonce anywhere outside the bidder vault and the host; the three fields annotated P3 in the vault and P2 with the host as only participant; the bid envelope part is encrypted to hostKeyId |
| TEST-PS-033-09.T19 | integration | PS-033-07.R02 | one bidder bids on auctions A and A2 on the same host | the two aliases differ and cannot be matched without the per-auction host secrets |
| TEST-PS-033-09.T23 | integration | PS-033-07.R04 | export, account deletion and push consent withdrawn | section auctions.bids present; bidderId pseudonymized; pushOptIn false and no host push |
| TEST-PS-033-09.T24 | abuse | PS-033-05.R02, PS-033-07.R01 | a key revoked by a device revocation statement the host holds signs a bid | AUCTIONS_BIDDER_NOT_ELIGIBLE with no detail |
| TEST-PS-033-09.T26 | abuse | PS-033-02.R01, PS-033-07.R03 | a key of tier new places its 21st bid of the day across auctions on host H; the limits check stub fails | MODERATION_ACCOUNT_LIMIT_REACHED with params.resetsAt from the in-process F12.S03.M04 check after RateLimitPort.consume; the failing stub gives DEPENDENCY_UNAVAILABLE; nothing stored |

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F12.S03.M04, F13.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
