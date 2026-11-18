# F10.S02.M02 — model

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Privacy Lead (role); Security Lead (role) approves versions. **Parent:** F10.S02.

## Purpose and business behavior
Maintain the approved data-flow and trust-boundary model for ClassRup: which asset holds which data class, which flows cross a trust zone (client PWA, relay, peer node, external chain, external payment), and which controls apply at each crossing. Other modules and CI reference this model; a flow absent from it is treated as unreviewed.

## User stories
- As a privacy reviewer, I can see every flow that carries precise location or financial evidence and its controls.
- As a security reviewer, I can approve or reject a model version without editing it in place.
- As a developer, a new cross-boundary flow fails CI until it is registered with a data class.
- As an auditor, I can verify an exported model version by digest.

## Scope
- [domain_schema.md](domain_schema.md) — PS-081-01
- [validation_rules.md](validation_rules.md) — PS-081-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-081-03
- [commands_queries_events.md](commands_queries_events.md) — PS-081-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-081-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-081-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-081-07
- [observability_performance.md](observability_performance.md) — PS-081-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-081-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-081-10

## Public interfaces
Commands `model.propose_version`, `model.approve`, `model.reject`, `flow.register`, `flow.retire`, `model.rollback`; query `model.query_current`. Events `model.version_approved`, `flow.registered`, `flow.retired`. Details in PS-081-04.

## Relationships, dependencies and integration
Upstream: data classes (CTR-PRV-001), federation class rules (CTR-FED-001 R03), capability model (CTR-CAP-001). Downstream: CI drift check, privacy review (F10), threat register (`10_Privacy/02_security_boundaries/mod_threat`, full ID). Integration uses contract tests.

## Data ownership
Owns model versions, asset, boundary and flow records. Does not own the data itself or class definitions (CTR-PRV-001).

## Risk considerations
The model drifts from code, leaving new flows unreviewed. A flow is misclassified, so a precise-location or financial path gets weaker controls. The static PWA host is treated as untrusted for secrets, but a model entry could imply otherwise. Tampered or unreviewed versions are approved. Sample data leaks personal values into the model.

## Completion criteria
All 10 process specs reviewed by Privacy and Security leads; zone × class matrix tested; drift check defined in CI plan.

## Required process specification inventory
- [x] `domain_schema.md` — PS-081-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-081-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-081-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-081-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-081-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-081-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-081-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-081-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-081-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-081-10, SPEC-DRAFT-COMPLETE (pending approval)
