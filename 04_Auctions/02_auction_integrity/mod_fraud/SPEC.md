# F04.S02.M03 — Auction fraud review

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F04.S02](../SPEC.md). **Process IDs:** PS-037-01…PS-037-10. **Code:** `packages/auctions/src/auction_integrity/fraud`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Moderators of the host relay review auctions flagged for fraud - shill suspicion from F04.S02.M01, user reports this relay received (moderation.report.received) on the auction, its listing or its bids, repeated winner non-payment, listing edits after bids, or a manual decision. A review gathers a frozen evidence snapshot (listing and bids through F12.S01.M02, and the ledger head, extensions and result by their host-signed cids), lets a moderator dismiss it, cancel a still-open auction, or void a result. Voiding needs two different moderators (propose and confirm) and produces a host-signed void statement - the host's finding under its own hosting policy, not a global ruling - sent to the seller and all bidders. The host checks only facts it holds (a won result, not already voided, closed at most 60 days ago); each vault applies the void by its own payment state (F04.S01.M03), so no vault voids over an acknowledged or final payment, and a void never cancels a Deal. Each void is recorded as a host-policy EnforcementAction in F12.S02.M01 so it can be appealed; a successful appeal yields a host-signed rescission that vaults show as advisory, without reopening the sale.

## Responsibilities

- Own AuctionReview on the host - its queue, priority, triggers with per-check outcomes, evidence snapshot references, findings and decision.
- Open reviews from consumed triggers (shill score 85 or more, received reports about the auction, its listing or its bids, 2 or more winner non-payments in 30 days, listing edits after bids) or by a moderator, with at most one open review per auction into which later triggers are merged.
- Execute decisions - dismiss, cancel an open auction through F04.S01.M01 apply_cancel with reason host_policy, or void a result with a reason from shill_bidding, seller_fraud, bidder_collusion, listing_prohibited, technical_error.
- Distribute the host-signed void statement to participant vaults, record the void as a host-policy EnforcementAction through F12.S02.M01 moderation.action.record_host_policy, and issue an advisory rescission statement after an overturned appeal.

## Not responsible for

- Detection and scoring (F04.S02.M01), result creation and settlement states (F04.S01.M03 decides in each vault how a void applies).
- Account-wide or network-wide sanctions; none exist, a host can only restrict its own hosting (ADR-0016 section 8).
- Refunding, recovering money or cancelling Deals; the platform holds none, parties settle directly, cancel Deals by mutual signed cancel and may open F09.S02.M02 disputes.
- Appeals handling (F12.S01.M03); this module only consumes the appeal outcome and issues an advisory rescission.
- Future: community juries and cross-host sharing of signed findings between peers.

## User stories

- As a host moderator, I open a review from a flagged bidder, see a frozen evidence snapshot and decide within the review window.
- As a second moderator, I confirm or reject a proposed void so no single moderator can void a sale alone.
- As a bidder, I am told when a result I took part in was voided, with the reason category and no accusation of a named person.
- As a seller, I can appeal a void through the host's appeal process; a successful appeal gives a host-signed withdrawal of the finding that vaults show as advisory, and it does not reopen the auction.

## Edge cases

- The winner's vault already holds an acknowledged payment when the void arrives; the host cannot know this and issues the void anyway; that vault records it as void after payment, changes nothing, and points the parties to F09.S02.M02 disputes.
- The moderator who proposed a void tries to confirm it; refused with FORBIDDEN, a second moderator is required.
- Two triggers (a report and a shill flag) arrive for the same auction at once; the review is opened once, both triggers are attached, and auctions.review.opened is emitted again with merged true and the full triggers list.
- The auction is still open; the moderator may cancel it with reason host_policy, which voids live bids; the seller and bidders get the cancelled notice from the host-signed host_cancel.
- A void is confirmed while a second-chance offer is outstanding; the offer is withdrawn when the void statement is received.
- Void statement is lost in transit; mailboxes retry for 30 days and the public result projection shows voided so bidders see it on next fetch.
- A void is appealed through F12.S01.M03 against its EnforcementAction; an overturned outcome makes the host issue classrup.auctions.void_rescission/v1, which vaults show next to the voided result as advisory; it reopens nothing, the review stays voided, and a Deal both parties kept can still complete.
- A host moderator is a bidder in the auction, or holds a key F04.S02.M01 links to a bidder or the seller; assignment is refused (FORBIDDEN) and the review goes to another moderator.
- A void is attempted on an unsold result, an already voided result, or a result closed more than 60 days ago; refused with AUCTIONS_RESULT_NOT_VOIDABLE.
- Two flagged bidders in one auction, only one confirmed by the findings; confirmedCheckIds lists only that bidder's check, and F04.S02.M01 dismisses the other.
- A received report (moderation.report.received) targets the auction (targetType auction), its listing (targetType listing) or one of its bids (targetType bid); the host maps it to the auction through the auction id, Auction.listingId or Bid.auctionId, merges it into the auction's review with ref receiptId and adds its snapshotId to the evidence; moderation.report.filed stays in the reporter's vault (EVT-8) and never reaches the host.
- An appeal against the void's EnforcementAction is decided reduced; F12.S02.M01 replaces the host-policy action as reducedTo describes, the review records the outcome and reducedTo, the void stays issued and no rescission is signed; a copy of moderation.appeal.decided derived in the appellant's vault (origin vault) is ignored.

## UX and accessibility

- Review queue for moderators: priority, triggers, age, auction link, score; filters by status; keyboard-sortable table.
- Review detail: frozen evidence (listing and bid snapshots, ledger summary at the frozen head, extension history, check reasons, result), per-check confirm toggles, findings editor (up to 2000 characters), decision buttons with confirmation dialog naming the consequence.
- Participant notice: This result was voided by the host (reason category). No funds were held by the platform. Your Deal, if any, stays between you and the other party until both of you cancel it; payments you already acknowledged are handled by opening a dispute. Appeal link. When rescinded: The host withdrew this finding on appeal; the auction is not reopened.

**States:** loading; empty; opened; in-review; void-proposed; voided; rescinded; dismissed; forbidden; pending-offline

**Accessibility:** Queue and detail are fully keyboard operable; decision buttons are at least 44x44 px with accessible names that include the consequence.; Void confirmation dialog traps focus, names the auction and the reason, and announces the result through a polite live region.; Priority is a text label plus icon, never colour alone.

## Owned data

- `AuctionReview` (classrup.auctions.review/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `auctions.review.open`, `auctions.review.assign`, `auctions.review.dismiss`, `auctions.review.cancel_auction`, `auctions.review.propose_void`, `auctions.review.confirm_void`, `auctions.review.rescind_void`, `auctions.review.receive_void`
- Queries: `auctions.review.list`, `auctions.review.get`
- Emits: `auctions.review.opened`, `auctions.result.voided`, `auctions.review.closed`
- Consumes: `auctions.shill.suspected`, `moderation.report.received`, `auctions.result.non_payment`, `auctions.auction.closed`, `bazaar.listing.edited`, `moderation.appeal.decided`, `privacy.deletion.completed`

## Dependencies

F04.S01.M01, F04.S01.M02, F04.S01.M03, F04.S02.M01, F04.S02.M02, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-037-01 | [Domain schema](domain_schema.md) | 3 |
| PS-037-02 | [Validation rules](validation_rules.md) | 3 |
| PS-037-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-037-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-037-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-037-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-037-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-037-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-037-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-037-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/auctions/src/auction_integrity/fraud/index.ts`.

## Acceptance criteria

- All tests T01–T24 pass in CI.
- No result is voided without two different moderators, and no vault applies a void over an acknowledged or final payment.
- Participants only ever see a reason category and a host-signed statement, never evidence or other parties' keys.
- Every void is appealable through its EnforcementAction, and a successful appeal is shown as an advisory host-signed rescission.
