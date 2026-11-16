# F04.S01.M01 — Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F04.S01](../SPEC.md). **Process IDs:** PS-035-01…PS-035-10. **Code:** `packages/auctions/src/auction_lifecycle/reserve`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

English ascending auctions on a listing, run only on a host relay that the seller chooses and that every bidder explicitly accepts at bid time (ADR-0016 section 6). The seller drafts the auction in the local vault (start price, hidden reserve, bid increment table, start and end 1 h to 14 d) and signs the terms; the chosen host relay countersigns a hosting acceptance and becomes the authority for bid order, time, soft close and close. The hidden reserve is committed by hash in the public terms and known only to the seller and the host. With no host selected, or a host that refuses or is unreachable, the auction feature is disabled for that auction and fails closed. The host is trusted for ordering and time and the UI says so.

## Responsibilities

- Own the Auction record in the seller vault (draft) and on the host relay (authoritative once scheduled), and the statements auction_terms (classrup.auctions.auction/v1), host_acceptance and auction_cancel.
- Validate terms - currency, start price, reserve commitment, increment table, duration 1 h to 14 d, start within 30 days - and refuse to schedule without a selected host (AUCTIONS_HOST_REQUIRED).
- Open scheduled auctions at the host-clock start time, keep currentEndsAt and price projections used by bids, and publish a public P0 projection that never contains the reserve, bidder identities or max bids.
- Allow cancellation by the seller only while the auction has zero bids, and by the host operator under hosting policy with a stated reason.

## Not responsible for

- Placing and ordering bids and proxy logic (F04.S01.M02) and closing and result (F04.S01.M03).
- Soft-close extensions (F04.S02.M02), shill controls (F04.S02.M01) and fraud review (F04.S02.M03).
- Listing content and media (F01.S01.M01); the auction references one auction-subtype listing.
- Payment and receipts (F09); winners and sellers settle through a local Deal in each vault.
- Future: Dutch and sealed-bid auctions, federated hosts that share one auction, and buy-it-now.

## User stories

- As a seller, I choose a host relay, see its name, operator policy and what it can and cannot do, set start price, hidden reserve and duration, and schedule the auction once the host countersigns.
- As a bidder, I see the host named on the auction, whether the reserve has been met (not its value), the next minimum bid and the end time with soft-close rules.
- As a seller with no bids, I can cancel; once a bid exists I cannot.

## Edge cases

- No host relay selected; schedule is refused with AUCTIONS_HOST_REQUIRED and the screen explains that auctions need a host the seller and bidders choose.
- Host relay refuses or does not answer within 60 s; the auction stays proposed, expires after 24 h as cancelled with reason host_unreachable, and the seller may choose another host.
- Seller edits the listing price or description after the first bid; the signed terms cid no longer matches, bids stay valid on the original terms, and the public page shows a notice that the listing changed after bidding.
- Reserve equals start price; allowed, and the reserve is shown as met after the first bid.
- Start time is in the past by the host clock; refused with VALIDATION_FAILED, never silently moved.
- Seller device clock is hours off; terms times are claims, the host stores its own receipt time and rejects terms whose start is more than 5 minutes before the host clock.
- Currency exponent is 0 (JPY) or 3 (BHD); the default increment table is converted by ceiling to at least one minor unit.
- Host operator removes the auction by hosting policy while it has bids; the auction stays visible to bidders as removed by host with a reason, and the case goes to F04.S02.M03 review.

## UX and accessibility

- Auction setup: listing picker, host relay picker with trust panel (operator name, region, policy link, retention, what the host can see), start price, hidden reserve (optional), duration chips (1 h, 24 h, 3 d, 7 d, 14 d), start now or schedule, increment table preview.
- Auction page: current price, next minimum bid, time left from host-signed time, reserve status (no reserve, reserve not met, reserve met), host panel, bid count, soft-close note.
- Seller dashboard: auctions by state with host sync line (prepared, delivered to host, accepted by host).

**States:** loading; empty; draft; proposed; scheduled; open; closed; cancelled; host-required; host-unreachable; pending-offline

**Accessibility:** Money fields have visible labels including currency and use inputmode=decimal.; Time left is text in an aria-live polite region updated at most once per 10 s, and the final minute announces once per 15 s.; Host trust panel is reachable by keyboard before the first bid and its text states host power in plain words.

## Owned data

- `Auction` (classrup.auctions.auction/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `auctions.auction.create`, `auctions.auction.schedule`, `auctions.auction.accept_hosting`, `auctions.auction.open`, `auctions.auction.cancel`, `auctions.auction.adjust_end`, `auctions.auction.mark_closed`
- Queries: `auctions.auction.get_public`, `auctions.auction.list_mine`
- Emits: `auctions.auction.scheduled`, `auctions.auction.opened`, `auctions.auction.cancelled`
- Consumes: `bazaar.listing.unpublished`, `bazaar.listing.expired`, `auctions.auction.closed`

## Dependencies

F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-035-01 | [Domain schema](domain_schema.md) | 3 |
| PS-035-02 | [Validation rules](validation_rules.md) | 3 |
| PS-035-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-035-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-035-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-035-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-035-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-035-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-035-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-035-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/auctions/src/auction_lifecycle/reserve/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- An auction cannot be scheduled or opened without a verified host countersignature and the UI always names the host.
- The reserve value never appears in any payload visible to bidders, in logs, or in errors.
