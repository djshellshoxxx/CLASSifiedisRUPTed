# F01.S04.M01 — offers

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F01). **Parent:** F01.S04.

## Purpose and business behavior
Lets a LocalBazaar buyer propose one price for one open listing. The seller can accept, reject or let the offer lapse. Accepting records a price agreement only: this module never holds, moves or confirms money and creates no settlement claim (CTR-COM-001 R01, R05). Offers are visible only to the buyer and seller of that listing. Public listing pages show no offer data.

## User stories
- As a buyer, I submit one price offer per listing under my pseudonym and see it as pending, accepted, rejected, withdrawn, expired or superseded.
- As a buyer on an unreliable connection, I see my offer as pending until the server acknowledges it.
- As a seller, I see offers on my own listings only, and accept, reject or let them expire.
- As an operator, I can disable new offer submissions without affecting existing offers, listings or messaging.

## Scope
Ten process specifications, all SPEC-DRAFT-COMPLETE:
- `domain_schema.md` (PS-011-01)
- `validation_rules.md` (PS-011-02)
- `workflow_state_machine.md` (PS-011-03)
- `commands_queries_events.md` (PS-011-04)
- `authorization_capabilities.md` (PS-011-05)
- `failure_recovery_idempotency.md` (PS-011-06)
- `privacy_retention_abuse.md` (PS-011-07)
- `observability_performance.md` (PS-011-08)
- `contract_and_acceptance_tests.md` (PS-011-09)
- `import_export_backup_rollback.md` (PS-011-10)

## Public interfaces
- Commands: `offer.submit`, `offer.withdraw`, `offer.accept`, `offer.reject`, `offer.expire` (sys only).
- Queries: `offer.get`, `offer.list_sent`, `offer.list_received`.
- Events: `offer.submitted`, `offer.accepted`, `offer.rejected`, `offer.withdrawn`, `offer.expired`, `offer.superseded`.
- Errors: `OFFER.AMOUNT_INVALID`, `OFFER.CURRENCY_MISMATCH`, `OFFER.LISTING_NOT_OPEN`, `OFFER.SELF_OFFER`, `OFFER.DUPLICATE_ACTIVE`, `OFFER.EXPIRY_INVALID`, `OFFER.EXPIRED`. Shared codes from `SYS`, `EVT`, `COM`.
- Canonical contracts: CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001. Every command carries an idempotency key and expected revision.

## Relationships, dependencies and integration
- Upstream: F07 accounts (`acc_`, account deletion), F01 listing state (PENDING F01 listing-state contract), F09 pinned quotes (`qte_`, CTR-COM-001 R04), F16 authorization decisions (CTR-CAP-001).
- Downstream: F13 notifications (generic text only), F12 moderation (case-scoped reads, block list), F15 observability.
- Excluded: F06 ranking must not read offer data (PS-011-07 R11).
- Integration needs contract tests and explicit timeout and retry rules (PS-011-06 R07).

## Data ownership
- This module owns the price-offer state machine and the price-offer fields in PS-011-01.
- Canonical owner of record class `offer`: F08.S02.M01, [08_Communications/02_negotiation/mod_offers](../../../08_Communications/02_negotiation/mod_offers/SPEC.md) (PS-063-01 to PS-063-10). PROVISIONAL, lead to confirm. Consumers reference offers by full ID only.
- Not owned here: listings (F01, `lst_`), quotes (F09, `qte_`), accounts (F07, `acc_`), messages (F08), payment evidence (F09).
- Export and deletion follow CTR-PRV-001 retention and legal-hold rules.

## Risk considerations
- Leakage of a buyer's offered price to third parties, which is the highest risk.
- Lowball and spam probing of sellers, and harassment through repeated offers.
- Race between accept and withdraw; replayed submits after offline reconnect.
- Offer data influencing ranking; an accepted offer being read as a completed sale.
- Pseudonyms do not hide the buyer from the seller on an offer. No anonymity is claimed.

## Completion criteria
All child SPEC/TODO chains exist; every process spec is implemented and tested in later phases; privacy/security review, error handling and traceability pass.

## Open items
- PENDING CTR-ID-001: registry row for the offer prefix (`ofr`, proposed opaque class).
- PENDING CTR-COM-001: registry entry for `COM.QUOTE_EXPIRED`.
- PENDING F01: listing-state contract (open, closed, sold) and listing-closed event.
- PENDING CTR-CAP-001: relation rule `listing_visitor` for `offer.create`.
- PROVISIONAL decisions (unapproved): D03 quotes, D05 location, D07 retention, D08 offline pending, D09 no custody, D10 keys.
- Canonical owner of `offer` (F08, PROVISIONAL; F01 is the alternative) needs lead decision.

## Required process specification inventory
- [x] `domain_schema.md` — PS-011-01 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-011-02 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-011-03 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-011-04 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-011-05 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-011-06 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-011-07 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-011-08 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-011-09 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-011-10 — SPEC-DRAFT-COMPLETE (pending approval)
