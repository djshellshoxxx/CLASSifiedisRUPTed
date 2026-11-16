# F01.S02.M03 — giveaway

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead. **Parent:** [F01.S02 listing_types](../SPEC.md).

## Purpose and business behavior
Giveaway is a listing type for items offered at zero consideration. A giver publishes an item, recipients submit claims, the giver selects one claimant, and the pair records a self-reported handover and receipt. The module creates no payment, escrow, settlement or custody state. Its claim records are the only data it owns. All transitions are explicit, authorized, auditable and recoverable.

## User stories
- As a giver, I publish a giveaway with no price field, review claims, accept one claimant, and rescind or record handover.
- As a claimant, I submit one claim per giveaway with a coarse pickup area, withdraw it, and see why a claim closed.
- As an operator, I disable giveaway claims with a feature flag without affecting ordinary listings or other listing types.

## Scope
Process specifications (all 10 in the inventory below). In scope: giveaway listing extension rules, claim lifecycle, claim queries, giver and claimant views, expiry and rollback. Out of scope: listing publication and archive (F01 mod_publish, mod_archive), messaging (F08), reporting and case handling (F12), disputes over item condition (F09 pattern, Future).

## Public interfaces
Commands and queries `giveaway.claim.*` and events `giveaway_claim.*` in [commands_queries_events](commands_queries_events.md). Errors `GIVE.*` in [validation_rules](validation_rules.md). Listing reads use F01 `lst_` IDs.

## Relationships, dependencies and integration
Upstream: F01 listing record (`lst_`, PENDING CTR-LST-001); F07 identity and `acc_`/`prf_` views; F16 capabilities; F10 retention and classes. Downstream: F13 generic notifications; F12 reports on bait listings; F08 coordination threads (no claim text stored here); F15 flags and observability; F11 listing federation. Integration uses reserve/reopen commands on F01 through an outbox with idempotent retries.

## Data ownership
This module owns `giveaway_claim` records (`gcl_`, PENDING registry entry in CTR-ID-001). It does not own the listing, identity, messages, location precision or any payment record. Ownership of `lst_` stays with F01; this module references it by ID only.

## Risk considerations
Risks specific to giveaways:
- Bait listings used to lure people into meetups or harvest contact data.
- Claim lists exposing who wants which item (PRIVATE_PERSONAL), including to the giver beyond pseudonym.
- Pickup at home addresses if a precise point leaks into claim or listing fields.
- Pseudonym farms claiming every giveaway; Sybil effects with pseudonyms, which do not guarantee anonymity.
- Two accepts racing on one listing; partial failure between claim commit and F01 reserve.
- Self-reported handover read as a verified transfer.
No platform custody of items or money.

## Completion criteria
All 10 process specs reach approved status; contract IDs resolved (PENDING CTR-LST-001, gcl_ registry); privacy and abuse review by F10 and F12; race and replay tests pass; rollback drill passes.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [validation_rules.md](validation_rules.md) — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [commands_queries_events.md](commands_queries_events.md) — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [observability_performance.md](observability_performance.md) — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — SPEC-DRAFT-COMPLETE (pending approval)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — SPEC-DRAFT-COMPLETE (pending approval)
