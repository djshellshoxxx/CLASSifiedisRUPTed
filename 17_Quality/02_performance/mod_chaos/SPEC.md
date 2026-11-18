# F17.S02.M02 — chaos

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** QA Lead (F17). **Parent:** F17.S02.

## Purpose and business behavior
Injects controlled faults into staging (relay outage, database failover, duplicate delivery, key-service unavailability, scheduler crash, clock skew) to test the claims made in the specifications: no unsigned events under key-service failure (PS-130), single policy activation under scheduler crash (PS-129), exactly-once effects under duplicate delivery (CTR-EVT-001). Every experiment has a written hypothesis, numeric abort conditions and a watchdog that reverts faults independently of the runner. Production chaos is out of scope at MVP.

## User stories
- As an SRE, I can abort any running experiment within 10 seconds, whoever started it.
- As a module owner, I see the hypothesis and verdict for each fault my module must survive.
- As a Security Lead, I can confirm that no experiment disables audit logging or access control.

## Scope
- Six MVP experiments CHX-01 to CHX-06.
- Experiment lifecycle, abort, watchdog, verdict reporting.
- Excludes: load testing (`mod_load`), offline-specific tests (`mod_offline`), production game days (out of scope at MVP).

## Public interfaces
`chaos.propose | approve | start | abort | get | list_running`; events `chaos_experiment.*`. Errors `CHAOS.*`. Detail in PS-138-04.

## Relationships, dependencies and integration
Upstream: F15.S03.M03 (`mod_recovery`, recovery paths under test), F17.S02.M01 (`mod_load`, baseline steady state). Downstream: F17.S02.M03 (`mod_offline`, offline behavior under faults). Contracts: CTR-EVT-001, CTR-ERR-001.

## Data ownership
Owns experiment definitions, verdicts and watchdog state. Does not own the faulted components or their data.

## Risk considerations
Faults that cause real harm if they escape staging; faults that disable the very controls that would detect harm; runner crash leaving a fault active; experiments run in parallel on the same component; verdicts reported as held when the monitoring was blind. Mitigations: production target block, audit-protected fault list, independent watchdog, target lock, no-data equals abort. No platform custody of money. Pseudonyms do not guarantee anonymity of staging accounts.

## Completion criteria
Six experiments hold on release candidate for three consecutive releases (ASSUMPTION); watchdog drill passed; D01, D08 resolved; security review of fault list passed.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-138-01 (SPEC-DRAFT-COMPLETE)
- [x] [validation_rules.md](validation_rules.md) — PS-138-02 (SPEC-DRAFT-COMPLETE)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-138-03 (SPEC-DRAFT-COMPLETE)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-138-04 (SPEC-DRAFT-COMPLETE)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-138-05 (SPEC-DRAFT-COMPLETE)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-138-06 (SPEC-DRAFT-COMPLETE)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-138-07 (SPEC-DRAFT-COMPLETE)
- [x] [observability_performance.md](observability_performance.md) — PS-138-08 (SPEC-DRAFT-COMPLETE)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-138-09 (SPEC-DRAFT-COMPLETE)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-138-10 (SPEC-DRAFT-COMPLETE)
