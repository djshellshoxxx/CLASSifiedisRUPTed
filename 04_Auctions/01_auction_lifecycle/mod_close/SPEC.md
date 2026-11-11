# F04.S01.M03 — Auction close

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F04.S01](../SPEC.md). **Process IDs:** PS-034-01…PS-034-10. **Code:** `packages/auctions/src/auction_lifecycle/close`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

At the auction's current end the host relay takes the per-auction close lease, determines the winner by the bid ledger and the reserve, and signs the AuctionResult statement with its host key (relay time). The result goes to the seller, the winner and every bidder (each sees what they may see). On receipt each participant vault records the result and opens its own local Deal in F09.S01.M01 for the final price; the seller and winner then settle directly through payment claims, not through the platform. If the winner does not pay within the deal window the seller can report non-payment and, once, offer the sale to the next eligible bidder at that bidder's last visible bid. A relay-signed result is the host's statement of the outcome, not proof of payment or delivery.

## Responsibilities

- Own AuctionResult - created by the host at close and mirrored in the seller, winner and bidder vaults - and the statements result (classrup.auctions.result/v1), non_payment_report, second_chance_offer and second_chance_response.
- Close exactly once under the close lease with a fencing token, re-reading currentEndsAt after taking the lease, and call F04.S01.M01 mark_closed in the same host transaction.
- Decide won or unsold - highest leading bid with price at or above the hidden reserve is a sale; no bids or reserve not met is unsold - and publish the ledger head hash so bidders can check their receipts.
- On result receipt, open a local Deal through F09.S01.M01 in the seller and winner vaults and track it until commerce.deal.completed; handle winner non-payment and one second-chance offer.

## Not responsible for

- Bid acceptance and proxy logic (F04.S01.M02), terms (F04.S01.M01) and soft close (F04.S02.M02).
- Payment claims, acknowledgements, receipts and disputes (F09).
- Voiding results for fraud (F04.S02.M03 decides and emits; this module applies the voided state).
- Delivery logistics and meetups (F08.S03).
- Future: offering an unsold lot to the highest bidder below reserve, and automatic relist.

## User stories

- As a bidder, I see within seconds of the end whether I won, and I can check the host-signed result against the receipts I hold.
- As a seller, I get the winner's pseudonymous identity key and a Deal for the final price, and I can report non-payment after 3 days.
- As the next-highest bidder, I may receive a second-chance offer at my last visible bid and accept or decline within 48 hours.

## Edge cases

- A bid and the close tick race at the end; the lease serializes them and a bid with host time before the end is included in the ledger before the result is signed, later bids get AUCTIONS_NOT_OPEN.
- A soft-close extension lands after the close worker started but before it took the lease; the worker re-reads currentEndsAt under the lease and releases without closing.
- Two host workers close the same auction; the unique AuctionResult per auction plus the fencing token let exactly one commit; the other exits without effect.
- Leader's maximum is at or above the reserve but the price is below it; the proxy rules have already raised the price to the reserve, so the result is a sale at the reserve price.
- The result statement never reaches the winner because the winner is offline; the host retains it for 30 days in the winner's mailbox, and the winner's UI shows result pending from the host and never won until the signed statement is verified.
- Winner and seller both open a Deal; the two Deals reference the same result id so reconciliation matches them.
- Second-chance candidate has been blocked by the seller or flagged by shill checks; the next eligible candidate is chosen, or the result moves to failed.
- Result is voided by fraud review after the Deal opened but before any acknowledged payment; the Deal is closed through the F09 port and the winner is told, with no funds moved by the platform.

## UX and accessibility

- Result banner on the auction page: Sold at price to alias, Reserve not met, No bids, with host-signed time and Verify result action.
- Seller settlement card: winner key fingerprint, Deal link, days since close, Report non-payment (enabled from day 3), Offer to next bidder.
- Winner card: You won at price, Deal link with payment instructions agreed with the seller, countdown of the 10-day window.

**States:** loading; closing; result-pending; sold; unsold; awaiting-payment; completed; non-payment; second-chance; failed; voided

**Accessibility:** Result outcomes are announced once through an aria-live assertive region with the plain text outcome.; Report non-payment and Offer actions are buttons of at least 44x44 px with accessible names that include the auction title.; Countdowns are text and update at most once per minute.

## Owned data

- `AuctionResult` (classrup.auctions.result/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `auctions.result.determine`, `auctions.result.receive`, `auctions.result.report_non_payment`, `auctions.result.nominate_second_chance`, `auctions.result.offer_second_chance`, `auctions.result.respond_second_chance`
- Queries: `auctions.result.get`, `auctions.result.verify`
- Emits: `auctions.auction.closed`, `auctions.auction.won`, `auctions.auction.unsold`, `auctions.result.non_payment`, `auctions.result.second_chance_offered`
- Consumes: `commerce.deal.opened`, `commerce.deal.completed`, `commerce.payment.expired`, `auctions.result.voided`

## Dependencies

F04.S01.M01, F04.S01.M02, F09.S01.M01, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-034-01 | [Domain schema](domain_schema.md) | 3 |
| PS-034-02 | [Validation rules](validation_rules.md) | 3 |
| PS-034-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-034-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-034-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-034-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-034-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-034-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-034-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-034-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/auctions/src/auction_lifecycle/close/index.ts`.

## Acceptance criteria

- All tests T01–T16 pass in CI.
- Exactly one result exists per auction under any worker race and no late bid can win.
- A winner is never shown as having won, and a sale never as completed, before the host-signed result and the acknowledged or final payment are held.
