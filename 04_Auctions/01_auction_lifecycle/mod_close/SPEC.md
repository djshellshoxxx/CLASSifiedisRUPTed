# F04.S01.M03 — Auction close

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F04.S01](../SPEC.md). **Process IDs:** PS-034-01…PS-034-10. **Code:** `packages/auctions/src/auction_lifecycle/close`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

At the auction's current end the host relay takes the per-auction close lease, determines the outcome from the bid ledger head and the reserve, and signs two statements with its host key (relay time) - the public result (outcome, final price, winner alias, a commitment to the winner key and the ledger head) that every bidder can verify, and a disclosure of the winner key that only the seller and the winner receive end-to-end encrypted. Each vault records the result according to its role. The seller and winner vaults open their own local Deal in F09.S01.M01 for the final price, unless they are blocked either way, and then settle directly through payment claims, not through the platform. If the winner does not pay, the seller can report non-payment from day 3 to day 30 while no payment is acknowledged and, once, offer the sale to a candidate from a host-signed list that the seller vault filters by its own blocks. A host void is a finding each vault applies by its own payment state; it never cancels a Deal. A relay-signed result is the host's statement of the outcome, not proof of payment or delivery.

## Responsibilities

- Own AuctionResult - created by the host at close and mirrored in the seller, winner and bidder vaults by role - and the statements result (classrup.auctions.result/v1), result_disclosure, non_payment_report, second_chance_candidates, second_chance_offer and second_chance_response.
- Close exactly once under the close lease with a fencing token, re-reading currentEndsAt after taking the lease, and call F04.S01.M01 mark_closed in the same host transaction.
- Decide won or unsold from the ledger head - finalPrice is the price of the ledger head entry, already raised to the reserve by the F04.S01.M02 reserve rule; no bids or reserve not met is unsold - and publish the ledger head hash so bidders can compare it with their receipts.
- In the seller and winner vaults open a local Deal through F09.S01.M01 unless the parties are blocked either way, track it until commerce.deal.completed, and handle winner non-payment and one second-chance offer to a candidate filtered by the seller vault's blocks.
- Apply a host's void finding in each vault by the vault's own Deal state - voided when no claim is acknowledged or final, otherwise recorded as void after payment - and offer the principal a mutual Deal cancel instead of cancelling it.

## Not responsible for

- Bid acceptance and proxy logic (F04.S01.M02), terms (F04.S01.M01) and soft close (F04.S02.M02).
- Payment claims, acknowledgements, receipts, Deal cancellation and disputes (F09).
- Voiding results for fraud (F04.S02.M03 issues the host finding; this module decides in each vault whether and how it applies).
- Delivery logistics and meetups (F08.S03).
- Future: offering an unsold lot to the highest bidder below reserve, and automatic relist.

## User stories

- As a bidder, I see within seconds of the end whether I won, and I can check the public host-signed result against the receipts I hold.
- As a seller, I get the winner's pseudonymous identity key through the host-signed disclosure and a Deal for the final price, and I can report non-payment from day 3 to day 30 while no payment is acknowledged.
- As the next-highest bidder, I may receive a second-chance offer at my last visible bid and accept or decline within 48 hours.
- As a seller or winner whose result the host voided, I see that the host voided its result, that our Deal stays between us until we both cancel it, and that payments already acknowledged go through a dispute.

## Edge cases

- A bid and the close tick race at the end; the lease serializes them and a bid with host time before the end is included in the ledger before the result is signed, later bids get AUCTIONS_NOT_OPEN.
- A soft-close extension lands after the close worker started but before it took the lease; the worker re-reads currentEndsAt under the lease and releases without closing.
- Two host workers close the same auction; the unique AuctionResult per auction plus the fencing token let exactly one commit; the other exits without effect.
- Leader's maximum is at or above the reserve; the F04.S01.M02 reserve rule PX4 has already raised the price in the ledger, so the result takes finalPrice from the ledger head and never computes a price of its own.
- The result never reaches the winner because the winner is offline; the host retains the public result and the disclosure for 30 days in the winner's mailbox, and the winner's UI shows result pending from the host and never won until the signed statements are verified.
- Winner and seller both open the Deal; the deterministic dealId from contextRef (auction_result, resultId) makes the two vaults converge; a second-chance Deal uses contextRef (auction_result, uuid derived from the offer cid) so it never collides with the winner's Deal.
- A second-chance candidate is blocked by or blocks the seller; the seller vault filters the host-signed candidate list with F07.S02.M02 isBlockedEither and offers to the first remaining candidate, or the result moves to failed with reason no_candidate.
- Result is voided by the host after the Deal opened and before any acknowledged or final payment; the vault marks the result voided, keeps the Deal, offers the principal Cancel Deal (commerce.deal.cancel, which needs every party's signed cancel) or lets it expire, and says the host voided its result while the Deal stays between the parties until both cancel.
- The void arrives after a payment was acknowledged in this vault; the result keeps its state, shows voided by host after payment, and points to F09.S02.M02 disputes; nothing else changes.
- Winner and seller are blocked either way when the result arrives; the result is shown, no Deal is opened, the result moves to failed with reason blocked, and no non-payment report is allowed.
- The winner pays late, after the seller reported non-payment; commerce.deal.completed moves non_payment to completed; once any claim on the original Deal is claimed, acknowledged or final, the seller cannot offer a second chance.
- The seller reports non-payment on day 11 with no acknowledged claim; allowed in the day 3 to day 30 window; day 10 only shows a prompt and changes nothing.
- A non-winning bidder's vault receives the public result; it verifies the host signature over the public statement it holds, which has no winnerId, records the result and never learns the winner key.

## UX and accessibility

- Result banner on the auction page: Sold at price to alias, Reserve not met, No bids, with host-signed time and a Check result action that compares the ledger head with my receipts.
- Seller settlement card: winner key fingerprint, Deal link, days since close, Report non-payment (enabled from day 3 to day 30 while no payment is acknowledged; a prompt appears on day 10), Offer to next bidder.
- Winner card: You won at price, Deal link with payment instructions agreed with the seller.
- Void notice: The host voided its result (reason category). Your Deal stays open between you and the other party until both of you cancel it - Cancel Deal. If a payment was already acknowledged: voided by host after payment - open a dispute.

**States:** loading; closing; result-pending; recorded; sold; unsold; awaiting-payment; completed; non-payment; second-chance; failed; voided; voided-after-payment

**Accessibility:** Result outcomes are announced once through an aria-live assertive region with the plain text outcome.; Report non-payment, Offer and Cancel Deal actions are buttons of at least 44x44 px with accessible names that include the auction title.; Countdowns are text and update at most once per minute.

## Owned data

- `AuctionResult` (classrup.auctions.result/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `auctions.result.determine`, `auctions.result.receive`, `auctions.result.receive_statement`, `auctions.result.report_non_payment`, `auctions.result.record_non_payment`, `auctions.result.nominate_second_chance`, `auctions.result.offer_second_chance`, `auctions.result.respond_second_chance`
- Queries: `auctions.result.get`, `auctions.result.verify`
- Emits: `auctions.auction.closed`, `auctions.auction.won`, `auctions.auction.unsold`, `auctions.result.non_payment`, `auctions.result.second_chance_offered`
- Consumes: `commerce.deal.opened`, `commerce.deal.completed`, `commerce.deal.cancelled`, `commerce.payment.expired`, `auctions.result.voided`, `privacy.deletion.completed`

## Dependencies

F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F09.S03.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-034-01 | [Domain schema](domain_schema.md) | 4 |
| PS-034-02 | [Validation rules](validation_rules.md) | 4 |
| PS-034-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-034-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-034-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-034-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-034-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-034-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-034-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-034-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/auctions/src/auction_lifecycle/close/index.ts`.

## Acceptance criteria

- All tests T01–T24 pass in CI.
- Exactly one result exists per auction under any worker race and no late bid can win.
- A winner is never shown as having won, and a sale never as completed, before the host-signed result and the acknowledged or final payment are held.
- No vault applies a void over an acknowledged or final payment, and no void cancels a Deal.
