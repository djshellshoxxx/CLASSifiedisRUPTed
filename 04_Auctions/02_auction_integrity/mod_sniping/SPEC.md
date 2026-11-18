# F04.S02.M02 — sniping

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead. **Parent:** F04.S02.

## Purpose and business behavior
Record and classify when each auction bid arrives relative to the auction's close, using server time only. The classification (NORMAL, LATE, SNIPE, UNCLASSIFIED) gives mod_close and mod_fraud one shared, authoritative timing fact. A snipe bid is not a violation by itself. This module never rejects, extends or penalizes a bid; it only records timing and exposes counts.

## User stories
- As a bidder, I see whether my bid was received before close, with a clear message if it was not.
- As a seller, I see aggregate last-window bid counts for my auction, never individual bidder timing.
- As a moderator, I can read timing detail for a case I am assigned to.

## Scope
- Timing classification for bids on auctions in 04_Auctions.
- Thresholds: SNIPE within 10 s of close, LATE within 120 s (PROVISIONAL).
- Out of scope: close and extension rules (01_auction_lifecycle/mod_close), fraud cases (mod_fraud), bid acceptance (mod_bids), payments (F09).

## Public interfaces
Command `sniping.timing.record`; queries `sniping.auction.timing_summary`; events `sniping.bid_classified`, `sniping.bid_rejected_after_close`, `sniping.clock_degraded`, `sniping.clock_restored`; errors `SNIPE.*`; capabilities `sniping.record`, `sniping.read_own`, `sniping.read_summary`, `sniping.read_detail`.

## Relationships, dependencies and integration
Upstream: mod_close (close_at), mod_bids (bid events), F07 pseudonymous accounts, F16 capabilities, F15 time source and event envelope. Downstream: mod_fraud (aggregate counts as CO_BID_CLUSTER feature), seller summary UI, F12 detail reads. Boundary to confirm: 02_auction_integrity/mod_anti may overlap on timing controls; this module owns classification only.

## Data ownership
Owns BidTimingEvent and clock-health stream. Does not own close times, bids or accounts.

## Risk considerations
Clock drift causes misclassification at the close boundary. Offline bids could be used to claim an early time if the client were trusted; they are not. Visible timing reveals bidder behavior and can link pseudonymous accounts. Sellers could infer bidders from small counts; k >= 5 suppression applies. Classification could be read as penalizing legitimate late bidders, so it stays advisory. Pseudonyms do not guarantee anonymity.

## Completion criteria
PS-038-01 to PS-038-10 SPEC-DRAFT-COMPLETE; boundary fixtures defined; boundary with mod_anti resolved; privacy review scheduled (not claimed as done).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-038-01
- [x] [validation_rules.md](validation_rules.md) — PS-038-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-038-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-038-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-038-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-038-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-038-07
- [x] [observability_performance.md](observability_performance.md) — PS-038-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-038-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-038-10
