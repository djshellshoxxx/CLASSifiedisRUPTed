# F02.S02.M04 — mod_party (cycle participant slots)

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** Marketplace Lead (accountable role). **Parent:** F02.S02 (cycle_matching). **Canonical record owner:** `par_` (cycle participant slot) records are owned by F02.S01.M02 `02_LocalMutiny/01_trade_proposals/mod_party` (PROVISIONAL ownership default, see Data ownership). This module owns only the cycle-scoped slot binding.

## Purpose and business behavior
Binds each participant's slot (`par_`) to one position in one cycle version: slot index, current consent projection and lock status. It enforces that a participant holds at most one live slot in a cycle at a time, so one listing or person cannot be committed twice in parallel. It does not decide cycles (mod_three, mod_four, mod_n) and does not record consents itself (F02.S03.M01 mod_consent).

## User stories
- As a participant, I am in one cycle at a time, and if I withdraw my slot the other parties are told by pseudonym, not by name.
- As an operator, I can see how many slots are blocked by a stuck participant without seeing who they are.
- As a participant, I get a clear reason when my slot cannot be bound because I am already in a live cycle.

## Scope
Ten process specifications (inventory below). Two-party slot creation is out of scope (F02.S01.M02).

## Public interfaces
Commands: `cycle.bind_slot`, `cycle.withdraw_slot`. Query: `cycle.slots_get`. Events: `cycle.slot_bound`, `cycle.slot_withdrawn`, `cycle.slot_status_changed`. Error module code `CYCPARTY`.

## Relationships, dependencies and integration
Upstream: F02.S01.M02 (`par_` identity and owner; trade-proposal party records); F02.S02.M03 (mod_n) and F02.S02.M01/M02 (cycle creators call bind); F02.S03.M01 (mod_consent, reports consent status). Downstream: F02.S03.M03 (mod_dropouts, reads slot status); F02.S03.M04 (mod_recovery, reads slot status for compensation). Shared contracts: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Data ownership
Owns the binding (`cyc_`, `par_`, `slot_index`, `cycle_version`, status projection). Does not own `par_` identity, consent records, listings, or lock records.

## Risk considerations
Double-booking a participant across cycles, withdrawal used to pressure others after consent, slot-index collisions after version change, and pseudonym linkage through slot order. Pseudonyms do not guarantee anonymity; slot order reveals position only.

## Completion criteria
Ten process specs at SPEC-DRAFT-COMPLETE; PARTY canonical owner decision recorded (lead); binding tests defined for all three cycle lengths.

## Required process specification inventory
- [x] `domain_schema.md` — PS-019-01
- [x] `validation_rules.md` — PS-019-02
- [x] `workflow_state_machine.md` — PS-019-03
- [x] `commands_queries_events.md` — PS-019-04
- [x] `authorization_capabilities.md` — PS-019-05
- [x] `failure_recovery_idempotency.md` — PS-019-06
- [x] `privacy_retention_abuse.md` — PS-019-07
- [x] `observability_performance.md` — PS-019-08
- [x] `contract_and_acceptance_tests.md` — PS-019-09
- [x] `import_export_backup_rollback.md` — PS-019-10
