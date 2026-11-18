# F02.S02.M02 — mod_four

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** Marketplace Lead (accountable role). **Parent:** F02.S02 (cycle_matching). **Canonical record owner:** this module, for four-party cycle proposals (`cyc_` with four slots).

## Purpose and business behavior
Builds and proposes exact four-party barter cycles (A gives to B, B to C, C to D, D to A) from FEASIBLE candidates. It fixes one canonical slot order per cycle, collects consent from all four participants to one cycle version, and hands a fully consented cycle to lock. Four-party cycles have their own rules (distinct listings, unique rotation, four consents), kept separate from the generalised N-party module so that the common path stays simple to test.

## User stories
- As a participant in a four-party cycle, I see the other three roles by pseudonym and what each gives, and I consent once to a fixed version.
- As a participant, if the cycle changes I am asked again; I am never bound to a version I did not see.
- As an operator, I can disable four-party matching without affecting three-party or N-party matching.

## Scope
Ten process specifications (inventory below). Lengths other than four are out of scope and rejected.

## Public interfaces
Commands: `cycle.propose_four`, `cycle.consent`, `cycle.decline`. Queries: `cycle.get`. Events: `cycle.proposed`, `cycle.version_superseded`, `cycle.slot_consented`, `cycle.declined`, `cycle.expired`, `cycle.consented`. Error module code `CYCFOUR`.

## Relationships, dependencies and integration
Upstream: F02.S02.M05 (mod_feasibility, FEASIBLE candidates); F02.S02.M01 (mod_three, shares the rotation rule as a contract, not code); F15.S03.M01 (observability). Downstream: F02.S02.M03 (mod_n uses this module's canonical order and fixtures as a regression baseline); F02.S03.M02 (mod_lock, receives consented cycles). Slots use `par_` IDs owned by F02.S01.M02 (see mod_party). Shared contracts: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Data ownership
Owns four-party cycle proposal records, versions and consent state. Does not own offers (F02.S01), slots' identity (F02.S01.M02), locks (F02.S03.M02) or quotes (F09.S03).

## Risk considerations
Consent to a version that later changed, duplicate participants across slots, consent replay across versions, stale feasibility results, and proposal flooding by fake accounts. Pseudonyms do not guarantee anonymity; each slot shows only its pseudonym and its own offer.

## Completion criteria
Ten process specs at SPEC-DRAFT-COMPLETE; canonical rotation and tie-break fixtures agreed with mod_n; consent state machine tests defined.

## Required process specification inventory
- [x] `domain_schema.md` — PS-017-01
- [x] `validation_rules.md` — PS-017-02
- [x] `workflow_state_machine.md` — PS-017-03
- [x] `commands_queries_events.md` — PS-017-04
- [x] `authorization_capabilities.md` — PS-017-05
- [x] `failure_recovery_idempotency.md` — PS-017-06
- [x] `privacy_retention_abuse.md` — PS-017-07
- [x] `observability_performance.md` — PS-017-08
- [x] `contract_and_acceptance_tests.md` — PS-017-09
- [x] `import_export_backup_rollback.md` — PS-017-10
