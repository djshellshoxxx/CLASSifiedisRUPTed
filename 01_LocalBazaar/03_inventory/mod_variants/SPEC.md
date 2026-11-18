# F01.S03.M02 — variants

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** Marketplace Lead (accountable role). **Parent:** F01.S03 (inventory). **Canonical record owner:** this module, for variant rows only.

## Purpose and business behavior
Lets a seller describe up to 25 distinct options of one listing (for example size, colour or pack size) so a buyer or counterparty can name the exact option wanted. Variants describe what is offered. They do not hold stock counts (F01.S03.M01 mod_availability) and do not set money terms (F09.S03). A variant belongs to its listing aggregate and inherits the listing's visibility, moderation state and retention.

## User stories
- As a seller, I add a variant with two attributes (size and colour) and archive one I no longer offer, without losing the history of past offers.
- As a buyer, I see only active variants, each with a label a screen reader announces in full, and cannot select an archived variant.
- As a moderator, I hide a listing and all its variants in one action.

## Scope
Ten process specifications under this directory (see inventory below). Attribute-key registry and variant ID prefix are PROVISIONAL until listed in the contracts.

## Public interfaces
Commands: `listing.variant_add`, `listing.variant_update`, `listing.variant_archive`. Query: `listing.variants_get`. Events: `listing.variant_added`, `listing.variant_updated`, `listing.variant_archived`. Error module code: `VARIANT`. Details in PS-009-04.

## Relationships, dependencies and integration
Upstream: F01.S01.M02 (listing edit, owns listing revision); F01.S03.M01 (availability reads active variant IDs); F09.S03.M03 (precision, only for the Future `price_minor` field). Downstream: F02.S02.M05 (feasibility reads active variant IDs; receives `listing.variant_archived`). Shared contracts: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001.

## Data ownership
Owns variant rows and their history. Does not own the listing, stock counts, prices of record, messages or moderation cases. Variant ID prefix is not in the CTR-ID-001 registry: PENDING CTR-ID-001 (proposed `var`, class ulid).

## Risk considerations
Variant stuffing (many near-duplicate options as spam), misleading or personal-data labels, a variant archived while a proposal references it, concurrent edits from two devices, offline edits replayed after a conflicting change, and labels that screen readers cannot announce. Pseudonyms do not guarantee anonymity, so labels must not carry personal data; the PII heuristic in PS-009-02 is a signal, not a guarantee.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; PENDING items resolved or recorded; privacy and accessibility review scheduled; traceability to TEST-PS-009-* passes at implementation.

## Required process specification inventory
- [x] `domain_schema.md` — PS-009-01
- [x] `validation_rules.md` — PS-009-02
- [x] `workflow_state_machine.md` — PS-009-03
- [x] `commands_queries_events.md` — PS-009-04
- [x] `authorization_capabilities.md` — PS-009-05
- [x] `failure_recovery_idempotency.md` — PS-009-06
- [x] `privacy_retention_abuse.md` — PS-009-07
- [x] `observability_performance.md` — PS-009-08
- [x] `contract_and_acceptance_tests.md` — PS-009-09
- [x] `import_export_backup_rollback.md` — PS-009-10
