# F02.S02.M05 — feasibility

**Status:** SPEC-DRAFT-COMPLETE. **Owner:** Marketplace Lead (accountable role). **Parent:** F02.S02 (cycle_matching). **Canonical record owner:** this module, for candidate verdicts (`ccd_`, PENDING prefix).

## Purpose and business behavior
Decides, before any consent request exists, whether a candidate exchange cycle built from current offers and wants can be carried out under explicit constraints: active listings and variants, unlocked participant slots, available quantity, cycle length limits, a pinned value tolerance and coarse region compatibility. It is a pure, deterministic check on an immutable snapshot. It creates no proposal and changes no proposal state.

## User stories
- As a participant, I am only asked to consent to a cycle that passed a feasibility check on current availability.
- As an operator, I can raise or lower length and budget limits by configuration without redeploying matching modules.
- As a participant, if my offer is no longer feasible I see a reason code, not my counterparties' identities.

## Scope
Ten process specifications under this directory (inventory below). Consumed by mod_three, mod_four and mod_n.

## Public interfaces
Internal command `feasibility.evaluate` (sys_ only). Read `feasibility.candidate_get` (participant scope). Event `cycle_candidate.evaluated`. Error module code `FEASIBLE`.

## Relationships, dependencies and integration
Upstream: F01.S03.M01 (mod_availability, quantity), F01.S03.M02 (mod_variants, active IDs), F02.S01.M01 (mod_two, offer and want intake), F02.S04.M03 (mod_valuation, pinned quotes). Downstream: F02.S02.M01 (mod_three), F02.S02.M02 (mod_four), F02.S02.M03 (mod_n). Shared contracts: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001 (coarse cells), CTR-COM-001 (quote reference).

## Data ownership
Owns candidate verdicts and reason codes. Does not own offers, availability, quotes, listings or identities. Candidate graphs are retained for 24 h only (RET-EPH).

## Risk considerations
Stale availability producing infeasible consents, Sybil accounts inflating the candidate graph, budget exhaustion hiding valid cycles, location inference from region cells, and rounding disputes in value tolerance. Pseudonyms do not guarantee anonymity; results are scoped to participants.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; PENDING items recorded; performance budget (PS-016-08) agreed with F15; determinism tests defined.

## Required process specification inventory
- [x] `domain_schema.md` — PS-016-01
- [x] `validation_rules.md` — PS-016-02
- [x] `workflow_state_machine.md` — PS-016-03
- [x] `commands_queries_events.md` — PS-016-04
- [x] `authorization_capabilities.md` — PS-016-05
- [x] `failure_recovery_idempotency.md` — PS-016-06
- [x] `privacy_retention_abuse.md` — PS-016-07
- [x] `observability_performance.md` — PS-016-08
- [x] `contract_and_acceptance_tests.md` — PS-016-09
- [x] `import_export_backup_rollback.md` — PS-016-10
