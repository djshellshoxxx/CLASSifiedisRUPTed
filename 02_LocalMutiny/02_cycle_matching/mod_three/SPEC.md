# F02.S02.M01 — mod_three

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** Marketplace Lead (accountable role). **Parent:** F02.S02 (cycle_matching). **Canonical record owner:** this module, for three-party cycle proposals (`cyc_` with three slots).

## Purpose and business behavior
Builds and proposes exact three-party barter cycles (A gives to B, B to C, C to A) from FEASIBLE candidates. It checks that no listing in the cycle is already committed to a locked exchange, fixes a canonical slot order, collects consent from all three participants to one cycle version, and hands a fully consented cycle to lock. It is the first cycle length offered to users and is kept separate from four-party and N-party logic.

## User stories
- As a participant in a three-party cycle, I see the two other pseudonyms and what each gives, and I consent once to a fixed version.
- As a participant, if one of the three declines, the other two are released without any item being locked.
- As an operator, I can disable three-party matching independently of other lengths.

## Scope
Ten process specifications (inventory below). Lengths 2, 4 and 5+ are routed away.

## Public interfaces
Commands: `cycle.propose_three`, `cycle.consent`, `cycle.decline`. Queries: `cycle.get`. Events: `cycle.proposed`, `cycle.version_superseded`, `cycle.slot_consented`, `cycle.declined`, `cycle.expired`, `cycle.consented`. Error module code `CYCTHREE`.

## Relationships, dependencies and integration
Upstream: F02.S02.M05 (mod_feasibility, FEASIBLE candidates); F02.S01.M01 (mod_two, offer and want intake); F06.S03.M01 (mod_relevance, optional ranking of candidate order, not authority). Downstream: F02.S01.M02 (party records, PS-019 binding via mod_party), F02.S03.M02 (mod_lock). Shared contracts: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Data ownership
Owns three-party cycle proposal records, versions and consent state. Does not own offers, slot identity, locks or quotes.

## Risk considerations
A listing committed in two cycles at once, consent to a stale version, a single participant holding two slots of the same cycle, and ranking bias from F06 relevance being used as a fairness shortcut. Pseudonyms do not guarantee anonymity.

## Completion criteria
Ten process specs at SPEC-DRAFT-COMPLETE; routing table agreed with mod_four and mod_n; relevance use restricted to ordering, not eligibility.

## Required process specification inventory
- [x] `domain_schema.md` — PS-020-01
- [x] `validation_rules.md` — PS-020-02
- [x] `workflow_state_machine.md` — PS-020-03
- [x] `commands_queries_events.md` — PS-020-04
- [x] `authorization_capabilities.md` — PS-020-05
- [x] `failure_recovery_idempotency.md` — PS-020-06
- [x] `privacy_retention_abuse.md` — PS-020-07
- [x] `observability_performance.md` — PS-020-08
- [x] `contract_and_acceptance_tests.md` — PS-020-09
- [x] `import_export_backup_rollback.md` — PS-020-10
