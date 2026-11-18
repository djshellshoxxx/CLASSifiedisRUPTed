# F02.S01.M03 — offer (`mod_offer`)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (accountable role). **Parent:** [F02.S01 trade_proposals](../SPEC.md). **Registry:** PS-013-01 to PS-013-10. **Canonical contracts:** CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-SCH-001. **Open decisions:** D03, D05, D07, D08, D10 (PROVISIONAL defaults, unapproved).

## Purpose and business behavior
A barter offer is one party's immutable statement of what it gives and what it wants, inside one participant slot (`par_`) of a barter cycle proposal (`cyc_`). Revisions are append-only and frozen when the cycle locks. An offer transfers no items, promises no delivery and moves no money.

Out of scope: counteroffers (F02.S01.M04), price offers (`mod_offers`, F01.S04.M01 and F08.S02.M01; different record classes, referenced by full ID only), valuation (F02.S04).

## User stories
- As a party, I list the items I give and the items or categories I want, with an expiry, under my pseudonym.
- As a party, I submit a new revision or withdraw before lock, and I see which revision is in force.
- As a party, I see why an offer was refused (listing unavailable, line limit, expired, quote stale) without seeing other parties' private data.

## Scope
- PS-013-01 domain schema; PS-013-02 validation rules; PS-013-03 workflow state machine
- PS-013-04 commands, queries and events; PS-013-05 authorization and capabilities
- PS-013-06 failure, recovery and idempotency; PS-013-07 privacy, retention and abuse
- PS-013-08 observability and performance; PS-013-09 contract and acceptance tests
- PS-013-10 import, export, backup and rollback

## Public interfaces
Commands `offer.draft.create`, `offer.submit`, `offer.withdraw`; queries `offer.get`, `offer.list_for_cycle`; events `offer.submitted|superseded|withdrawn|expired|locked|closed`. Signatures and idempotency rules: PS-013-04.

## Relationships, dependencies and integration
Upstream: F02.S01.M02 `mod_party` (slot status), F01.S01.M01 `mod_create` (listing ownership), F02.S01.M01 `mod_two` (cycle lock and close), F01.S03.M01 `mod_availability` (line availability). Downstream: F02.S02.M05 `mod_feasibility` reads submitted lines; F02.S01.M04 `mod_counteroffer` references `ofr_` by ID. Valuation references `qte_` owned by F09.S03 (CTR-COM-001). Contract tests: PS-013-09.

## Data ownership
Owns `ofr_` revisions and their status. Does not own listings, slots, cycles, quotes or messages.

## Risk considerations
- Bait-and-switch: a give listing is edited after submit. Mitigated by lock-time re-check and `content_digest` (PS-013-02 R02, PS-013-07 R04).
- Stale availability: items sold elsewhere. Availability comes from F01.S03.M01; a lock does not guarantee handover.
- Inventory probing: lines are visible only to cycle participants.
- Notes used as a contact or location channel: contact scan, no location fields.
- Replay and double submit: idempotency keys and `expected_revision`.
- Pseudonyms do not guarantee anonymity; listing content can re-identify a party.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE. Implementation, tests and privacy/security review are deferred to later phases; nothing here is audited.

## Required process specification inventory
- [x] domain_schema.md (PS-013-01)
- [x] validation_rules.md (PS-013-02)
- [x] workflow_state_machine.md (PS-013-03)
- [x] commands_queries_events.md (PS-013-04)
- [x] authorization_capabilities.md (PS-013-05)
- [x] failure_recovery_idempotency.md (PS-013-06)
- [x] privacy_retention_abuse.md (PS-013-07)
- [x] observability_performance.md (PS-013-08)
- [x] contract_and_acceptance_tests.md (PS-013-09)
- [x] import_export_backup_rollback.md (PS-013-10)
