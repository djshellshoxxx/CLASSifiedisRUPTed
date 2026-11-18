# F17.S03.M03 — compatibility (support matrix and compatibility results)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** QA Lead (F17). **Parent:** [F17.S03 release](../SPEC.md).

## Purpose and business behavior
Maintain the support matrix of browsers, operating systems, PWA install targets, assistive technologies, stored-record schema versions and federated peer protocol versions, and record compatibility test results per matrix cell. The goal is to catch silent breakage of older clients, offline clients holding stale schemas and peers on unsupported protocol versions before a release is promoted.

## User stories
- As a release manager, I see which matrix cells pass for the release candidate and which are unsupported.
- As a participant on an older device, I keep read access to my records after an upgrade.
- As a federation operator, I know which peer protocol versions this release still accepts.

## Scope
- Process specs (SPEC-DRAFT-COMPLETE, pending approval): domain_schema, validation_rules, workflow_state_machine, commands_queries_events, authorization_capabilities, failure_recovery_idempotency, privacy_retention_abuse, observability_performance, contract_and_acceptance_tests, import_export_backup_rollback.
- Process IDs: PS-142-01 to PS-142-10.

## Public interfaces
Commands `PublishCompatMatrix`, `RecordCompatResult`. Queries `GetCompatMatrix`, `ListCompatResults`. Events `compat_matrix.published`, `compat_result.recorded`. Details: [commands_queries_events](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: CI results from [mod_ci](../mod_ci/SPEC.md), CTR-SCH-001 (schema versions), CTR-FED-001 (peer protocol versions), CTR-ERR-001. Downstream: [mod_gates](../mod_gates/SPEC.md). Schema registry ownership stays with F15 (CTR-SCH-001).

## Data ownership
Owns the support matrix and compatibility results. Does not own schemas (CTR-SCH-001), federation rules (CTR-FED-001) or device records.

## Risk considerations
A matrix that claims support not backed by results; old clients reading new schema fields incorrectly; offline clients with stale schemas writing invalid records; peers on deprecated protocol versions accepted by mistake; stale results from a previous build reused for a new release.

## Completion criteria
Matrix approved by QA Lead; deprecation policy for each cell defined; compatibility tests pass for the MVP matrix in a later phase.

## Required process specification inventory
- [x] `domain_schema.md` — PS-142-01 drafted
- [x] `validation_rules.md` — PS-142-02 drafted
- [x] `workflow_state_machine.md` — PS-142-03 drafted
- [x] `commands_queries_events.md` — PS-142-04 drafted
- [x] `authorization_capabilities.md` — PS-142-05 drafted
- [x] `failure_recovery_idempotency.md` — PS-142-06 drafted
- [x] `privacy_retention_abuse.md` — PS-142-07 drafted
- [x] `observability_performance.md` — PS-142-08 drafted
- [x] `contract_and_acceptance_tests.md` — PS-142-09 drafted
- [x] `import_export_backup_rollback.md` — PS-142-10 drafted

## Assumptions and open decisions
- ASSUMPTION: the MVP matrix lists current stable browsers and OS versions only; older versions are listed as `unsupported` with a date.
- D01 (federated record protocol), default "versioned signed envelopes and explicit opt-in": PROVISIONAL (D01 default, unapproved).
- D08 (PWA offline writes), default "local pending queue until authenticated relay acknowledgment": PROVISIONAL (D08 default, unapproved).
