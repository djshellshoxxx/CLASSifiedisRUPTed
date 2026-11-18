# F14.S01.M02 — screenreader

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Accessibility Lead (F14). **Parent:** F14.S01.

## Purpose and business behavior
Makes state changes audible to screen reader users: accessible names and roles for catalog components, and a published, validated catalog of announcement templates for events such as cycle consent recorded, offer received, claim created, and dispute raised. Announcements come only from published templates. Spoken text is limited to PUBLIC and PSEUDONYMOUS fields, so nothing private is read aloud in a shared space.

## User stories
- As a screen reader user, I hear a short confirmation when a barter cycle consent is recorded, without hearing an address or amount.
- As a screen reader user, I hear a claim state only in the catalog wording (for example "claim recorded, awaiting counterparty"), never "paid" for an unconfirmed claim.
- As a screen reader user, a failed offline sync is announced once, not repeated.
- As an accessibility reviewer, I can see which events have a template and which do not.

## Scope
In: accessible name catalog, announcement templates, live-region dispatch rules, template publishing workflow.
Out: keyboard focus behavior (F14.S01.M01), WCAG evaluation records (F14.S01.M03), listing alt text (F01 listing record), settlement labels (CTR-COM-001 catalog).

## Public interfaces
Commands `scr.template.publish`, `scr.template.deprecate`; query `scr.template.list`; events `announcement_template.published`, `announcement_template.deprecated`; error prefix `SCRN.`.

## Relationships, dependencies and integration
Upstream: keyboard component catalog (F14.S01.M01); CTR-COM-001 labels; CTR-PRV-001 classes. Downstream: all UI modules render announcements. Pending: `ann_` prefix in CTR-ID-001.

## Data ownership
This module owns announcement templates and accessible name keys. It owns no listing, message or payment record.

## Risk considerations
Spoken output in shared spaces leaks private data; announcement floods; wrong settlement wording (implies payment that did not occur); missing names on controls. Reader behavior varies by platform, so automated checks cannot prove spoken output.

## Completion criteria
Ten process specifications at SPEC-DRAFT-COMPLETE; reader matrix defined; privacy review pending (future gate).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-110-01 — SPEC-DRAFT-COMPLETE
- [x] [validation_rules.md](validation_rules.md) — PS-110-02 — SPEC-DRAFT-COMPLETE
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-110-03 — SPEC-DRAFT-COMPLETE
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-110-04 — SPEC-DRAFT-COMPLETE
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-110-05 — SPEC-DRAFT-COMPLETE
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-110-06 — SPEC-DRAFT-COMPLETE
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-110-07 — SPEC-DRAFT-COMPLETE
- [x] [observability_performance.md](observability_performance.md) — PS-110-08 — SPEC-DRAFT-COMPLETE
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-110-09 — SPEC-DRAFT-COMPLETE
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-110-10 — SPEC-DRAFT-COMPLETE
