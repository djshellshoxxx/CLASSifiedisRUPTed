# F01.S02.M01 — sell

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F01). **Parent:** F01.S02 ([listing_types](../SPEC.md)).

## Purpose and business behavior
Sell is the fixed-price listing type. An owner offers one or more identical units (1–20) at one price in one currency. A buyer requests a unit; the owner accepts one request, which reserves a unit for 72 h while the parties arrange the exchange outside the platform. The module records a sale only after F09 reports a counterparty attestation (cash, other external) or external verification (on-chain). It never holds funds, never offers a buyer a price other than the listed one, and never marks a unit sold on a party's own claim.

## User stories
- As an owner, I can offer units at a fixed price while only a coarse region is shown, not my home address.
- As a buyer, I can request a unit and see whether it is available, reserved, held or sold, without seeing other requesters.
- As an owner, I can accept one request; price and quantity stay locked until that reservation ends.
- As a buyer, I am told why a reservation was released (cancelled, expired, or no sale).
- As an operator, I can turn off new sell listings by feature flag without breaking reservations already in progress.

## Scope
In scope: `listing_kind = sell` terms (price, currency, quantity, condition, pickup method, coarse region reference); purchase requests (`prq_`); reservation and release; sale recording and reversal from F09 claim states; HELD handling for disputes.

Out of scope: listing create, publish, edit and archive (F01.S01); offers and counteroffers (F01.S04 `mod_offers`); payment, claims and settlement (F09); meetup coordination and handoff (F08); federation transport (F11); moderation cases (F12).

## Public interfaces
Commands `sell.set_terms`, `sell.request_purchase`, `sell.accept_request`, `sell.decline_request`, `sell.withdraw_request`. Queries `sell.get_status`, `sell.list_requests`, `sell.get_request`. Events `listing.sell_terms_changed`, `listing.purchase_*`, `listing.reserved`, `listing.reservation_released`, `listing.sale_*`. Errors `SELL.*` plus shared `SYS.*`. Full contracts are in the process specs below.

## Relationships, dependencies and integration
Upstream: F01.S01 (`lst_` lifecycle, visibility, archive); F07 (`acc_` identity, account tier); F10 (data classes, retention); F15 (feature flags, idempotency infrastructure); F16 (capability enforcement). Downstream: F09 (`trx_` creation and cancellation; claim states drive sale recording); F12 (case on held sales; signals on repeated expiry); F13 (reservation notices, generic previews only per CTR-PRV-001 R10); F11 (PUBLIC sell terms only, when listing federation is on); F06 (region cells).

Contract gaps: PENDING CTR-ID-001 registration of the `prq` prefix; PENDING CTR-COM-001 transaction-level event for `trx_` create and cancel.

## Data ownership
Owns: the `sell` object on `lst_` (price, currency, quantity, condition, pickup method, `sell_state`, reservation reference) and `prq_` purchase requests. Does not own: core `lst_` fields (F01.S01), `trx_` and `clm_` evidence (F09), accounts (F07), region cells (F06, F10), moderation cases (F12). Export and deletion follow CTR-PRV-001 retention and legal holds.

## Risk considerations
Reservation hoarding by owners or buyers (72 h expiry; at most 3 open reservations per buyer). Bait-and-switch after a request (price and quantity locked while RESERVED or HELD). Fake sale records from self-submitted claims (rejected by design, CTR-COM-001 R06). Late attestation after release (moved to HELD). Duplicate accepts and replayed offline writes (revision checks, idempotency keys). Buyer linkage across repeated requests (responses never expose other requesters). Sale recording is attestation-based, not proof of payment or handover. No platform custody of money. Pseudonyms do not guarantee anonymity.

## Completion criteria
All ten PS-006 process specs approved; state rows T1–T10 covered by tests; quantity invariant holds under property tests; F09 sale-recording contract tested for claimed versus attested states; federation negative tests pass; privacy review (F10) and abuse review (F12) recorded; traceability from PS-006 IDs to TEST IDs complete.

## Required process specification inventory
- [x] `domain_schema.md` — PS-006-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-006-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-006-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-006-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-006-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-006-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-006-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-006-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-006-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-006-10, SPEC-DRAFT-COMPLETE (pending approval)
