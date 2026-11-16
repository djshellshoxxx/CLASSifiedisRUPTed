# F01.S01.M02 — edit

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F01). **Parent:** F01.S01 ([listings](../SPEC.md)).

## Purpose and business behavior
Lets a listing owner change the editable fields of an existing listing: title, description, category, coarse region, price and currency. Each accepted change is one revision-checked, idempotent `listing.edit` command that commits a new revision and one `listing.updated` event. Changes to price, currency, region or category are material and are refused while offers are open on the listing, so a seller cannot change terms under a pending buyer. This module does not create, publish, archive or moderate listings, and it stores no precise location.

## User stories
- As a listing owner, I can correct a title, description, category or price and see the change take effect with a new revision.
- As a listing owner, I am told why an edit was refused (archived, offers open, field not editable, conflicting edit from another device) without my submitted text being echoed back.
- As a listing owner editing offline, my edit waits in a queue marked "not yet saved" and never overwrites a newer version silently.
- As a buyer with an open offer, I can rely on the price and region not changing while the offer is open.
- As an operator, I can disable editing without affecting listing creation, publishing or search.

## Scope
Ten canonical process specifications (see inventory below) covering:
- editable field set and its validation;
- `listing.edit` and `listing.get_for_edit` commands and the `listing.updated` event;
- transitions in `draft` and `published`, with `archived` and `hidden` refusing edits;
- owner-only authorization on `lst.update` and `lst.read`;
- idempotency, revision conflicts, offline device queue;
- privacy classes, rate limits, log redaction, budgets, tests, export, rollback.

Out of scope: listing creation (mod_create), publication (mod_publish), archive (mod_archive), listing type rules (02_listing_types), offers (04_pricing/mod_offers), moderation decisions (12_Moderation), attachments.

## Public interfaces
- Commands: `listing.edit` v1.0.0.
- Queries: `listing.get_for_edit` v1.0.0.
- Events: `listing.updated` v1.0.0 (no field values in payload).
- Errors: `EDIT.FIELD_NOT_EDITABLE`, `EDIT.VALIDATION_FAILED`, `EDIT.STATE_NOT_EDITABLE`, `EDIT.MATERIAL_CHANGE_BLOCKED`, plus shared `EVT.*` and `SYS.*` codes.
- Details: [commands_queries_events.md](commands_queries_events.md) (paths are in the module directory).

## Relationships, dependencies and integration
Upstream: F07 identity (owner `acc_` resolution), F16 authorization (`lst.update`), F10 classes, mod_offers (open-offer flag), F15 config for rate limits and flags. Downstream: discovery index (06_Discovery mod_index) on `listing.updated`; moderation re-screen (12_Moderation); notifications (13) for watchers, opt-in only. Listing owner record stays with F01. Integration uses contract tests and an explicit 5 s server budget, 10 s client timeout.

## Data ownership
This module owns only its idempotency records (7-day retention) and its `listing.updated` outbox rows. Listing fields are owned by the F01 listing aggregate. Offer state is owned by mod_offers. Precise location, contact details and payment evidence are owned elsewhere and never written here. Export and deletion follow CTR-PRV-001 retention classes.

## Risk considerations
Specific to edit: bait-and-switch (changing price or region after a buyer relied on the listing); lost updates from multi-device or offline edits; stale search index and federated copies showing old terms after an edit; prohibited content introduced after first screening; precise location slipped into free-text fields; edit churn used for spam or to evade search rules. No platform custody of money: edits create no payment, receipt or settlement evidence. Pseudonyms do not guarantee anonymity of the owner's activity over time.

## Completion criteria
All ten process specifications at SPEC-DRAFT-COMPLETE; open decisions D01, D03, D05, D07, D08 resolved or accepted as PROVISIONAL; implementation and tests in later phases; privacy, security and accessibility review pass; traceability from PS-003-01…10 to test IDs complete.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-003-01
- [x] [validation_rules.md](validation_rules.md) — PS-003-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-003-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-003-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-003-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-003-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-003-07
- [x] [observability_performance.md](observability_performance.md) — PS-003-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-003-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-003-10
