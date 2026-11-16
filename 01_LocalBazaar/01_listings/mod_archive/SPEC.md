# F01.S01.M04 — archive

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (F01). **Parent:** [F01.S01 listings SPEC](../SPEC.md).

## Purpose and business behavior
Lets a seller take a published listing out of public discovery without deleting it, and bring it back later. Archive is reversible and never implies a completed exchange or sale. Moderators can archive a listing under a case, with a visible generic reason to the owner. Each transition is explicit, authorized, recorded in one event, and idempotent.

## User stories
- As a seller, I archive a listing I no longer offer (sold elsewhere, hidden, or unavailable) and it disappears from search within 60 s p95 (ASSUMPTION).
- As a seller, I restore an archived listing; it returns with its original publish date and only if it still passes publish validation.
- As a seller on a poor connection, my archive request queues locally and sends once, without duplicates.
- As a moderator, I archive a listing under an open case; the owner sees a generic hold notice, never the case.
- As a counterparty in an open cycle, I cannot archive a listing that the cycle depends on.

## Scope
- [domain_schema.md](domain_schema.md) — PS-001-01
- [validation_rules.md](validation_rules.md) — PS-001-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-001-03
- [commands_queries_events.md](commands_queries_events.md) — PS-001-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-001-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-001-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-001-07
- [observability_performance.md](observability_performance.md) — PS-001-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-001-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-001-10

## Public interfaces
Commands `archive_listing`, `restore_listing` (owner) and `archive_listing_by_moderator`, `restore_listing_by_moderator` (case-scoped), all `v1`. Queries `list_archived_listings`, `get_archive_state`. Events `listing.archived`, `listing.restored` (`v1.0.0`). Errors use the `ARCHIVE.*` module code with shared `SYS.*` and `EVT.*` codes (CTR-ERR-001). Details in PS-001-04 and PS-001-02.

## Relationships, dependencies and integration
- Upstream: F07 identity (`acc_`), F16 capabilities (`lst.update`, `lst.moderate`), F01 mod_publish (publish validators re-run on restore), F02 cycles and F09 exchanges (active-reference guard, PENDING CTR-LST-001).
- Downstream: F13 notifications (owner notice, PENDING CTR-NTF-001), F12 moderation cases, search indexing, F15 observability.
- Shared records are referenced by ID, not copied. Integration tests use contract stubs until the pending contracts exist.

## Data ownership
This module owns only the archive fields and transitions of the `lst_` aggregate, plus the archive events. The listing content and lifecycle values other than PUBLISHED and ARCHIVED belong to mod_publish and mod_edit. Case records belong to F12. Export and deletion follow CTR-PRV-001 and legal-hold rules.

## Risk considerations
- Privacy: archive status leaks to non-owners if visibility rules fail; moderator case details leak to owners; location precision could enter archive payloads.
- Abuse: archive and restore toggling to game ranking or to hide listings from buyers during a negotiation.
- Concurrency and partial failure: archive racing a cycle acceptance, edit racing archive, duplicate delivery after timeout.
- Offline: queued archives may conflict with edits made on another device.
- Pseudonyms do not guarantee anonymity. No platform custody of money is involved in this module.
- Accessibility regressions in archive and restore confirmations.

## Completion criteria
All 10 process specs are at SPEC-DRAFT-COMPLETE; task list and checklist items reflect that. Implementation, test runs, and the F10, F16, F14 and F17 gates are future work and are not claimed here.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-001-01
- [x] [validation_rules.md](validation_rules.md) — PS-001-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-001-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-001-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-001-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-001-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-001-07
- [x] [observability_performance.md](observability_performance.md) — PS-001-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-001-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-001-10

## Canonical contracts and decisions
Contracts referenced: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001. Open decisions: D01, D04, D05, D07, D08, D10 (all PROVISIONAL, unapproved). Pending contracts: CTR-LST-001 (listing reference and lifecycle), CTR-NTF-001 (owner notification).

## Assumptions
- ASSUMPTION: 10 archive/restore transitions per listing per 24 h.
- ASSUMPTION: archived listings leave public discovery within 60 s p95.
- ASSUMPTION: all latency and throughput budgets in PS-001-08 until load-tested.
