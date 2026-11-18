# F17.S03.M02 — gates (release gate definitions and decisions)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** QA Lead (F17). **Parent:** [F17.S03 release](../SPEC.md).

## Purpose and business behavior
Define the release gates a candidate build must pass before promotion: required CI checks ([mod_ci](../mod_ci/SPEC.md)), offline scenario runs ([mod_offline](../../02_performance/mod_offline/SPEC.md)), compatibility rows ([mod_compatibility](../mod_compatibility/SPEC.md)), accessibility and privacy sign-offs. Record each gate decision against a commit SHA, and record any waiver as an explicit, expiring, second-approved exception. This module decides promotion readiness; it does not run tests.

## User stories
- As a release manager, I see which gate is blocking a candidate and the evidence it used.
- As an accountable reviewer, I approve or reject a waiver with a stated reason and expiry.
- As an auditor, I can reconstruct why a build was promoted.

## Scope
- Process specs (SPEC-DRAFT-COMPLETE, pending approval): domain_schema, validation_rules, workflow_state_machine, commands_queries_events, authorization_capabilities, failure_recovery_idempotency, privacy_retention_abuse, observability_performance, contract_and_acceptance_tests, import_export_backup_rollback.
- Process IDs: PS-143-01 to PS-143-10.

## Public interfaces
Commands `DefineReleaseGate`, `EvaluateGates`, `GrantGateWaiver`. Queries `GetGateDecision`, `ListOpenWaivers`. Events `release_gate.defined`, `gate_decision.recorded`, `gate_waiver.granted`. Details: [commands_queries_events](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: [mod_ci](../mod_ci/SPEC.md), [mod_compatibility](../mod_compatibility/SPEC.md), F17.S02.M03 offline runs, accessibility (F14) and privacy (F10) sign-off records referenced by ID, CTR-CAP-001, CTR-ERR-001. Downstream: deployment and promotion (outside this directory).

## Data ownership
Owns gate definitions, gate decisions, waivers and their evidence references. Does not own CI runs, matrix rows, accessibility audits or privacy reviews; it stores their IDs and digests only.

## Risk considerations
Waivers that become permanent; self-approved waivers; stale evidence from an earlier commit; gate definitions weakened without review; evidence substituted between evaluation and promotion; sign-off records that exist but say nothing about this build.

## Completion criteria
Gate definitions for the MVP release approved by QA Lead, Security Lead and Privacy Lead; waiver rules tested; decisions reproducible from stored evidence in a later phase.

## Required process specification inventory
- [x] `domain_schema.md` — PS-143-01 drafted
- [x] `validation_rules.md` — PS-143-02 drafted
- [x] `workflow_state_machine.md` — PS-143-03 drafted
- [x] `commands_queries_events.md` — PS-143-04 drafted
- [x] `authorization_capabilities.md` — PS-143-05 drafted
- [x] `failure_recovery_idempotency.md` — PS-143-06 drafted
- [x] `privacy_retention_abuse.md` — PS-143-07 drafted
- [x] `observability_performance.md` — PS-143-08 drafted
- [x] `contract_and_acceptance_tests.md` — PS-143-09 drafted
- [x] `import_export_backup_rollback.md` — PS-143-10 drafted

## Assumptions and open decisions
- ASSUMPTION: promotion mechanics are out of scope; this module emits a decision that promotion tooling must check.
- D07 (retention), default "minimal per-category defaults with legal-hold exceptions": PROVISIONAL (D07 default, unapproved). See [DECISIONS](../../../DECISIONS.md).
