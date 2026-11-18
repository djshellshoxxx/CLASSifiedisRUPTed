# F04.S02.M01 — anti

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F04). **Parent:** F04.S02.

## Purpose and business behavior
Implements the anti-sniping extension rule. If a bid is accepted by the server within the final window (default 120 seconds) before the effective end, the effective end moves to the bid time plus 120 seconds, up to 10 extensions per auction. The rule uses only server-accepted timestamps and a policy version pinned when the auction is created. It does not depend on who bids, so it cannot be used to identify bidders. Risk and reputation signals may flag an auction for review but never change the extension result.

## User stories
- As a seller, my auction is not ended by a last-second bid that leaves no time for other bidders to respond.
- As a bidder, I can see exactly when an auction will end and how many extensions have happened.
- As an operator, I can publish a new policy for future auctions only, with a second approver, and every extension is logged.

## Scope
- Owns: extension schedule per auction (`effective_end`, `extension_count`), extension log, policy records (`anti_policy`).
- Consumes: accepted bids (F04.S01.M02), close handoff (F04.S01.M03), advisory signals (F07.S03.M01, F12.S03.M02).
- Out of scope: bid validation (F04.S01.M02), last-second bid detection and reporting (F04.S02.M02 `mod_sniping`), fraud review (F04.S02.M03).

## Public interfaces
Commands `anti.evaluate_bid` (system), `anti.publish_policy` (operator, dual control); query `anti.get_schedule`; events `auction.extended`, `auction.extension_cap_reached`, `auction.schedule_ended`. Details in [commands_queries_events](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: F04.S01.M02 `mod_bids` (accepted bids), F04.S02.M02 `mod_sniping` (boundary: detection reports; PROVISIONAL), F07.S03.M01 `mod_reputation` and F12.S03.M02 `mod_signals` (advisory only). Downstream: F04.S02.M03 `mod_fraud` (advisory counts), F04.S01.M03 `mod_close` (final effective end). Contracts: CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Data ownership
Canonical owner of the extension schedule, extension log and `anti_policy` records: F04.S02.M01 (this module). Bid records: F04.S01.M02. Auction records: F04. Close records: F04.S01.M03. Consumers reference these by full ID.

## Risk considerations
- Bid-stalling by bots that bid in every final window.
- Collusion between accounts to prolong an auction.
- Out-of-order or duplicate bid events producing different schedules.
- Clock skew between nodes at the window boundary.
- Policy changes mid-auction that move the goalposts.
- Close reading a stale effective end.

## Completion criteria
All ten process specs (PS-036-01 to PS-036-10) are SPEC-DRAFT-COMPLETE; the boundary with F04.S02.M02 `mod_sniping` is confirmed; the slug rename is recorded; implementation and tests are later-phase gates.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-036-01
- [x] [validation_rules.md](validation_rules.md) — PS-036-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-036-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-036-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-036-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-036-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-036-07
- [x] [observability_performance.md](observability_performance.md) — PS-036-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-036-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-036-10
