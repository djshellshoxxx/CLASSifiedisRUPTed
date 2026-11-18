# F18.S02.M02 — transparency (aggregated transparency reports)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Governance Lead (F18). **Parent:** [F18.S02 community](../SPEC.md).

## Purpose and business behavior
Produce and publish periodic transparency reports: aggregated counts of moderation actions, classification outcomes, appeals and their results, and governance decisions, with the methodology version used for each figure. Figures come from F12 moderation, [mod_prohibited](../../01_policy/mod_prohibited/SPEC.md) and [mod_governance](../mod_governance/SPEC.md). Reports are drafted, reviewed and then published as immutable versions. No case-level or person-level data is published.

## User stories
- As a participant, I can read how many listings were restricted or removed in a period and why, in aggregate.
- As a reviewer, I can check the methodology behind each figure before publication.
- As an auditor, I can compare two periods using the same methodology version.

## Scope
- Process specs (SPEC-DRAFT-COMPLETE, pending approval): domain_schema, validation_rules, workflow_state_machine, commands_queries_events, authorization_capabilities, failure_recovery_idempotency, privacy_retention_abuse, observability_performance, contract_and_acceptance_tests, import_export_backup_rollback.
- Process IDs: PS-148-01 to PS-148-10.

## Public interfaces
Commands `DraftTransparencyReport`, `ApproveTransparencyReport`, `PublishTransparencyReport`. Queries `GetTransparencyReport`, `ListTransparencyReports`. Events `transparency_report.drafted`, `transparency_report.published`.

## Relationships, dependencies and integration
Upstream: F12 moderation aggregates (by reference to aggregate job ID), [mod_prohibited](../../01_policy/mod_prohibited/SPEC.md) decision counts, [mod_governance](../mod_governance/SPEC.md) decision counts, CTR-PRV-001 (aggregation and disclosure classes), CTR-CAP-001. Downstream: public web reading (F13 notification of publication, by ID only).

## Data ownership
Owns report drafts, approved figures, methodology versions and published report versions. Does not own the underlying case records (F12) or user data.

## Risk considerations
Re-identification from small cells; selective reporting that hides a category; disclosure of case details protected by legal hold; figures that change after publication; methodology changes that make periods incomparable without notice.

## Completion criteria
Methodology v1 approved by Governance Lead and Privacy Lead; small-cell suppression rule tested; a published report reproducible from its inputs in a later phase.

## Required process specification inventory
- [x] `domain_schema.md` — PS-148-01 drafted
- [x] `validation_rules.md` — PS-148-02 drafted
- [x] `workflow_state_machine.md` — PS-148-03 drafted
- [x] `commands_queries_events.md` — PS-148-04 drafted
- [x] `authorization_capabilities.md` — PS-148-05 drafted
- [x] `failure_recovery_idempotency.md` — PS-148-06 drafted
- [x] `privacy_retention_abuse.md` — PS-148-07 drafted
- [x] `observability_performance.md` — PS-148-08 drafted
- [x] `contract_and_acceptance_tests.md` — PS-148-09 drafted
- [x] `import_export_backup_rollback.md` — PS-148-10 drafted

## Assumptions and open decisions
- ASSUMPTION: report period is calendar quarter in MVP.
- D05 (geoprivacy), default "coarse public regions and user-initiated precision disclosure": PROVISIONAL (D05 default, unapproved). Only coarse regions appear in reports.
- D07 (retention), default "minimal per-category defaults with legal-hold exceptions": PROVISIONAL (D07 default, unapproved). See [DECISIONS](../../../DECISIONS.md).
