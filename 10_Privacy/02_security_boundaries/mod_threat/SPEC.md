# F10.S02.M01 — threat

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Privacy Lead (role); Security Lead (role) accepts mitigations. **Parent:** F10.S02.

## Purpose and business behavior
Maintain the restricted threat register for ClassRup: each threat (metadata leakage, forged evidence, replay, fraud, abuse, relay failure, stale federated records, pseudonym linkage) is linked to affected flows in the model, scored, mitigated by requirement and test IDs, and reviewed on a fixed cycle. Accepting residual risk needs two approvals and an expiry. Canonical threat register for this repo (near-duplicate `mod_threats` in INDEX.md is not a separate owner; see Assumptions).

## User stories
- As a security reviewer, I can see which threats remain unmitigated on a given flow.
- As a privacy reviewer, I can confirm a metadata-leakage threat is closed only with a passing test.
- As a reviewer, a risk I accept expires and returns to review.
- As an auditor, I can see who accepted residual risk and when.

## Scope
- [domain_schema.md](domain_schema.md) — PS-082-01
- [validation_rules.md](validation_rules.md) — PS-082-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-082-03
- [commands_queries_events.md](commands_queries_events.md) — PS-082-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-082-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-082-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-082-07
- [observability_performance.md](observability_performance.md) — PS-082-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-082-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-082-10

## Public interfaces
Commands `threat.register`, `threat.assess`, `threat.update_mitigation`, `threat.accept_risk`, `threat.close`, `threat.reopen`; query `threat.query_register`. Details in PS-082-04.

## Relationships, dependencies and integration
Upstream: flows and boundaries in `10_Privacy/02_security_boundaries/mod_model`; data classes (CTR-PRV-001). Downstream: moderation (F12), federation controls (CTR-FED-001), CI test gates. Reference model and requirement IDs; do not copy them.

## Data ownership
Owns threat records and mitigation links. Does not own requirements (owned by each module's PS spec) or flow definitions (owned by mod_model).

## Risk considerations
Register itself reveals attack surface, so it is a restricted asset. Mitigations recorded without passing tests. Risk accepted and forgotten. Threats not linked to flows, so review never reaches the code. Exploit detail leaking into titles or logs.

## Completion criteria
All 10 process specs reviewed; seeded threat list confirmed by Security Lead; dual-approval rule tested.

## Required process specification inventory
- [x] `domain_schema.md` — PS-082-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-082-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-082-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-082-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-082-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-082-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-082-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-082-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-082-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-082-10, SPEC-DRAFT-COMPLETE (pending approval)

## Assumptions
- Near-duplicate naming (`mod_threat` vs `mod_threats`, INDEX.md lines 131 and 211) is unresolved; this directory is the threat register of record (PROVISIONAL, B-06). Governance Lead decides.
