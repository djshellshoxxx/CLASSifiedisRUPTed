# F12.S01.M03 — appeals

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Trust&Safety Lead (accountable role; named person UNASSIGNED). **Parent:** F12.S01.

## Purpose and business behavior
Let an affected person contest a moderation outcome (an enforcement action, a spam verdict or a report closure) once, within a fixed window, and have a reviewer who did not make the original decision reach a recorded outcome: upheld, modified or reversed. A reversal triggers the enforcement reversal in `mod_enforcement`. Appeals do not restore content by themselves and do not guarantee an outcome.

## User stories
- As an affected member, I submit one appeal against a specific action within 30 days, with optional evidence, and see its state.
- As an affected member, I can withdraw an appeal before it is decided.
- As a Trust&Safety reviewer, I decide only cases I was not involved in, and every body read is audited.

## Scope
- Appeal intake, eligibility checks and single-open-appeal rule.
- Reviewer assignment and decision recording with reason codes.
- Reversal hand-off to `mod_enforcement` and acknowledgment.
- Out of scope: the original enforcement decision (`mod_enforcement`), evidence storage (`mod_evidence`), spam classifier thresholds (`mod_spam`), second-level appeals (future).

## Public interfaces
Commands `appeal.submit`, `appeal.withdraw`, `appeal.assign`, `appeal.decide`, `appeal.acknowledge_implementation`; queries `appeal.get`, `appeal.list_backlog`; events `appeal.received`, `appeal.ineligible`, `appeal.accepted`, `appeal.assigned`, `appeal.decided`, `appeal.implemented`, `appeal.withdrawn`, `appeal.closed`. Details in PS-092-04.

## Relationships, dependencies and integration
Upstream (DEPENDENCY_MATRIX): F12.S01.M02 `mod_evidence`, F12.S02.M01 `mod_enforcement`, F18.S02.M02 (governance policy). Downstream: F09.S02.M02 `mod_disputes` (appeal state as input when a commerce dispute involves a moderation action). Contracts: CTR-CAP-001, CTR-ERR-001, CTR-EVT-001.

## Data ownership
This module owns `apl_` appeals and their event history. The enforcement action `enf_` belongs to `mod_enforcement`; evidence items to `mod_evidence`; reports and flags to `mod_flags`. Appellant body text is the most sensitive data here and is never shared outside case scope.

## Risk considerations
Retaliation against reporters or reviewers; reviewer bias or conflicts; appeal spam used to stall enforcement; a reversal applied twice or applied after the decision was superseded; leakage of reporter identity through state timing; appeal text used to harass. No payments or custody are involved.

## Completion criteria
Trust&Safety Lead approval of the workflow (not yet obtained); all ten process specs at SPEC-DRAFT-COMPLETE; cross-module reversal test defined; privacy and security review scheduled (not performed).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-092-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [validation_rules.md](validation_rules.md) — PS-092-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-092-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-092-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-092-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-092-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-092-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [observability_performance.md](observability_performance.md) — PS-092-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-092-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-092-10, SPEC-DRAFT-COMPLETE (pending approval)
