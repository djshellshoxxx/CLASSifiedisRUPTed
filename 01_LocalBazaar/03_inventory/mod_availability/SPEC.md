# F01.S03.M01 — availability

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F01). **Parent:** [F01.S03 inventory](../SPEC.md).

## Purpose and business behavior
Tracks how many units of a sell or giveaway listing can still be offered: total units, units held for open offers, and units the seller has committed. A buyer's offer reserves units for a stated period so two buyers cannot both be promised the last unit. A seller can pause a listing so no new offers reserve it, without withdrawing offers already made. "Sold out" is shown only when the counts say so. Counts are seller-attested. The platform does not confirm payment, handover or delivery, and holds no goods or funds. Wanted listings have no availability record.

## User stories
- As a seller, I set how many units I have and see how many are held or committed, without seeing who holds them.
- As a buyer, my open offer reserves a unit for up to 72 hours, so the stock is not sold to someone else while I wait; when it lapses, the unit returns to the pool.
- As a seller, I can pause a listing so no new offers reserve it, and my existing offers stay open until they expire or I withdraw them.
- As an operator, I can disable new reservations without unpublishing listings.

## Scope
Process specifications (canonical file names, IDs PS-008-01 to -10):
- `domain_schema.md`, `validation_rules.md`, `workflow_state_machine.md`, `commands_queries_events.md`, `authorization_capabilities.md`, `failure_recovery_idempotency.md`, `privacy_retention_abuse.md`, `observability_performance.md`, `contract_and_acceptance_tests.md`, `import_export_backup_rollback.md`.

Out of scope: variant definitions (F01.S03.M02 `mod_variants`), prices and offers (F01.S04), listing content and region cell (F01.S01, F06), time-slot availability (F03.S01.M02), rental date-range availability (F05.S01.M01).

## Public interfaces
Owner commands: `availability.create`, `configure`, `commit_units`, `pause`, `resume`. System-only commands from F01.S04.M01: `hold.place`, `hold.withdraw`, `hold.execute`; scheduled `hold.expire`. Queries: `availability.get`, `availability.list_by_listing`, `hold.list`. Events and `AVAIL.*` errors are specified in PS-008-02 and PS-008-04.

## Relationships, dependencies and integration
Upstream: F01.S01 listings (kind, archive events), F01.S03.M02 variants (`variant_ref`, PENDING), F01.S04.M01 offers (`offer_ref`, PENDING), F07 identity (`acc_`), F16 authorization, F15 events and errors. Downstream: F01.S04.M01 offers, F02.S03.M02 cycle lock (PENDING contract), F12 moderation (pause by case), F13 notifications (sold out, hold lapse), F14 accessibility labels.

## Data ownership
Owns availability records (`avl_`, PENDING) and hold records (`hld_`, PENDING). Does not own listing content, variants, offers, identity, transaction evidence (F09) or notifications.

Canonical owner (B-06, PROVISIONAL): record class "listing unit availability" is owned by F01.S03.M01. Time-slot (F03.S01.M02) and date-range (F05.S01.M01) availability are different record classes; consumers reference each by full ID.

## Risk considerations
Double allocation of the last unit under concurrency; phantom holds that block genuine buyers; stale counts shown offline; seller-attested counts mistaken for confirmed sales; holder linkage through hold records; scraping of stock counts. No platform custody of goods or money. Counts do not prove handover.

## Completion criteria
All 10 process specifications at SPEC-DRAFT-COMPLETE; PENDING items closed (CTR-ID-001 prefixes, CTR-CAP-001 F02 entry, CONTRACTS.md owner entry); D04, D07 and D08 decided. Implementation and tests in later phases. No security or privacy audit is claimed by this spec.

## Required process specification inventory
- [x] `domain_schema.md` — PS-008-01 — SPEC-DRAFT-COMPLETE
- [x] `validation_rules.md` — PS-008-02 — SPEC-DRAFT-COMPLETE
- [x] `workflow_state_machine.md` — PS-008-03 — SPEC-DRAFT-COMPLETE
- [x] `commands_queries_events.md` — PS-008-04 — SPEC-DRAFT-COMPLETE
- [x] `authorization_capabilities.md` — PS-008-05 — SPEC-DRAFT-COMPLETE
- [x] `failure_recovery_idempotency.md` — PS-008-06 — SPEC-DRAFT-COMPLETE
- [x] `privacy_retention_abuse.md` — PS-008-07 — SPEC-DRAFT-COMPLETE
- [x] `observability_performance.md` — PS-008-08 — SPEC-DRAFT-COMPLETE
- [x] `contract_and_acceptance_tests.md` — PS-008-09 — SPEC-DRAFT-COMPLETE
- [x] `import_export_backup_rollback.md` — PS-008-10 — SPEC-DRAFT-COMPLETE
