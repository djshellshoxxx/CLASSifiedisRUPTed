# F03.S01.M01 — skills

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F03). **Parent:** [F03.S01 service_catalog](../SPEC.md).

## Purpose and business behavior
Lets a service provider declare which skills a service listing requires or offers, using one operator-maintained taxonomy, so buyers can filter service listings by skill. Skills are self-declared. The module never presents a skill or certification as verified. It does not decide quotes, bookings, availability or pricing.

## User stories
- As a provider, I attach up to 20 skills to a service listing with a self-declared proficiency, and I can remove them without changing open quotes.
- As a buyer, I filter service results by skill code and see "self-declared" beside each skill, without seeing a provider's account identifier.
- As an operator, I publish a new taxonomy version, map pending free-text labels, and deprecate codes without breaking existing listings.

## Scope
Ten canonical process specifications (PS-029-01 to PS-029-10), listed in the inventory below. No code, UI screens or migrations are in scope for this stage.

## Public interfaces
Commands `skill.attach`, `skill.detach`, `skill_taxonomy.publish`, `skill_taxonomy.map_label`, `skill_taxonomy.import`, `skill_taxonomy.rollback`; queries `skill.search`, `skill_taxonomy.get`, `skill.export`. Events `service_listing.skill_attached`, `service_listing.skill_detached`, `skill_taxonomy.published`, `skill_taxonomy.rolled_back`. Error prefix `SKILLS`. Canonical contracts: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001.

## Relationships, dependencies and integration
Upstream: F07 identity (`acc_` principals), F03 service listing (listing ownership, owned by its parent feature), F15 configuration and validation. Downstream: F06 search index (skill tokens, PENDING CTR-SCH-001 registration), F12 reports, F16 capability matrix. Consumers reference skill records by full ID only.

## Data ownership
Owns `skill_taxonomy_entry` and `listing_skill`. Does not own the listing, the account, the search index or reports.

## Risk considerations
Keyword stuffing and misleading self-declared skills that distort search; profiling through unusual skill combinations; stale or deprecated codes on live listings; pending free-text labels holding personal data. No platform custody of money is involved. Pseudonyms do not guarantee anonymity against skill-based inference.

## Completion criteria
Ten process specifications at SPEC-DRAFT-COMPLETE; all links resolve; test IDs mapped; open decisions (D07, D08, D10) linked as PROVISIONAL. Approval, implementation and verification remain future gates.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-029-01
- [x] [validation_rules.md](validation_rules.md) — PS-029-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-029-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-029-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-029-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-029-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-029-07
- [x] [observability_performance.md](observability_performance.md) — PS-029-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-029-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-029-10
