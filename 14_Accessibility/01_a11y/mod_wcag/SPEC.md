# F14.S01.M03 — wcag

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Accessibility Lead (F14). **Parent:** F14.S01.

## Purpose and business behavior
Maps every PWA screen to WCAG 2.1 Level A and AA success criteria, records conformance results with evidence digests, tracks accessibility findings to closure, and provides the release gate that blocks a build with an open blocker. It does not perform fixes; it records and gates them.

## User stories
- As a QA lead, I submit a conformance record per screen per build and see which of the 50 criteria failed.
- As an accessibility lead, I approve a time-limited accepted risk for a major finding, and I cannot approve a blocker.
- As an engineer, I see which findings block my release and their owner role.
- As an auditor, I export the record set for one app version.

## Scope
In: criteria mapping (WCAG 2.1 A/AA), conformance records, findings, accepted-risk expiry, release gate, audit export.
Out: keyboard behavior (F14.S01.M01), announcement text (F14.S01.M02), test tooling selection (F17), certification by any external body.

## Public interfaces
Commands `wcag.record.submit`, `wcag.finding.transition`; query `wcag.gate.get`; events `conformance_record.submitted`, `accessibility_finding.transitioned`; error prefix `WCAG.`.

## Relationships, dependencies and integration
Upstream: screen catalog from UI modules; keyboard and screenreader specifications for test mapping. Downstream: release process (F17), governance reporting (F18). Pending: `acr_` and `acf_` prefixes in CTR-ID-001; WCAG 2.2 evaluation (RESEARCH_NOTES).

## Data ownership
This module owns conformance records and accessibility findings. Screens belong to UI modules; evidence artifacts are stored in a restricted QA store.

## Risk considerations
False conformance claims (no certification exists here); accepted risks that never expire; evidence drawn from real user data; a gate that passes on incomplete criteria lists. No claim of WCAG conformance is made by this specification.

## Completion criteria
Ten process specifications at SPEC-DRAFT-COMPLETE; criteria list pinned; gate defined; governance review pending (future gate).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-111-01 — SPEC-DRAFT-COMPLETE
- [x] [validation_rules.md](validation_rules.md) — PS-111-02 — SPEC-DRAFT-COMPLETE
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-111-03 — SPEC-DRAFT-COMPLETE
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-111-04 — SPEC-DRAFT-COMPLETE
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-111-05 — SPEC-DRAFT-COMPLETE
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-111-06 — SPEC-DRAFT-COMPLETE
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-111-07 — SPEC-DRAFT-COMPLETE
- [x] [observability_performance.md](observability_performance.md) — PS-111-08 — SPEC-DRAFT-COMPLETE
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-111-09 — SPEC-DRAFT-COMPLETE
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-111-10 — SPEC-DRAFT-COMPLETE
