# F04.S02.M03 — Auction fraud review

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F04.S02](../SPEC.md). **Process IDs:** PS-037-01…PS-037-10. **Code:** `packages/auctions/src/auction_integrity/fraud`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Moderators of the host relay review auctions flagged for fraud - shill suspicion from F04.S02.M01, user reports, repeated winner non-payment, or a manual decision. A review gathers a frozen evidence snapshot (ledger, extensions, checks, result), lets a moderator dismiss it, cancel a still-open auction, or void a result. Voiding needs two different moderators (propose and confirm) and produces a host-signed void statement sent to the seller and all bidders. Voiding applies only to results without an acknowledged payment, because the platform holds no funds and cannot reverse payments. A void is the host's finding under its own hosting policy, not a global ruling; enforcement against the seller or bidder is a hosting-policy action on that host through F12.

## Responsibilities

- Own AuctionReview on the host - its queue, priority, evidence snapshot reference, findings and decision.
- Open reviews from consumed triggers (shill score 85 or more, reports on an auction, 2 or more winner non-payments in 30 days) or by a moderator, at most one open review per auction and trigger kind.
- Execute decisions - dismiss, cancel an open auction through F04.S01.M01 with reason host_policy, or void a result with a reason from shill_bidding, seller_fraud, bidder_collusion, listing_prohibited, technical_error.
- Distribute the host-signed void statement and deliver it to participant vaults, and hand a recommendation to F12.S02.M01 for hosting-policy enforcement.

## Not responsible for

- Detection and scoring (F04.S02.M01), result creation and settlement states (F04.S01.M03 applies the voided state).
- Account-wide or network-wide sanctions; none exist, a host can only restrict its own hosting (ADR-0016 section 8).
- Refunding or recovering money; the platform holds none, parties settle directly and may open F09.S02.M02 disputes.
- Appeals handling (F12.S01.M03); this module only consumes the appeal outcome.
- Future: community juries and cross-host sharing of signed findings between peers.

## User stories

- As a host moderator, I open a review from a flagged bidder, see a frozen evidence snapshot and decide within the review window.
- As a second moderator, I confirm or reject a proposed void so no single moderator can void a sale alone.
- As a bidder, I am told when a result I took part in was voided, with the reason category and no accusation of a named person.
- As a seller, I can appeal a void through the host's appeal process.

## Edge cases

- The result already has an acknowledged payment; the void is refused with AUCTIONS_RESULT_NOT_VOIDABLE and the review can only recommend hosting-policy action or point the parties to F09 disputes.
- The moderator who proposed a void tries to confirm it; refused with FORBIDDEN, a second moderator is required.
- Two triggers (a report and a shill flag) arrive for the same auction at once; the review is opened once and both triggers are attached.
- The auction is still open; the moderator may cancel it with reason host_policy, which voids live bids; the seller and bidders get the cancelled notice.
- A void is confirmed while a second-chance offer is outstanding; the offer is withdrawn when the void statement is received.
- Void statement is lost in transit; mailboxes retry for 30 days and the public result projection shows voided so bidders see it on next fetch.
- A moderator dismisses a review after a successful appeal elsewhere; the dismissal does not undo a void already issued.
- A host moderator is also a bidder in the auction; conflict check refuses assignment (FORBIDDEN) and the review goes to another moderator.

## UX and accessibility

- Review queue for moderators: priority, trigger, age, auction link, score; filters by status; keyboard-sortable table.
- Review detail: frozen evidence snapshot (ledger summary, extension history, check reasons, result), findings editor (up to 2000 characters), decision buttons with confirmation dialog naming the consequence.
- Participant notice: This result was voided by the host (reason category). No funds were held by the platform; settle any payments you made directly, or open a dispute. Appeal link.

**States:** loading; empty; opened; in-review; void-proposed; voided; dismissed; forbidden; pending-offline

**Accessibility:** Queue and detail are fully keyboard operable; decision buttons are at least 44x44 px with accessible names that include the consequence.; Void confirmation dialog traps focus, names the auction and the reason, and announces the result through a polite live region.; Priority is a text label plus icon, never colour alone.

## Owned data

- `AuctionReview` (classrup.auctions.review/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `auctions.review.open`, `auctions.review.assign`, `auctions.review.dismiss`, `auctions.review.cancel_auction`, `auctions.review.propose_void`, `auctions.review.confirm_void`, `auctions.review.receive_void`
- Queries: `auctions.review.list`, `auctions.review.get`
- Emits: `auctions.review.opened`, `auctions.result.voided`, `auctions.review.closed`
- Consumes: `auctions.shill.suspected`, `moderation.report.filed`, `auctions.result.non_payment`, `auctions.auction.closed`, `moderation.appeal.decided`

## Dependencies

F04.S01.M01, F04.S01.M03, F04.S02.M01, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-037-01 | [Domain schema](domain_schema.md) | 3 |
| PS-037-02 | [Validation rules](validation_rules.md) | 3 |
| PS-037-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-037-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-037-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-037-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-037-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-037-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-037-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-037-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/auctions/src/auction_integrity/fraud/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No result is voided without two different moderators, and no result with an acknowledged payment is ever voided.
- Participants only ever see a reason category and a host-signed statement, never evidence or other parties' keys.
