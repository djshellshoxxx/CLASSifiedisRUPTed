# PS-034-04 — Commands, queries and events: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-04.R01** The host relay command auctions.result.determine runs from the close tick and produces the host-signed result; participant vaults ingest it with auctions.result.receive.
- **PS-034-04.R02** Seller and candidate actions are vault commands that produce named signed statements and go through the sync outbox and the host.
- **PS-034-04.R03** Auction closed, won and unsold events are host-local and are derived in each participant vault on receipt of the result (actor.kind federated).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `auctions.result.determine` | auctions.result.determine | [relay command, host close tick] { auctionId } | { resultId, outcome, ledgerHeadSeq, ledgerHeadHash, hostSignature } | NOT_FOUND, AUCTIONS_NOT_CLOSABLE, PRECONDITION_FAILED, DEPENDENCY_UNAVAILABLE | auctions.auction.closed, auctions.auction.won, auctions.auction.unsold | yes (Idempotency-Key) |
| `auctions.result.receive` | auctions.result.receive | [vault-local ingestion of the host-signed result envelope per CTR-FED-001; opens the local Deal through F09.S01.M01] { envelope, via? } | { resultId, accepted: boolean, quarantined?: boolean, code?, dealId? } | AUCTIONS_RESULT_INVALID, UNSUPPORTED_SCHEMA_VERSION, DEPENDENCY_UNAVAILABLE | auctions.auction.closed, auctions.auction.won, auctions.auction.unsold | yes (Idempotency-Key) |
| `auctions.result.report_non_payment` | auctions.result.report_non_payment | [statement classrup.auctions.non_payment_report/v1 signed by seller, sent to winner and host] { resultId, expectedRevision } | { resultId, revision, reportCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, AUCTIONS_NONPAYMENT_NOT_ALLOWED | auctions.result.non_payment | yes (Idempotency-Key) |
| `auctions.result.nominate_second_chance` | auctions.result.determine | [relay command at the host, authorized by the seller-signed non-payment report] { resultId, reportCid } | { candidate: statement classrup.auctions.second_chance_candidate/v1 signed by host key {candidateId, lastVisibleBid: Money} } | NOT_FOUND, AUCTIONS_SECOND_CHANCE_NOT_ALLOWED, FORBIDDEN |  | yes (Idempotency-Key) |
| `auctions.result.offer_second_chance` | auctions.result.offer_second_chance | [statement classrup.auctions.second_chance_offer/v1 signed by seller, E2E encrypted to the candidate; price equals the host-signed last visible bid] { resultId, expectedRevision, candidateStatement } | { resultId, revision, offerCid, expiresAt, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, AUCTIONS_SECOND_CHANCE_NOT_ALLOWED | auctions.result.second_chance_offered | yes (Idempotency-Key) |
| `auctions.result.respond_second_chance` | auctions.result.respond_second_chance | [statement classrup.auctions.second_chance_response/v1 signed by the candidate] { resultId, offerCid, accept: boolean } | { resultId, accepted, responseCid, syncState } | NOT_FOUND, CONFLICT_STATE, EXPIRED, AUCTIONS_RESULT_INVALID |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `auctions.result.get` | auctions.result.read_public | { auctionId } (relay query or vault cache of the host-signed result) | { result: public projection (outcome, final price, winner alias, ledger head, closedAtHost); seller and winner also see winnerId and local state } | NOT_FOUND |
| `auctions.result.verify` | auctions.result.read_own | [vault-local] { auctionId } | { signatureOk: boolean, ledgerHeadMatchesMyReceipts: boolean, mismatchSeq? } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `auctions.auction.closed` | P0 | { auctionId, resultId, outcome, closedAtHost, ledgerHeadSeq, ledgerHeadHash } |
| `auctions.auction.won` | P2 | { auctionId, resultId, sellerId, winnerId, finalPrice, winningBidId } |
| `auctions.auction.unsold` | P0 | { auctionId, resultId, reason } |
| `auctions.result.non_payment` | P2 | { resultId, auctionId, sellerId, winnerId, reportCid } |
| `auctions.result.second_chance_offered` | P2 | { resultId, auctionId, candidateId, price, expiresAt } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.deal.opened` | for context type auction_result store dealId and move pending_deal to awaiting_payment |
| `commerce.deal.completed` | for context type auction_result move awaiting_payment to completed |
| `commerce.payment.expired` | for context type auction_result show payment expired and allow non-payment report from day 3 |
| `auctions.result.voided` | move the result to voided, close the Deal through the F09 port when no acknowledged payment exists |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| AUCTIONS_NOT_CLOSABLE | 409 | no | auction is not open or has not reached its current end under the lease |
| AUCTIONS_RESULT_INVALID | 422 | no | result or response signature, signer role or host key check failed; quarantined |
| AUCTIONS_NONPAYMENT_NOT_ALLOWED | 409 | no | non-payment report is too early, too late or the result is not awaiting payment |
| AUCTIONS_SECOND_CHANCE_NOT_ALLOWED | 409 | no | no eligible candidate or a second chance was already used |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
host close tick at 2026-11-12T10:00:01.000Z -> auctions.result.determine { "auctionId": "0192f400-0002-…" }
-> { "resultId": "0192f410-0001-…", "outcome": "won", "ledgerHeadSeq": 42, "ledgerHeadHash": "sha256-Lh…", "hostSignature": "MEUCIQ…" }
winner and seller vaults: auctions.result.receive -> Deal opened (contextRef { "type": "auction_result", "id": "0192f410-0001-…" }), state awaiting_payment
day 4: seller auctions.result.report_non_payment -> state non_payment; then nominate and offer_second_chance at the next bidder's last visible bid
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T04 | integration | PS-034-03.R02, PS-034-04.R03 | Deal opened, payment claimed only, then acknowledged | state stays awaiting_payment on claim; completed only on commerce.deal.completed |
| TEST-PS-034-09.T07 | contract | PS-034-04.R01, PS-034-04.R02, PS-034-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas; public projection has no winner key |
| TEST-PS-034-09.T08 | integration | PS-034-03.R03, PS-034-04.R03 | non-payment on day 3 and day 10; second chance accepted, declined and expired | states and Deals follow the machine; at most one second chance |
| TEST-PS-034-09.T12 | integration | PS-034-03.R01, PS-034-04.R03 | voided event after Deal opened without acknowledged payment, and after acknowledged payment | Deal closed through port; second case refused as not voidable and flagged |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
