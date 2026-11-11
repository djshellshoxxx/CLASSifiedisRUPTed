# PS-034-07 — Privacy, retention and abuse: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-07.R01** The winner key is shared only with the seller and the winner; bidders see aliases, the winner commitment and the host-signed ledger head.
- **PS-034-07.R02** Non-payment reports and second-chance offers are P2, end-to-end encrypted, and carry no reputational automation; the host records only a count for its own fraud queue.
- **PS-034-07.R03** False non-payment reports are limited by the day-3 floor and day-30 ceiling, the no-acknowledged-payment guard, signed evidence of the Deal state, and the dispute path.
- **PS-034-07.R04** The module registers ExportSectionPort (section auctions.results), DeletionPort and RetentionPurgePort with F10 (N6), annotates fields with their F10.S02.M02 class (winnerId, winnerSalt and candidate keys P2 to seller, winner and host), consumes privacy.deletion.completed to pseudonymize winnerId, sellerId and candidateId in retained evidence, and silently drops statements from DIDs blocked either way (N7).
- **PS-034-07.R05** A non-winning bidder's key reaches the seller only as one of at most 3 second-chance candidates after a seller-signed non-payment report, which the F04.S01.M02 trust panel discloses before the first bid.

## Specification

**Data classification**
- AuctionResult: public result P0; disclosure, deals and settlement state P2 (seller, winner, host).
- Non-payment report, candidate list and second-chance statements: P2.

**Retention**
- Results and settlement statements: RET-EVIDENCE (2 years after last related activity) in participant vaults; host result rows kept for its published retention, default 90 days.
- On account deletion: sellerId, winnerId and candidateId in retained results are replaced with per-deletion pseudonyms.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Host fabricates a winner or alters the price | public result signed by host key over JCS bytes, finalPrice must equal the ledger head price, ledger head hash lets every bidder compare with their receipts, discrepancies are exportable evidence |
| T02 | Seller falsely reports non-payment to take the second-chance buyer | report allowed only from day 3 to day 30 while the Deal shows no acknowledged or final payment, winner can answer through the dispute path, second chance only at the candidate's own last visible bid and refused once any claim exists |
| T03 | Replay of an old result to a new Deal | result id is bound to the auction id and Deal context; the unique result per auction rejects a second result; the second-chance Deal has its own context id |
| T04 | Winner key leaks to other bidders | the public result carries only winnerCommitment; only the disclosure, E2E to seller and winner, carries the key |
| T05 | Close race lets a late bid win | single lease orders bids and close; hostTime of the last ledger entry must be before currentEndsAt |
| T06 | A relay statement used to change a user's Deal | a host void never cancels a Deal; only every party's signed commerce.deal.cancel does (F09), and no vault applies a void over an acknowledged or final payment |

**Abuse controls**
- Host records non_payment counts per key from record_non_payment for its own hosting policy and passes them to F04.S02.M03 review when a key has 2 or more in 30 days.
- Per-vault quota of 20 inbound result envelopes per day from unknown hosts through RateLimitPort.consume (F12.S03.M03); unknown host keys are quarantined.
- The seller vault filters second-chance candidates by its own blocks; the host never sees the seller's block list.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T10 | abuse | PS-034-07.R02, PS-034-07.R03 | non-payment report on day 2, on day 31, and after payment acknowledged | AUCTIONS_NONPAYMENT_NOT_ALLOWED |
| TEST-PS-034-09.T11 | integration | PS-034-07.R01 | inspect public projection, bidder views, logs | winner key only in seller and winner disclosures; logs have no keys or prices |
| TEST-PS-034-09.T19 | integration | PS-034-02.R04, PS-034-07.R04 | seller blocked the first candidate; winner blocked by the seller at result time | candidate list filtered locally and the offer goes to the second; with the winner blocked the result shows, no Deal is opened, state failed with reason blocked, report refused |
| TEST-PS-034-09.T22 | integration | PS-034-07.R05 | seller receives the candidate list | at most 3 candidates with lastVisibleBid; no other bidder key reaches the seller |
| TEST-PS-034-09.T23 | integration | PS-034-07.R04 | export; account deletion of the winner | section auctions.results present; winnerId pseudonymized in the seller's retained result |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
