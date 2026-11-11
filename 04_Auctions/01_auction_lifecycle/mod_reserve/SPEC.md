# F04.S01.M01 — Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F04.S01](../SPEC.md). **Process IDs:** PS-035-01…PS-035-10. **Code:** `packages/auctions/src/auction_lifecycle/reserve`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

English ascending auctions on a listing, run only on a host relay that the seller chooses and that every bidder explicitly accepts at bid time (ADR-0016 section 6). The seller first creates a draft Auction in the local vault (start price, hidden reserve, bid increment table, start and end 1 h to 14 d), uses its id as the subtypeRef of an auction listing, publishes the listing, and then signs the terms, which pin the listing projection cid, an acceptBy deadline and the soft-close rules version. The chosen host relay countersigns a hosting acceptance before acceptBy and becomes the authority for bid order, time, soft close and close; every host decision reaches the vault as a host-signed statement. The hidden reserve is committed by hash in the public terms and travels to the host only end-to-end encrypted to its key. With no host selected, or a host that refuses or is unreachable, the auction feature is disabled for that auction and fails closed; a vault never cancels silently, and a host that stops answering leaves the auction in host_silent. The host is trusted for ordering and time and the UI says so.

## Responsibilities

- Own the Auction record in the seller vault (draft) and on the host relay (authoritative once scheduled), and the statements auction terms (classrup.auctions.auction/v1), host_acceptance, auction_cancel, auction_opened and host_cancel.
- Validate terms - currency, start price, reserve commitment, increment table, duration 1 h to 14 d, start within 30 days, acceptBy, softCloseRulesVersion softclose-v1 and the pinned listing cid - and refuse to schedule without a selected host (AUCTIONS_HOST_REQUIRED).
- Open scheduled auctions at the host-clock start time, keep currentEndsAt and price projections used by bids, and publish a public P0 projection that never contains the reserve, bidder identities or max bids.
- Allow cancellation by the seller only while the auction has zero bids, and by the host operator under hosting policy with a stated reason, always confirmed by a host-signed host_cancel statement.
- Answer the listing edit-lock query that F01.S01.M02 uses to refuse material listing edits while the auction has bids (N11).

## Not responsible for

- Placing and ordering bids and proxy logic (F04.S01.M02) and closing and result (F04.S01.M03).
- Soft-close extensions (F04.S02.M02), shill controls (F04.S02.M01) and fraud review (F04.S02.M03).
- Listing content and media (F01.S01.M01) and the refusal of material listing edits (F01.S01.M02); the auction references one auction-kind listing whose subtypeRef is the auction.
- Payment and receipts (F09); winners and sellers settle through a local Deal in each vault.
- Future: Dutch and sealed-bid auctions, federated hosts that share one auction, and buy-it-now.

## User stories

- As a seller, I choose a host relay, see its name, operator policy and what it can and cannot do, set start price, hidden reserve and duration, and schedule the auction once the host countersigns.
- As a bidder, I see the host named on the auction, whether the reserve has been met (not its value), the next minimum bid and the end time with soft-close rules.
- As a seller with no bids, I can cancel; once a bid exists I cannot.
- As a seller whose host stopped answering, I see that the host did not report a result and my listing is released, and a later valid host statement still counts.

## Edge cases

- No host relay selected; schedule is refused with AUCTIONS_HOST_REQUIRED and the screen explains that auctions need a host the seller and bidders choose.
- Host relay refuses or does not answer within 60 s; the auction stays proposed; the signed terms carry acceptBy = min(signing time + 24 h, startsAt + 5 min) and the host refuses acceptance after it; a refusal arrives as host_cancel with reason host_refused; at acceptBy without acceptance the vault sends a signed auction_cancel and waits in cancel_pending until the host answers, and the seller may then choose another host.
- Seller tries to edit the listing after the first bid; F01.S01.M02 asks auctions.auction.edit_lock and refuses material edits (price, condition, category) while bidCount > 0 (N11); non-material edits are allowed, the host records each new projection cid in listingCidHistory, and the auction page shows that the listing text was edited after bidding.
- Reserve equals start price; allowed, and the reserve is shown as met after the first bid.
- Start time is in the past by the host clock; refused with VALIDATION_FAILED, never silently moved.
- Seller device clock is hours off; terms times are claims, the host stores its own receipt time and rejects terms whose start is more than 5 minutes before the host clock.
- Currency exponent is 0 (JPY) or 3 (BHD); the default increment table is converted by ceiling to at least one minor unit.
- Host operator removes the auction by hosting policy while it has bids; the host signs host_cancel with reason host_policy, vaults show removed by host with the reason, live bids become void, and the case goes to F04.S02.M03 review.
- The host accepted but the acceptance was lost and acceptBy passes; the vault sends auction_cancel; with zero bids the host cancels and returns host_cancel; with bids it refuses with AUCTIONS_HAS_BIDS and returns its acceptance and auction_opened statements, and the vault shows the auction open.
- The host disappears after scheduling; with no auction_opened, result or host_cancel by scheduledEndsAt plus 60 minutes plus 72 h the vault moves the auction to host_silent, releases the listing lock and shows host did not report a result; a later valid host statement still applies.
- Draft-first creation; the seller creates the draft Auction without a listing, creates the auction listing with subtypeRef {slug auctions, entity Auction, id}, publishes it and then schedules; schedule refuses an unpublished listing with AUCTIONS_LISTING_NOT_ELIGIBLE, create does not.
- Terms name an unknown softCloseRulesVersion; refused with VALIDATION_FAILED by the vault and by the host.

## UX and accessibility

- Auction setup: listing picker or create auction listing, host relay picker with trust panel (operator name, region, policy link, retention, what the host can see including the reserve and every bid in plaintext), start price, hidden reserve (optional, with the note that a proxy maximum lifting the price exactly to the reserve reveals it), duration chips (1 h, 24 h, 3 d, 7 d, 14 d), start now or schedule, increment table preview.
- Auction page: current price, next minimum bid, time left from host-signed time, reserve status (no reserve, reserve not met, reserve met), host panel, bid count, soft-close note naming rules version softclose-v1, listing-edited notice when applicable.
- Seller dashboard: auctions by state with host sync line (prepared, delivered to host, accepted by host), cancel requested, host did not answer (with Release anyway after a warning) and host did not report a result.

**States:** loading; empty; draft; proposed; cancel-pending; scheduled; open; closed; cancelled; host-silent; needs-host-check; host-required; host-unreachable; pending-offline

**Accessibility:** Money fields have visible labels including currency and use inputmode=decimal.; Time left is text in an aria-live polite region updated at most once per 10 s, and the final minute announces once per 15 s.; Host trust panel is reachable by keyboard before the first bid and its text states host power in plain words.

## Owned data

- `Auction` (classrup.auctions.auction/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `auctions.auction.create`, `auctions.auction.schedule`, `auctions.auction.accept_hosting`, `auctions.auction.open`, `auctions.auction.cancel`, `auctions.auction.apply_cancel`, `auctions.auction.receive`, `auctions.auction.adjust_end`, `auctions.auction.mark_closed`
- Queries: `auctions.auction.get_public`, `auctions.auction.list_mine`, `auctions.auction.edit_lock`
- Emits: `auctions.auction.scheduled`, `auctions.auction.opened`, `auctions.auction.cancelled`
- Consumes: `bazaar.listing.unpublished`, `bazaar.listing.expired`, `auctions.auction.closed`, `privacy.deletion.completed`

## Dependencies

F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F12.S03.M04, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-035-01 | [Domain schema](domain_schema.md) | 4 |
| PS-035-02 | [Validation rules](validation_rules.md) | 4 |
| PS-035-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-035-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-035-05 | [Authorization and capabilities](authorization_capabilities.md) | 4 |
| PS-035-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-035-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-035-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-035-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-035-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/auctions/src/auction_lifecycle/reserve/index.ts`.

## Acceptance criteria

- All tests T01–T24 pass in CI.
- An auction cannot be scheduled or opened without a verified host countersignature and the UI always names the host.
- The reserve value never appears in any payload visible to bidders, in logs, or in errors.
- No vault cancels a proposed auction without telling the host, and every live auction ends in closed, cancelled or host_silent.
