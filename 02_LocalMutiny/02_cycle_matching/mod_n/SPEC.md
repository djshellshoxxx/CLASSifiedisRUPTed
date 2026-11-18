# F02.S02.M03 — mod_n

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** Marketplace Lead (accountable role). **Parent:** F02.S02 (cycle_matching). **Canonical record owner:** this module, for the length-routing decision and generalised search runs (`cyc_` proposals with five or more slots).

## Purpose and business behavior
Finds and proposes barter cycles of five to eight participants by bounded, deterministic search over a FEASIBLE snapshot. Three- and four-party cycles are routed to mod_three and mod_four, so each cycle has exactly one owning module. The search is explicitly budgeted: when the budget is spent, the run yields no proposals rather than partial ones.

## User stories
- As a participant in a long cycle, I am told the cycle's length and that every other party consented to the same version.
- As an operator, I can lower the maximum length or the search budget to protect latency, without touching shorter-cycle modules.
- As a participant, if no cycle is found within budget, I see "no cycle found in this run", not an error about other people.

## Scope
Ten process specifications (inventory below). Lengths 2–4 are routed away; length above 8 is out of scope.

## Public interfaces
Internal command `cycle.search_n` (sys_ matcher). Event `cycle_search.completed`. Proposals use `cycle.propose_n` (shape shared with PS-017-04). Error module code `CYCLEN`.

## Relationships, dependencies and integration
Upstream: F02.S02.M05 (mod_feasibility, FEASIBLE snapshots); F02.S02.M02 (mod_four, canonical rotation and regression fixtures, shadow comparison only); F15.S02.M03 (mod_storage, snapshot storage). Downstream: F02.S02.M04 (mod_party, slot binding) and F02.S03.M01 (mod_consent). Shared contracts: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Data ownership
Owns search-run records and length routing. Does not own feasibility verdicts, slots (`par_`), consents or locks.

## Risk considerations
Combinatorial blow-up, starvation of short cycles by long-search runs, budget gaming by crafted graphs, silent truncation of results, and accidental duplicate ownership with mod_three or mod_four. Pseudonyms do not guarantee anonymity; long cycles increase graph-linkage risk (see PS-018-07).

## Completion criteria
Ten process specs at SPEC-DRAFT-COMPLETE; routing table agreed with mod_three and mod_four; search budget benchmark plan defined; golden fixtures for lengths 5–8.

## Required process specification inventory
- [x] `domain_schema.md` — PS-018-01
- [x] `validation_rules.md` — PS-018-02
- [x] `workflow_state_machine.md` — PS-018-03
- [x] `commands_queries_events.md` — PS-018-04
- [x] `authorization_capabilities.md` — PS-018-05
- [x] `failure_recovery_idempotency.md` — PS-018-06
- [x] `privacy_retention_abuse.md` — PS-018-07
- [x] `observability_performance.md` — PS-018-08
- [x] `contract_and_acceptance_tests.md` — PS-018-09
- [x] `import_export_backup_rollback.md` — PS-018-10
