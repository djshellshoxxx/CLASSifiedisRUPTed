# F04.S01.M02 — bids

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F04). **Parent:** F04.S01.

## Purpose and business behavior
Accepts, validates and orders manual bids on an open auction (`auc_`). Each bid is a fixed amount in the auction currency, in integer minor units, with no currency conversion and no payment at bid time. The server orders bids by a sequence assigned under the auction lock, enforces a minimum increment and per-bidder rate limits, and emits outbid events. Proxy bidding is deferred. A bid is a commitment to buy at close, which mod_close converts into a claim; it is never a payment.

## User stories
- As a bidder, I place a bid that is either accepted with a clear sequence position or rejected with the reason (increment, closed, currency).
- As a bidder, my bidding identity is a pseudonym other users see; my account is never shown.
- As a seller, I am prevented from bidding on my own auction, and suspicious bidding patterns are flagged for review.

## Scope
- Owns: bid records (`bid_`, opaque), placement and ordering, minimum-increment and rate-limit enforcement, outbid and void events.
- Consumes: auction state and revision (F04), reserve status (F04.S01.M01), sessions and eligibility (F07.S01.M02), reputation and signals (F07.S03.M01, F12.S03.M02).
- Out of scope: auction close and winner claims (F04.S01.M03), extension rules (F04.S02.M01), fraud review (F04.S02.M03).

## Public interfaces
Commands `bids.place`, `bids.void`; queries `bids.list_history`, `bids.get_own`; events `bids.bid.accepted`, `bids.bid.outbid`, `bids.bid.rejected`, `bids.bid.voided`. Details in [commands_queries_events](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: F04.S01.M01 `mod_reserve`, F07.S01.M02 `mod_sessions`. Downstream: F04.S01.M03 `mod_close`, F04.S02.M01 `mod_anti`, F04.S02.M02 `mod_sniping`. Contracts: CTR-EVT-001, CTR-CAP-001, CTR-ID-001, CTR-SCH-001, CTR-ERR-001.

## Data ownership
Canonical owner of bid records: F04.S01.M02 (this module), keyed by `bid_` (opaque). Canonical owner of auction records and `auc_` IDs: F04. Winner claims: F09 (`clm_`) via F04.S01.M03. Consumers reference these by full ID.

## Risk considerations
- Shill bidding by sellers or affiliated accounts.
- Race conditions at the last moments before end.
- Replay or duplicate placement from retries.
- Bidder identity exposure through timing or event payloads.
- Offline bids that arrive after the auction closed.
- Rate-limit evasion with multiple accounts (Sybil, see F07).

## Completion criteria
All ten process specs (PS-033-01 to PS-033-10) are SPEC-DRAFT-COMPLETE; `bid` prefix confirmed as opaque in CTR-ID-001; proxy bidding recorded as Future scope; implementation and tests are later-phase gates.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-033-01
- [x] [validation_rules.md](validation_rules.md) — PS-033-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-033-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-033-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-033-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-033-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-033-07
- [x] [observability_performance.md](observability_performance.md) — PS-033-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-033-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-033-10
