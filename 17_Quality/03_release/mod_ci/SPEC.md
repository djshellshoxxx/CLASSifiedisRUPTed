# F17.S03.M01 — ci (pipeline definitions and run records)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** QA Lead (F17). **Parent:** [F17.S03 release](../SPEC.md).

## Purpose and business behavior
Define the continuous-integration pipelines that run lint, unit, property, integration, contract, end-to-end, accessibility and offline test suites for each change, and record each run's job results, artifact digests and required-check status. Release gates (F17.S03.M02) read these records; this module does not decide release readiness.

## User stories
- As a maintainer, I see which required checks passed or failed for a commit, and why.
- As a release gate reviewer, I can verify that a run's artifact digests match the build I am promoting.
- As a security reviewer, I can confirm that pull requests from forks never receive production secrets.

## Scope
- Process specs (SPEC-DRAFT-COMPLETE, pending approval): domain_schema, validation_rules, workflow_state_machine, commands_queries_events, authorization_capabilities, failure_recovery_idempotency, privacy_retention_abuse, observability_performance, contract_and_acceptance_tests, import_export_backup_rollback.
- Process IDs: PS-141-01 to PS-141-10.

## Public interfaces
Commands `DefineCiPipeline`, `StartCiRun`, `RecordCiJobResult`. Queries `GetCiRun`, `ListCiRunsForCommit`. Events `ci_pipeline.defined`, `ci_run.started`, `ci_run.completed`. Details: [commands_queries_events](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: test suites in F17.S01 (unit, integration, property, e2e), F17.S02.M03 offline scenarios, CTR-CAP-001, CTR-ERR-001. Downstream: F17.S03.M02 gates, F17.S03.M03 compatibility results. Repository hosting and secret stores are external dependencies referenced by ID only.

## Data ownership
Owns pipeline definitions (versioned), run records and job results. Does not own source code, test fixtures or secret values.

## Risk considerations
Secrets leaking into job logs; untrusted fork code executing with write tokens; compromised or shared runners; unpinned third-party actions; artifacts swapped between build and promotion; flaky tests recorded as green; cache poisoning across branches.

## Completion criteria
Process specs approved by QA Lead and Security Lead; pipeline definitions for PR, main and release branches reviewed; secret-scan and fork-isolation tests pass in a later phase.

## Required process specification inventory
- [x] `domain_schema.md` — PS-141-01 drafted
- [x] `validation_rules.md` — PS-141-02 drafted
- [x] `workflow_state_machine.md` — PS-141-03 drafted
- [x] `commands_queries_events.md` — PS-141-04 drafted
- [x] `authorization_capabilities.md` — PS-141-05 drafted
- [x] `failure_recovery_idempotency.md` — PS-141-06 drafted
- [x] `privacy_retention_abuse.md` — PS-141-07 drafted
- [x] `observability_performance.md` — PS-141-08 drafted
- [x] `contract_and_acceptance_tests.md` — PS-141-09 drafted
- [x] `import_export_backup_rollback.md` — PS-141-10 drafted

## Assumptions and open decisions
- ASSUMPTION: hosted CI provider is not chosen; records are provider-neutral.
- D07 (retention), default "minimal per-category defaults with legal-hold exceptions": PROVISIONAL (D07 default, unapproved). See [DECISIONS](../../../DECISIONS.md).
