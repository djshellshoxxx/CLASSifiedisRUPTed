# PS-033-02 — Validation rules: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-02.R01** The host first looks up (bidder, auction, clientNonce) in the idempotency store - the same body returns the stored receipt and a different body returns IDEMPOTENCY_KEY_REUSED - and then validates in a fixed order - schema, signature, host acceptance, validity window, auction state and host time, minimum or max-only rule, eligibility and revoked keys, rate limits - and the first failure decides the error.
- **PS-033-02.R02** The bidder vault performs the same checks it can (schema, host acceptance, block check, minimum from the last known state) before sending, but only the host decision counts.
- **PS-033-02.R03** Every violation maps to one stable error code; eligibility failures never reveal the linkage that caused them.
- **PS-033-02.R04** Proxy resolution follows the numbered rules PX1 to PX5 (proxy-v1) below, which are the reference model for the property tests and for ledger replay.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | bid contains hostAck naming this auction termsCid and the host key | AUCTIONS_HOST_NOT_ACCEPTED |
| V02 | bid signature verifies against bidderId (nonce replay is decided by the idempotency lookup before validation) | VALIDATION_FAILED |
| V03 | auction status is open and host time is before currentEndsAt | AUCTIONS_NOT_OPEN |
| V04 | a bid with a visible amount has amount at least startPrice when no bid exists, otherwise currentPrice plus the increment of the tier containing currentPrice; a max-only update is exempt | AUCTIONS_BID_TOO_LOW |
| V05 | maxAmount, when present, is at least amount when amount is present, in the auction currency and within limits; a max-only update carries maxAmount | VALIDATION_FAILED |
| V06 | a new maxAmount for a bidder who already has a maximum is not lower than it | AUCTIONS_MAX_DECREASE |
| V07 | F04.S02.M01 check returns allow for the bidder, including that the host knows no revocation of the bidder key | AUCTIONS_BIDDER_NOT_ELIGIBLE |
| V08 | RateLimitPort.consume (F12.S03.M03) allows the bid - at most 10 bids per minute per bidder per auction, 200 bids per bidder per auction, and 5 000 entries per auction | AUCTIONS_BID_LIMIT |
| V09 | retraction is requested more than 12 hours before currentEndsAt, is the bidder's first retraction on this auction, and targets the bidder's winning bid | AUCTIONS_RETRACT_NOT_ALLOWED |
| V10 | host time is at or before the signed notAfter, and notAfter is at most 60 s after createdAtClaim | EXPIRED |
| V11 | a max-only update (kind proxy, amount absent) comes from the current leader | CONFLICT_STATE |
| V12 | bidder vault only - the local principal and the seller are not blocked either way (F07.S02.M02 isBlockedEither) | BLOCKED_PARTY |
| V13 | host statements (bid_receipt, retraction_receipt, bid_outbid) verify against hostKeyId in the terms, bind this auction and bidCid, and carry hostTime at or before the bid's notAfter | AUCTIONS_RECEIPT_INVALID |

Proxy rules proxy-v1 (normative; applied only by the host inside the lease; the reference model of T03, T04 and T17). PX1 - a bidder's effective maximum is the larger of their highest accepted visible amount and their latest maxAmount; maxima never decrease (V06). PX2 - the leader is the bidder with the highest effective maximum; equal maxima go to the bidder who held that maximum first in host order (the lower seq of the entries that set them), so an existing leader keeps the lead against a new bid with the same maximum. PX3 - the visible price is max(leaderFloor, min(leaderMax, challengerMax + increment of the tier containing challengerMax)), where leaderFloor is the leader's highest accepted visible amount and challengerMax is the highest effective maximum of any other bidder; with no challenger the price is leaderFloor. PX4 (reserve rule) - when leaderMax >= reservePrice > the PX3 price, the price becomes min(leaderMax, max(reservePrice, challengerMax + increment)), and reservePrice alone when there is no challenger; a price set equal to reservePrice reveals the reserve, which the trust panel states (F04.S01.M01 07.R01). PX5 (ledger effect) - an accepted bid with a visible amount appends its own entry; when the resulting price or leader differs from that entry the host appends one auto entry for the leader's alias at the new price; a max-only update appends nothing unless PX4 changes the price, then one auto entry; a retraction appends a retraction entry followed by one auto entry for the recomputed leader and price with all amounts and the maximum of the retracting bidder excluded.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T01 | unit | PS-033-01.R01, PS-033-01.R03, PS-033-01.R04, PS-033-02.R01, PS-033-02.R03 | place valid bid and read ledger entry | seq 1, hash chain starts with genesis and covers bidCid, amount immutable, receipt signature verifies |
| TEST-PS-033-09.T02 | unit | PS-033-02.R02, PS-033-02.R03 | each rule V01–V13 violated in turn | documented code returned, no ledger entry, no maximum echoed |
| TEST-PS-033-09.T03 | property | PS-033-03.R02, PS-033-02.R04 | random bid, max-only and retraction sequences, with and without a reserve, compared with the proxy-v1 reference model (PX1–PX5) | price, leader and aliases equal the model; replaying the ledger reproduces the same result |
| TEST-PS-033-09.T04 | unit | PS-033-03.R03, PS-033-02.R04 | B3 bids 1000 max 4000, B2 bids 1050 max 6000, B1 bids 5100 max 10000, then B1 retracts | B2 leads at 5000 after its bid (PX3 gives 4050, the reserve rule PX4 lifts it to 5000); B1 leads at 6100; after the retraction B2 is winning at 5000 again; retraction and auto entries appended; hashes stay chained |
| TEST-PS-033-09.T09 | integration | PS-033-06.R01, PS-033-02.R01 | replay same bid body and replay same nonce with different body | original receipt; IDEMPOTENCY_KEY_REUSED from the lookup before validation, never VALIDATION_FAILED |
| TEST-PS-033-09.T17 | unit | PS-033-02.R04, PS-033-03.R02 | ties, max-only updates and the reserve rule - B1 and B2 with equal maxima 2000; the leader raises its maximum with amount absent; sole bidder max 8000 with reserve 5000 | tie keeps the earlier leader at 2000; the max-only update is exempt from V04, needs the leader (V11) and appends no entry; the reserve rule appends one auto entry at 5000 |

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
