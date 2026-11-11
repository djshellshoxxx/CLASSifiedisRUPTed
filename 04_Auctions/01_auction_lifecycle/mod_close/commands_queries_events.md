# PS-034-04 — Commands, queries and events: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-04.R01** The host relay command auctions.result.determine runs from the close tick and produces the host-signed public result and disclosure; participant vaults ingest them with auctions.result.receive and the other parties' signed statements with auctions.result.receive_statement.
- **PS-034-04.R02** Seller and candidate actions are vault commands that produce named signed statements and go through the sync outbox and the host.
- **PS-034-04.R03** Auction closed, won and unsold events are host-local and are derived in each participant vault on receipt of the result (actor.kind federated).
- **PS-034-04.R04** Statements are registered with F11.S01.M01 with their signer roles - result, result_disclosure and second_chance_candidates by the host key in the terms, non_payment_report and second_chance_offer by the seller key (sellerId), second_chance_response by the nominated candidate key - and vaults act only on statements they accepted (N2).
- **PS-034-04.R05** Host-produced events call the relay hook notify.notification.dispatch for a content-free push - closed and unsold to the seller, won to the seller and winner, second_chance_offered to the candidate - for recipients who set pushOptIn (N17).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `auctions.result.determine` | auctions.result.determine | [relay command, host close tick only] { auctionId, fenceToken } | { resultId, outcome, ledgerHeadSeq, ledgerHeadHash, result: classrup.auctions.result/v1, disclosure?: classrup.auctions.result_disclosure/v1 } | NOT_FOUND, AUCTIONS_NOT_CLOSABLE, PRECONDITION_FAILED, DEPENDENCY_UNAVAILABLE | auctions.auction.closed, auctions.auction.won, auctions.auction.unsold | yes (Idempotency-Key) |
| `auctions.result.receive` | auctions.result.receive | [vault-local ingestion of the host-signed public result and, for seller and winner, the disclosure per CTR-FED-001; opens the local Deal through F09.S01.M01 unless blocked] { envelope, disclosure?, via? } | { resultId, role, accepted: boolean, quarantined?: boolean, code?, dealId? } | AUCTIONS_RESULT_INVALID, UNSUPPORTED_SCHEMA_VERSION, BLOCKED_PARTY, DEPENDENCY_UNAVAILABLE | auctions.auction.closed, auctions.auction.won, auctions.auction.unsold | yes (Idempotency-Key) |
| `auctions.result.receive_statement` | auctions.result.receive | [vault-local ingestion with signer-role checks of classrup.auctions.non_payment_report/v1 (winner vault), second_chance_offer/v1 (candidate vault), second_chance_response/v1 (seller vault) and second_chance_candidates/v1 (seller vault)] { envelope, via? } | { resultId, accepted: boolean, quarantined?: boolean, code?, state } | NOT_FOUND, AUCTIONS_RESULT_INVALID, UNSUPPORTED_SCHEMA_VERSION, BLOCKED_PARTY, EXPIRED | auctions.result.non_payment, auctions.result.second_chance_offered | yes (Idempotency-Key) |
| `auctions.result.report_non_payment` | auctions.result.report_non_payment | [statement classrup.auctions.non_payment_report/v1 signed by seller, sent to winner and host] { resultId, expectedRevision } | { resultId, revision, reportCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, AUCTIONS_NONPAYMENT_NOT_ALLOWED | auctions.result.non_payment | yes (Idempotency-Key) |
| `auctions.result.record_non_payment` | auctions.result.record_non_payment | [relay command at the host, authorized by the seller-signed non-payment report] { reportEnvelope } | { resultId, recordedAt } | NOT_FOUND, AUCTIONS_RESULT_INVALID, AUCTIONS_NONPAYMENT_NOT_ALLOWED | auctions.result.non_payment | yes (Idempotency-Key) |
| `auctions.result.nominate_second_chance` | auctions.result.nominate | [relay command at the host, after record_non_payment stored the seller-signed report for this result] { resultId, reportCid } | { candidates: statement classrup.auctions.second_chance_candidates/v1 signed by host key, E2E to the seller } | NOT_FOUND, AUCTIONS_SECOND_CHANCE_NOT_ALLOWED, FORBIDDEN |  | yes (Idempotency-Key) |
| `auctions.result.offer_second_chance` | auctions.result.offer_second_chance | [statement classrup.auctions.second_chance_offer/v1 signed by seller, E2E encrypted to the candidate, sent through the host; price equals the candidate's host-signed lastVisibleBid] { resultId, expectedRevision, candidatesCid, candidateId } | { resultId, revision, offerCid, expiresAt, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, AUCTIONS_SECOND_CHANCE_NOT_ALLOWED, BLOCKED_PARTY | auctions.result.second_chance_offered | yes (Idempotency-Key) |
| `auctions.result.respond_second_chance` | auctions.result.respond_second_chance | [statement classrup.auctions.second_chance_response/v1 signed by the candidate] { resultId, offerCid, accept: boolean } | { resultId, accepted, responseCid, dealId?, syncState } | NOT_FOUND, CONFLICT_STATE, EXPIRED, BLOCKED_PARTY, AUCTIONS_RESULT_INVALID |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `auctions.result.get` | auctions.result.read_public | { auctionId } (relay query or vault cache of the host-signed result) | { result: public projection (outcome, finalPrice, winnerAlias, winnerCommitment, ledger head, closedAtHost); seller and winner also see winnerId, deals, local state and hostVoid } | NOT_FOUND |
| `auctions.result.verify` | auctions.result.read_own | [vault-local] { auctionId } | { signatureOk: boolean, disclosureOk?: boolean, ledgerHeadConsistentWithMyReceipts: boolean, mismatchSeq? } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `auctions.auction.closed` | P0 | { auctionId, resultId, sellerId, outcome, closedAtHost, ledgerHeadSeq, ledgerHeadHash } |
| `auctions.auction.won` | P2 | { auctionId, resultId, sellerId, winnerId?, winnerAlias, finalPrice, winningBidId? } — winnerId and winningBidId only in host-local events and in the seller and winner vaults; a non-party vault derives it with winnerAlias only |
| `auctions.auction.unsold` | P0 | { auctionId, resultId, sellerId, reason } |
| `auctions.result.non_payment` | P2 | { resultId, auctionId, sellerId, winnerId, reportCid } — host-local from record_non_payment; vault-local in the seller vault; derived in the winner vault |
| `auctions.result.second_chance_offered` | P2 | { resultId, auctionId, sellerId, candidateId, price, offerCid, expiresAt } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.deal.opened` | for contextRef type auction_result whose id is this resultId or the uuid derived from this result's offerCid, store dealId for that buyer and move pending_deal to awaiting_payment |
| `commerce.deal.completed` | for such a contextRef move awaiting_payment or non_payment to completed; on a voided result only record that the Deal completed |
| `commerce.deal.cancelled` | for such a contextRef record the cancellation; a voided result shows that both parties cancelled the Deal |
| `commerce.payment.expired` | for such a Deal show payment expired; the non-payment report window (day 3 to day 30) is unchanged |
| `auctions.result.voided` | apply the host's void in this vault - when no Deal of this result has an acknowledged or final PaymentClaim (commerce.payment.list_for_deal), move to voided, keep the Deal and offer Cancel Deal; otherwise keep the state, set hostVoid.appliedAs void_after_payment, show voided by host after payment and link F09.S02.M02 disputes |
| `privacy.deletion.completed` | replace the erased principal's did (sellerId, winnerId, candidateId, buyerId in deals) in retained results with the per-deletion pseudonym; envelopes are kept and marked unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| AUCTIONS_NOT_CLOSABLE | 409 | no | auction is not open or has not reached its current end under the lease |
| AUCTIONS_RESULT_INVALID | 422 | no | a result, disclosure, candidate list, report, offer, response, void or rescission statement failed the signature, signer role, host key or terms binding check; quarantined |
| AUCTIONS_NONPAYMENT_NOT_ALLOWED | 409 | no | non-payment report is too early, too late, the result is not awaiting payment, or a payment is acknowledged or final |
| AUCTIONS_SECOND_CHANCE_NOT_ALLOWED | 409 | no | no eligible candidate after the block filter, a second chance was already used, or a claim on the original Deal exists |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements: classrup.auctions.result/v1 (host key, public P0) {auctionId, termsCid, outcome, unsoldReason?, finalPrice?, winnerAlias?, winnerCommitment?, reserveReveal?, ledgerHeadSeq, ledgerHeadHash, closedAtHost}; classrup.auctions.result_disclosure/v1 (host key, P2, E2E to seller and winner) {resultCid, auctionId, winnerId, salt, winningBidCid, reserveReveal?}; classrup.auctions.non_payment_report/v1 (seller key) {resultCid, dealId, reportedAt}; classrup.auctions.second_chance_candidates/v1 (host key, E2E to seller) {resultCid, reportCid, entries: [{candidateId, lastVisibleBid}] ranked, at most 3}; classrup.auctions.second_chance_offer/v1 (seller key, E2E to the candidate, sent through the host) {resultCid, candidatesCid, candidateId, price, expiresAt}; classrup.auctions.second_chance_response/v1 (candidate key) {offerCid, accept}. The second-chance Deal uses contextRef {type: auction_result, id: first 16 bytes of sha256(offerCid) as a uuid} and contextCid = responseCid.

### Example

```
host close tick at 2026-11-12T10:00:01.000Z -> auctions.result.determine { "auctionId": "0192f400-0002-…", "fenceToken": 812 }
-> public result { "outcome": "won", "finalPrice": { "amount": "6100", "currency": "EUR" }, "winnerAlias": "K3QZ7A", "winnerCommitment": "sha256-Wc…", "ledgerHeadSeq": 42, "ledgerHeadHash": "sha256-Lh…" }
   and disclosure { "winnerId": "did:key:z6Mk…", "salt": "q1…" } E2E to seller and winner
seller and winner vaults: auctions.result.receive -> both verify result and disclosure; isBlockedEither false;
  commerce.deal.open (contextRef { "type": "auction_result", "id": "0192f410-0001-…" }) -> awaiting_payment
non-winning bidder vault: auctions.result.receive -> recorded (winnerAlias only)
day 11: seller auctions.result.report_non_payment -> host record_non_payment -> nominate_second_chance -> candidate list (3 entries)
  seller vault filters by blocks -> offer_second_chance to the first unblocked candidate at its last visible bid
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T07 | contract | PS-034-04.R01, PS-034-04.R02, PS-034-09.R02, PS-034-01.R03 | each command, statement and event; public result verified by a non-winning bidder vault; disclosure verified by seller and winner | payloads and signatures validate; the public result has no winnerId; the disclosure's winnerId and salt match winnerCommitment |
| TEST-PS-034-09.T17 | integration | PS-034-04.R03 | non-winning bidder vault receives the public result; seller vault receives result and disclosure | derived auctions.auction.closed and auctions.auction.won have actor.kind federated with verified provenance.sig; the non-party copy has no winnerId |
| TEST-PS-034-09.T20 | contract | PS-034-04.R04 | statement registry entries; a non-payment report signed by the winner key | roleFor matches the declared roles; the report is quarantined with AUCTIONS_RESULT_INVALID |
| TEST-PS-034-09.T21 | integration | PS-034-04.R05 | host close with a sale; second chance offered | dispatch called once per opted-in recipient (seller, winner, candidate) with a template key and reference only |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
