# PS-034-09 — Contract and acceptance tests: Auction close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M03 Auction close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/close` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-034-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-034-09.R02** Close concurrency is covered by deterministic tests with injectable clock and lease, including extension races, double workers and lease expiry.
- **PS-034-09.R03** Contract tests validate result, disclosure, report, candidate, offer and response statements and the Deal context against schema registries.

## Specification

See the module test table below (all processes).

**Fixtures:** Host H with injectable clock; auction A (EUR, reserve 50.00) with bidders B1 (max 80.00), B2 (max 60.00), B3 (max 55.00); auction A3 with leader max 80.00, only other max 40.00, reserve 50.00; seller S; vaults for S, B1, B2, B3; fixed clock 2026-11-12T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-034-09.T01 | unit | PS-034-01.R01, PS-034-01.R04 | close A3 whose ledger head is an auto entry at the reserve | finalPrice equals the ledger head price 50.00; reserveCheck met; close computes no price of its own |
| TEST-PS-034-09.T02 | unit | PS-034-02.R01, PS-034-02.R02, PS-034-02.R03 | each rule V01–V11 violated | documented code returned and nothing stored |
| TEST-PS-034-09.T03 | property | PS-034-03.R01 | random timer, command and statement sequences per role | only declared transitions succeed; terminal states never change |
| TEST-PS-034-09.T04 | integration | PS-034-03.R02 | Deal opened, payment claimed only, then acknowledged | state stays awaiting_payment on claim; completed only on commerce.deal.completed |
| TEST-PS-034-09.T05 | chaos | PS-034-06.R01, PS-034-06.R02, PS-034-09.R03 | two workers close the same auction; extension lands before lease; lease expires mid-close | exactly one result; no close on extension; stale fence refused |
| TEST-PS-034-09.T06 | integration | PS-034-01.R02, PS-034-06.R03 | result delivered twice and late; winner offline for 2 days | one Deal per vault; UI shows result pending until the signed statements are verified |
| TEST-PS-034-09.T07 | contract | PS-034-04.R01, PS-034-04.R02, PS-034-09.R02, PS-034-01.R03 | each command, statement and event; public result verified by a non-winning bidder vault; disclosure verified by seller and winner | payloads and signatures validate; the public result has no winnerId; the disclosure's winnerId and salt match winnerCommitment |
| TEST-PS-034-09.T08 | integration | PS-034-03.R03 | day 10 passes without report; non-payment report on day 11 with no acknowledged claim; second chance accepted, declined and expired; winner pays after the report | day 10 only prompts; day 11 report accepted; second-chance Deal uses its own contextRef; late payment completes from non_payment; at most one second chance |
| TEST-PS-034-09.T09 | abuse | PS-034-05.R01, PS-034-05.R02, PS-034-05.R03 | result signed by wrong host key; report by non-seller; response by non-candidate; host operator calls determine; nominate without a recorded seller-signed report | quarantined or FORBIDDEN; no state change |
| TEST-PS-034-09.T10 | abuse | PS-034-07.R02, PS-034-07.R03 | non-payment report on day 2, on day 31, and after payment acknowledged | AUCTIONS_NONPAYMENT_NOT_ALLOWED |
| TEST-PS-034-09.T11 | integration | PS-034-07.R01 | inspect public projection, bidder views, logs | winner key only in seller and winner disclosures; logs have no keys or prices |
| TEST-PS-034-09.T12 | integration | PS-034-03.R04, PS-034-06.R04 | voided statement after the Deal opened without acknowledged payment, and after acknowledged payment, in seller and winner vaults | first - result voided, Deal kept, Cancel Deal offered and commerce.deal.cancel needs both signatures; second - state unchanged, hostVoid void_after_payment, dispute link shown |
| TEST-PS-034-09.T13 | load | PS-034-08.R02, PS-034-08.R03 | 1 000 auctions end in the same minute; 5 000 entry ledger verify | close lag p95 ≤ 2 s, p99 ≤ 5 s; verify ≤ 300 ms |
| TEST-PS-034-09.T14 | unit | PS-034-09.R01 | traceability tool run | every PS-034 requirement maps to a passing test |
| TEST-PS-034-09.T15 | integration | PS-034-10.R01, PS-034-10.R02, PS-034-10.R03 | export, import into fresh vault, restore host backup | results and statements round-trip; host restore keeps unique result per auction |
| TEST-PS-034-09.T16 | e2e | PS-034-01.R02 | mobile seller and winner in two browsers after close | both show sold with Deal link; non-winner sees alias and checks the public result; axe zero serious issues |
| TEST-PS-034-09.T17 | integration | PS-034-04.R03 | non-winning bidder vault receives the public result; seller vault receives result and disclosure | derived auctions.auction.closed and auctions.auction.won have actor.kind federated with verified provenance.sig; the non-party copy has no winnerId |
| TEST-PS-034-09.T18 | e2e | PS-034-08.R01 | network capture of the PWA through result, settlement, void notice and second-chance screens | zero telemetry or analytics requests |
| TEST-PS-034-09.T19 | integration | PS-034-02.R04, PS-034-07.R04 | seller blocked the first candidate; winner blocked by the seller at result time | candidate list filtered locally and the offer goes to the second; with the winner blocked the result shows, no Deal is opened, state failed with reason blocked, report refused |
| TEST-PS-034-09.T20 | contract | PS-034-04.R04 | statement registry entries; a non-payment report signed by the winner key | roleFor matches the declared roles; the report is quarantined with AUCTIONS_RESULT_INVALID |
| TEST-PS-034-09.T21 | integration | PS-034-04.R05 | host close with a sale; second chance offered | dispatch called once per opted-in recipient (seller, winner, candidate) with a template key and reference only |
| TEST-PS-034-09.T22 | integration | PS-034-07.R05 | seller receives the candidate list | at most 3 candidates with lastVisibleBid; no other bidder key reaches the seller |
| TEST-PS-034-09.T23 | integration | PS-034-07.R04 | export; account deletion of the winner | section auctions.results present; winnerId pseudonymized in the seller's retained result |
| TEST-PS-034-09.T24 | unit | PS-034-03.R01 | host row and non-party mirrors after a sale; second-chance offer to a candidate vault | host and non-party copies go determined to recorded; the candidate vault goes recorded to second_chance_offered and back to recorded on decline |
| TEST-PS-034-09.T25 | integration | PS-034-06.R05, PS-034-04.R06 | restore host H from a backup taken before auction A closed with a sale; the seller vault holds result and disclosure; a bidder returns the public result first; a forged result signed by another key | freeze_closes freezes A before the close tick runs; readopt of the bidder copy stores the result and the seller's disclosure completes the host row; host-local closed and won re-emitted; the forged result AUCTIONS_RESULT_INVALID; determine never runs for A |
| TEST-PS-034-09.T26 | integration | PS-034-04.R03 | seller vault receives a verified unsold result for auction listing L | auctions.auction.unsold derived once with listingId L from the verified terms, sellerId and actor.kind federated with verified provenance.sig |

## Acceptance criteria

- All tests T01–T26 pass in CI.
- Exactly one result exists per auction under any worker race and no late bid can win.
- A winner is never shown as having won, and a sale never as completed, before the host-signed result and the acknowledged or final payment are held.
- No vault applies a void over an acknowledged or final payment, and no void cancels a Deal.

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
