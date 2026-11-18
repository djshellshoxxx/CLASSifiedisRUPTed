# F17.S02.M01 — load

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** QA Lead (F17). **Parent:** F17.S02.

## Purpose and business behavior
Measures whether the platform meets its performance budgets at realistic and peak demand: listing reads, message sends, region queries (budget and K-threshold per CTR-PRV-001), relay batch ingest (CTR-FED-001 limits) and the cycle optimizer's bounded search (D02). Runs use a synthetic population in staging with reference profiles LD-01 to LD-04. A release is gated on the SLO results and on comparison with the baseline of the same build line.

## User stories
- As a release manager, I see whether this build keeps region queries under 400 ms p95 at reference load before I approve it.
- As an engineer, I learn that my change slowed relay ingest by more than 10% before it reaches the main branch.
- As an SRE, I can abort a load run within 10 seconds if production-like staging degrades.

## Scope
- Workload models, load profiles LD-01 to LD-04, run lifecycle, baseline comparison, SLO gate.
- Excludes: fault injection (`mod_chaos`), single-request correctness (`mod_unit`, `mod_integration`), CI pipeline configuration (F17.S03).

## Public interfaces
`load.define_workload | define_profile | run | abort | get_result | list_runs`; events `load_run.*`. Errors `LOAD.*`. Detail in PS-139-04.

## Relationships, dependencies and integration
Upstream: F15.S02.M02 (`mod_relays`, relay ingest under test), F17.S01.M04 (`mod_e2e`, journeys reused as workload operations). Downstream: F17.S02.M02 (`mod_chaos`, steady-state baselines), F17.S03.M01 (`mod_ci`, release gate). Contracts: CTR-ERR-001, CTR-FED-001, CTR-PRV-001.

## Data ownership
Owns workload models, profiles, run summaries and baselines. Does not own the measured services or their SLO definitions beyond the budget table.

## Risk considerations
Load tests that look green because the harness is the bottleneck; generators hitting real services; rate-limit behaviour mistaken for failure or hidden; synthetic data that breaks privacy rules; baselines compared across different hardware. Mitigations: harness metrics separated, production block, rate-limited ratio reported separately, synthetic population lint, environment-scoped baselines. No platform custody of money. Pseudonyms do not guarantee anonymity of synthetic accounts.

## Completion criteria
LD-01 to LD-04 pass for three consecutive release candidates; release gate wired to F17.S03; D02, D01, D05 resolved for load-relevant portions; budget table confirmed by owners.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-139-01 (SPEC-DRAFT-COMPLETE)
- [x] [validation_rules.md](validation_rules.md) — PS-139-02 (SPEC-DRAFT-COMPLETE)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-139-03 (SPEC-DRAFT-COMPLETE)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-139-04 (SPEC-DRAFT-COMPLETE)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-139-05 (SPEC-DRAFT-COMPLETE)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-139-06 (SPEC-DRAFT-COMPLETE)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-139-07 (SPEC-DRAFT-COMPLETE)
- [x] [observability_performance.md](observability_performance.md) — PS-139-08 (SPEC-DRAFT-COMPLETE)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-139-09 (SPEC-DRAFT-COMPLETE)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-139-10 (SPEC-DRAFT-COMPLETE)
