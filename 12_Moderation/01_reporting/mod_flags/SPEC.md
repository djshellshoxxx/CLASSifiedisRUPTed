# F12.S01.M01 — flags

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Trust&Safety Lead. **Parent:** F12.S01.

## Purpose and business behavior
Intake for user reports about listings, services, auctions, rentals, messages, threads, attachments and profiles. Accepts a reason from a fixed taxonomy, de-duplicates repeat reports, weights reports by reporter standing, and queues them for triage. Flags raise review priority only. They never hide content or sanction anyone. Those decisions belong to mod_enforcement.

## User stories
- As a reporter, I pick a reason, add up to 500 characters, and see only that my report was received and later closed.
- As a moderator, I triage a queue that shows reason, target type and weight without seeing content or the reporter.
- As a target owner, I learn an outcome category without learning who reported me.

## Scope
Ten process specs, all SPEC-DRAFT-COMPLETE: PS-094-01 to PS-094-10 (see inventory below).

## Public interfaces
- Commands: `report.submit`, `report.withdraw`, `report.triage`, `report.link_case`.
- Queries: `report.status`, `report.triage_queue`, `report.list_by_case`.
- Events (aggregate `report`): `report.submitted`, `report.withdrawn`, `report.triaged`, `report.linked_to_case`, `report.closed_invalid`, `report.closed`, `report.threshold_reached`.
- Identifier `rpt_` (opaque, owner F12, CTR-ID-001).

## Relationships, dependencies and integration
Upstream: F12.S01.M02 evidence (`mev_` references), F07 accounts, F16 capabilities, F12.S02.M03 abuse (restriction flag), F12.S03.M03 rate and F12.S03.M04 limits (quotas). Downstream: F12.S02.M01 enforcement (case outcomes), F12.S01.M03 appeals. Feature flags (F15.S04.M02) are a separate record class and are not reports.

## Data ownership
Owns: `rpt_` records, dedupe keys, triage state, weight. Canonical owner of report records (B-06, PROVISIONAL, unapproved). Does not own: evidence snapshots (F12.S01.M02), case records (`cas_`, F12 case management), target content (domain modules).

## Risk considerations
Brigading and retaliatory reports; reporter exposure through timing or leaked fields; doxxing carried in report text; over-triage of high-harm categories; reports as a DoS vector on the triage queue. Reports are signals, not facts. No platform custody of money; no payment or delivery assurance.

## Completion criteria
Ten process specs have passed their approval gates (Privacy Lead F10, Security Lead F16, Trust&Safety sign-off); test IDs pass in a later implementation phase.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-094-01
- [x] [validation_rules.md](validation_rules.md) — PS-094-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-094-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-094-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-094-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-094-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-094-07
- [x] [observability_performance.md](observability_performance.md) — PS-094-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-094-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-094-10
