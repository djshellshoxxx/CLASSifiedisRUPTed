# F09.S02.M03 — reconciliation

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F09). **Parent:** [F09.S02 settlement](../SPEC.md). **Canonical contracts:** CTR-COM-001 (states, adapter results, R12 reorg), CTR-EVT-001, CTR-CAP-001, CTR-PRV-001 (R07, RET-EVD), CTR-ID-001, CTR-ERR-001. **Decisions:** D04, D06 (PROVISIONAL defaults, unapproved).

## Purpose and business behavior
Detects drift between claim states, adapter observations, attestations and receipts, and produces findings for operators and dispute workflows. The module does not move claim state itself and never touches money. Corrections happen only through the owning transitions (adapter `sys_` commands or case decisions in CTR-COM-001). Each run reports what it checked and what it could not check.

## User stories
- As an operator, I see every FINAL claim that lacks an adapter record, with its ID and code only.
- As an operator, I see which chains were unreachable during a run, so a clean result is never mistaken for a complete one.
- As a dispute reviewer, I get a finding with the evidence references needed to open a case.

## Scope
- In scope: scheduled and on-demand reconciliation runs, finding types, run status, finding lifecycle.
- Out of scope: verification itself (mod_crypto), state transitions (CTR-COM-001), dispute decisions (mod_disputes), bank statement import (not in MVP; PENDING decision).

## Public interfaces
Commands `recon.run` (sys scheduled; ope on demand), `recon.finding.resolve` (ope with dual control for FINAL-related findings). Events `recon_run.completed`, `recon_finding.opened`, `recon_finding.resolved`. Prefixes `rcn` and `rfd` are PENDING CTR-ID-001.

## Relationships, dependencies and integration
Upstream: claims (CTR-COM-001), adapter results (mod_crypto), receipts (mod_receipts), cash configuration (mod_cash). Downstream: disputes (mod_disputes), case management (F12), operator dashboards.

## Data ownership
Owns reconciliation runs and findings. Claims and evidence stay with their owners.

## Risk considerations
Silent drift (for example FINAL without adapter record); false positives that trigger unjustified disputes; partial adapter outages producing misleading clean runs; findings leaking financial evidence to operators; run cost on large claim sets.

## Completion criteria
Finding type table agreed; run status rules tested with partial outages; operator access under dual control confirmed by F10; no state-changing path in the module.

## Required process specification inventory
- [x] `domain_schema.md` — PS-072-01
- [x] `validation_rules.md` — PS-072-02
- [x] `workflow_state_machine.md` — PS-072-03
- [x] `commands_queries_events.md` — PS-072-04
- [x] `authorization_capabilities.md` — PS-072-05
- [x] `failure_recovery_idempotency.md` — PS-072-06
- [x] `privacy_retention_abuse.md` — PS-072-07
- [x] `observability_performance.md` — PS-072-08
- [x] `contract_and_acceptance_tests.md` — PS-072-09
- [x] `import_export_backup_rollback.md` — PS-072-10
