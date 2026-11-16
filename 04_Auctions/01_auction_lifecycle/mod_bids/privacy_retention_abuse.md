# PS-033-07 — Privacy, retention and abuse: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-07.R01** Proxy maxima and bidder keys never appear in events, public projections, logs, errors or other users' exports; the host holds them in plaintext and the UI says so.
- **PS-033-07.R02** Aliases are stable only within one auction and derived under a per-auction host secret, so they cannot be linked across auctions; this is pseudonymity, not anonymity, because the host sees keys.
- **PS-033-07.R03** Bid spam, probing of proxy maxima and rapid retract abuse are limited by increments, rate limits, a single retraction and host quotas.

## Specification

**Data classification**
- Bid: P3 (maxAmount, bidderId, nonce); public projection P0 (alias, amount, kind, host time, hash).
- Bid receipt: P2 signed statement held by the bidder.

**Retention**
- Bids and receipts: RET-EVIDENCE (2 years) in the bidder vault; the host keeps the ledger for its published retention, default 90 days after close.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Host reorders, omits or inserts bids | hash-chained ledger and host-signed receipts; bidders verify their own receipts against the public chain and publish evidence; trust in the host remains and is disclosed |
| T02 | Probing for a proxy maximum by incremental bids | each probe is a real bid at a real increment, per-minute and per-auction bid limits, shill heuristics flag probe patterns |
| T03 | Replay of a captured bid | clientNonce uniqueness per bidder and auction, host acceptance bound to terms cid, 24 h idempotency record |
| T04 | Retract-and-rebid to manipulate price | one retraction per bidder per auction, 12 h cutoff, retraction only of the leading bid, recorded in the ledger |
| T05 | Alias deanonymization across auctions | per-auction HMAC secret held by the host; documented that the host can link keys |

**Abuse controls**
- 10 bids per minute per bidder per auction and 200 per auction; host-wide relay quota per key.
- Probe and retract patterns are passed to F04.S02.M01 scoring via the bid.placed event on the host.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T11 | abuse | PS-033-07.R01, PS-033-07.R02, PS-033-07.R03 | 11 bids in a minute; probing pattern of 5 minimum raises against one leader; seller bids | 11th AUCTIONS_BID_LIMIT; probing passed to scoring; seller AUCTIONS_BIDDER_NOT_ELIGIBLE with no detail |
| TEST-PS-033-09.T12 | integration | PS-033-01.R02, PS-033-07.R01 | inspect events, logs, errors, exports of other users | no maximum and no bidder key anywhere outside bidder vault and host |

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
