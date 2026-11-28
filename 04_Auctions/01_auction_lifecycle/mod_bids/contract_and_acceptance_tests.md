# PS-033-09 — Contract and acceptance tests: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-033-09.R02** The proxy algorithm is covered by property tests on random bid sequences with a reference model, and the ledger by replay tests.
- **PS-033-09.R03** Concurrency is covered by deterministic tests with an injected clock and lease, including expiry and fencing.

## Specification

See the module test table below (all processes).

**Fixtures:** Host H with injectable clock and fixture increment table [{fromMinor 1000, incrementMinor 50}, {fromMinor 5000, incrementMinor 100}]; auction A (EUR, start 10.00, reserve 50.00, ends 2026-11-12T10:00:00Z); auction A2 on the same host; bidders B1, B2, B3 and seller S with separate keys; fixed clock 2026-11-05T12:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T01 | unit | PS-033-01.R01, PS-033-01.R03, PS-033-01.R04, PS-033-02.R01, PS-033-02.R03 | place valid bid and read ledger entry | seq 1, hash chain starts with genesis and covers bidCid, amount immutable, receipt signature verifies |
| TEST-PS-033-09.T02 | unit | PS-033-02.R02, PS-033-02.R03 | each rule V01–V14 violated in turn | documented code returned, no ledger entry, no maximum echoed |
| TEST-PS-033-09.T03 | property | PS-033-03.R02, PS-033-02.R04 | random bid, max-only and retraction sequences, with and without a reserve, compared with the proxy-v1 reference model (PX1–PX5) | price, leader and aliases equal the model; replaying the ledger reproduces the same result |
| TEST-PS-033-09.T04 | unit | PS-033-03.R03, PS-033-02.R04 | B3 bids 1000 max 4000, B2 bids 1050 max 6000, B1 bids 5100 max 10000, then B1 retracts | B2 leads at 5000 after its bid (PX3 gives 4050, the reserve rule PX4 lifts it to 5000); B1 leads at 6100; after the retraction B2 is winning at 5000 again; retraction and auto entries appended; hashes stay chained |
| TEST-PS-033-09.T05 | property | PS-033-03.R01, PS-033-03.R04 | random command sequences on one bid, including close with outcome unsold, close without a receipt, a won event naming another alias, and a void after won | only declared transitions succeed; the leader of an unsold auction becomes lost; submitted without receipt becomes lost; won becomes void on auctions.result.voided; terminal states never change |
| TEST-PS-033-09.T06 | integration | PS-033-06.R02, PS-033-04.R02 | 20 bids submitted concurrently from 20 vaults to one auction | seq 1..20 without gaps or duplicates, one winning, lease wait metric recorded |
| TEST-PS-033-09.T07 | chaos | PS-033-06.R02, PS-033-06.R03, PS-033-09.R03 | lease expires mid-transaction; process killed before reply; eligibility port unreachable; F07 linkage cache 25 h old | stale fence refused; no half-written entry; receipt fetch by bid cid succeeds; unreachable port rejects the bid with DEPENDENCY_UNAVAILABLE and stores nothing; stale linkage accepts the bid and F04.S02.M01 records a linkage_stale flag |
| TEST-PS-033-09.T08 | contract | PS-033-04.R01, PS-033-04.R02, PS-033-09.R02 | submit, place, retract, apply_retraction, receive and queries | statements, events and projections validate against registry schemas; projection has no key and no maximum; a receipt of an extending bid carries the extension envelope |
| TEST-PS-033-09.T09 | integration | PS-033-06.R01, PS-033-02.R01 | replay same bid body and replay same nonce with different body | original receipt; IDEMPOTENCY_KEY_REUSED from the lookup before validation, never VALIDATION_FAILED |
| TEST-PS-033-09.T10 | abuse | PS-033-05.R01, PS-033-05.R02, PS-033-05.R03 | bid signed by another key; bid without host acceptance; public query | VALIDATION_FAILED or AUCTIONS_HOST_NOT_ACCEPTED; public data contains aliases only |
| TEST-PS-033-09.T11 | abuse | PS-033-07.R03 | 11 bids in a minute; probing pattern of 5 minimum raises against one leader; seller bids | 11th AUCTIONS_BID_LIMIT through RateLimitPort; probing passed to scoring; seller AUCTIONS_BIDDER_NOT_ELIGIBLE with no detail |
| TEST-PS-033-09.T12 | integration | PS-033-01.R02, PS-033-07.R01 | inspect events, logs, errors, exports of other users and the F10.S02.M02 classification map | no maximum, bidder key or nonce anywhere outside the bidder vault and the host; the three fields annotated P3 in the vault and P2 with the host as only participant; the bid envelope part is encrypted to hostKeyId |
| TEST-PS-033-09.T13 | load | PS-033-08.R02, PS-033-08.R03 | 500 auctions at 50 bids per second and one hot auction at 20 per second for 5 minutes | p95 ≤ 150 ms, hot p99 ≤ 400 ms, ledger verify 5 000 entries ≤ 500 ms |
| TEST-PS-033-09.T14 | unit | PS-033-09.R01 | traceability tool run | every PS-033 requirement maps to a passing test |
| TEST-PS-033-09.T15 | integration | PS-033-10.R01, PS-033-10.R02, PS-033-10.R03 | export bidder vault, import into fresh vault, check the ledger against held receipts | receipts round-trip; verify_ledger consistent with receipts; tampered receipt detected at its seq |
| TEST-PS-033-09.T16 | e2e | PS-033-01.R02, PS-033-04.R03 | mobile bidder accepts host, bids with max, is outbid by proxy, retracts a leading bid on another auction, goes offline | UI statuses correct; trust panel states key visibility to the host, receipt limits and possible second-chance key disclosure; offline shows bidding disabled with no queue; axe zero serious issues |
| TEST-PS-033-09.T17 | unit | PS-033-02.R04, PS-033-03.R02 | ties, max-only updates and the reserve rule - B1 and B2 with equal maxima 2000; the leader raises its maximum with amount absent; sole bidder max 8000 with reserve 5000 | tie keeps the earlier leader at 2000; the max-only update is exempt from V04, needs the leader (V11) and appends no entry; the reserve rule appends one auto entry at 5000 |
| TEST-PS-033-09.T18 | integration | PS-033-06.R04 | bid delivered to the host after notAfter; receipt lost and never fetched; host receipt with hostTime after notAfter | EXPIRED from the host; the vault shows not_placed after notAfter plus 45 s; the late receipt is rejected with AUCTIONS_RECEIPT_INVALID |
| TEST-PS-033-09.T19 | integration | PS-033-07.R02 | one bidder bids on auctions A and A2 on the same host | the two aliases differ and cannot be matched without the per-auction host secrets |
| TEST-PS-033-09.T20 | e2e | PS-033-08.R01 | network capture of the PWA while bidding, retracting and checking receipts | requests go only to the auction host; zero telemetry or analytics requests |
| TEST-PS-033-09.T21 | contract | PS-033-04.R04 | F11.S01.M01 registry entries for the five statements; receipt signed by a key other than the host key in the terms | roles resolve as declared; quarantined with AUCTIONS_RECEIPT_INVALID |
| TEST-PS-033-09.T22 | integration | PS-033-04.R05, PS-033-04.R02 | B1 is outbid by B2's proxy | the host delivers bid_outbid to B1's mailbox and calls notify.notification.dispatch once with a template key only; B1's vault derives auctions.bid.outbid with actor.kind federated |
| TEST-PS-033-09.T23 | integration | PS-033-07.R04 | export, account deletion and push consent withdrawn | section auctions.bids present; bidderId pseudonymized; pushOptIn false and no host push |
| TEST-PS-033-09.T24 | abuse | PS-033-05.R02, PS-033-07.R01 | a key revoked by a classrup.security.keyrevocation/v1 statement the host holds signs a bid | AUCTIONS_BIDDER_NOT_ELIGIBLE with no detail |
| TEST-PS-033-09.T25 | integration | PS-033-03.R04 | host silent after the auction end | winning and outbid bids show host_silent after the deadline; a later result moves them to won or lost |
| TEST-PS-033-09.T26 | abuse | PS-033-02.R01, PS-033-07.R03 | a key of tier new places its 21st bid of the day across auctions on host H; the limits check stub fails | MODERATION_ACCOUNT_LIMIT_REACHED with params.resetsAt from the in-process F12.S03.M04 check after RateLimitPort.consume; the failing stub gives DEPENDENCY_UNAVAILABLE; nothing stored |
| TEST-PS-033-09.T27 | integration | PS-033-04.R06, PS-033-04.R02 | first bid and 30 more bids within 60 s on auction A; one seller copy replayed and one delivered out of order | the seller vault gets one copy at once and coalesced copies at most once per 60 s; it derives auctions.bid.placed with listingId, sellerId, seq and bidCount, without bidderId or bidId, actor.kind federated; the out-of-order copy is stored as history without an event; edit_lock answers locked |
| TEST-PS-033-09.T28 | contract | PS-033-04.R07 | place and apply_retraction responses; a replayed bid; a tampered relay receipt | each carries classrup.platform.relay_receipt/v1 with destination '<relayId>/auction/<auctionId>', digest over the request bytes and no cid; the replay returns the same relay receipt; the tampered one is rejected by the vault and the bid stays submitted until the host-signed receipt arrives |
| TEST-PS-033-09.T29 | integration | PS-033-06.R05 | restore host H from a backup whose lost window covers bids on open auction A and starts after auction B closed; bidder B1 holds a receipt for seq 9 that the restored ledger lacks | freeze_activity freezes A only, before the port opens; a new bid on A gets AUCTIONS_NOT_OPEN and no seq is assigned again; the vault of B1 shows A frozen and its bid possibly lost |

## Acceptance criteria

- All tests T01–T29 pass in CI.
- The proxy algorithm matches the proxy-v1 reference model on 100 000 random sequences and ledger replay reproduces every price.
- No proxy maximum or bidder key is visible to any party other than the bidder and the host, and both reach the host only encrypted to its key.
- No bid is shown as won unless auctions.auction.won names its bidder, and no bid stays submitted past notAfter plus 45 s.

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F12.S03.M04, F13.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
