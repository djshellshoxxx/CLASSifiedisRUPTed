# PS-034-07 — Privacy, retention and abuse: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-07.R01** The winner key is shared only with the seller and the winner; bidders see aliases and the host-signed ledger head.
- **PS-034-07.R02** Non-payment reports and second-chance offers are P2, end-to-end encrypted, and carry no reputational automation; the host records only a count for its own fraud queue.
- **PS-034-07.R03** False non-payment reports are limited by the day-3 floor, signed evidence of the Deal state, and the dispute path.

## Specification

**Data classification**
- AuctionResult: public projection P0; full result P2 (seller, winner).
- Non-payment report and second-chance statements: P2.

**Retention**
- Results and settlement statements: RET-EVIDENCE (2 years after last related activity) in participant vaults; host result rows kept for its published retention, default 90 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Host fabricates a winner or alters the price | result signed by host key over JCS bytes, ledger head hash lets every bidder compare with their receipts, discrepancies are exportable evidence |
| T02 | Seller falsely reports non-payment to take the second-chance buyer | report allowed only after day 3 while the Deal shows no acknowledged payment, winner can answer through the dispute path, second chance only at the candidate's own last visible bid |
| T03 | Replay of an old result to a new Deal | result id is bound to the auction id and Deal context; the unique result per auction rejects a second result |
| T04 | Winner key leaks to other bidders | public projection omits it; only seller and winner envelopes carry it |
| T05 | Close race lets a late bid win | single lease orders bids and close; hostTime of the last ledger entry must be before currentEndsAt |

**Abuse controls**
- Host records non_payment counts per key for its own hosting policy and passes them to F04.S02.M03 review when a key has 2 or more in 30 days.
- Per-vault quota of 20 inbound result envelopes per day from unknown hosts; unknown host keys are quarantined.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T10 | abuse | PS-034-07.R02, PS-034-07.R03 | non-payment report on day 2; report after payment acknowledged | AUCTIONS_NONPAYMENT_NOT_ALLOWED |
| TEST-PS-034-09.T11 | integration | PS-034-07.R01, PS-034-07.R02 | inspect public projection, bidder views, logs | winner key only in seller and winner envelopes; logs have no keys or prices |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
