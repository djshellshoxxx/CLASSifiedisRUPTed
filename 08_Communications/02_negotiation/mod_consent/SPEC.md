# F08.S02.M02 — consent

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F08). **Parent:** [F08.S02](../SPEC.md).

## Purpose and business behavior
Records each party's explicit agreement to one specific version of a negotiation proposal (`cyc_` or `ofr_`): scope, terms digest, version and, for cross-currency terms, a pinned quote. Consent here is agreement to terms. It is not privacy consent (F10.S01.M01) and not payment evidence (CTR-COM-001). Consent is per party and is never inferred from viewing or silence.

## User stories
- As a party, I see the exact terms and version before I consent, and I can decline or withdraw before execution locks.
- As a party, I am told when terms change and my earlier consent no longer applies.
- As a proposal owner, I see whether each slot has consented to the current version, not the other party's terms.
- As an operator, I cannot consent for anyone and cannot read consent details without a case grant.

## Scope
- Required process spec: [PS-062-01 domain schema](domain_schema.md)
- Required process spec: [PS-062-02 validation rules](validation_rules.md)
- Required process spec: [PS-062-03 workflow state machine](workflow_state_machine.md)
- Required process spec: [PS-062-04 commands queries events](commands_queries_events.md)
- Required process spec: [PS-062-05 authorization capabilities](authorization_capabilities.md)
- Required process spec: [PS-062-06 failure recovery idempotency](failure_recovery_idempotency.md)
- Required process spec: [PS-062-07 privacy retention abuse](privacy_retention_abuse.md)
- Required process spec: [PS-062-08 observability performance](observability_performance.md)
- Required process spec: [PS-062-09 contract and acceptance tests](contract_and_acceptance_tests.md)
- Required process spec: [PS-062-10 import export backup rollback](import_export_backup_rollback.md)

## Public interfaces
Commands `cns.give`, `cns.decline`, `cns.withdraw`; query `cns.status`; events `consent.*`. Details in PS-062-04.

## Relationships, dependencies and integration
Upstream: proposals and slots from [F02.S03.M01 cycle execution consent](../../../02_LocalMutiny/03_cycle_execution/mod_consent/SPEC.md) (lock event), [F08.S02.M01 offers](../mod_offers/SPEC.md) (`ofr_`), identity (F07), quotes (CTR-COM-001). Downstream: notifications (F13, generic text). Privacy consent [F10.S01.M01](../../../10_Privacy/01_data_controls/mod_consent/SPEC.md) is separate and not referenced by ID for record storage.

## Data ownership
Canonical owner (B-06, PROVISIONAL): this module owns the `cns_` record class. F02.S03.M01 references `cns_` by full ID and owns only execution-phase acknowledgements. Consumers reference by full ID only.

## Risk considerations
- Consent to terms the party did not see (stale or altered version).
- Withdrawal racing execution lock; queued offline commands (S4-02, CR-14).
- Scripted mass acceptance and coercion by proposal owners.
- Consent records revealing participation to observers.
No platform custody of money; consent does not create payment obligations.

## Completion criteria
All ten PS-062 specs at SPEC-DRAFT-COMPLETE; B-06 owner decision recorded (PROVISIONAL here); lock-event contract with F02 agreed; privacy and security review pass.

## Required process specification inventory
- [x] [domain_schema](domain_schema.md) — PS-062-01
- [x] [validation_rules](validation_rules.md) — PS-062-02
- [x] [workflow_state_machine](workflow_state_machine.md) — PS-062-03
- [x] [commands_queries_events](commands_queries_events.md) — PS-062-04
- [x] [authorization_capabilities](authorization_capabilities.md) — PS-062-05
- [x] [failure_recovery_idempotency](failure_recovery_idempotency.md) — PS-062-06
- [x] [privacy_retention_abuse](privacy_retention_abuse.md) — PS-062-07
- [x] [observability_performance](observability_performance.md) — PS-062-08
- [x] [contract_and_acceptance_tests](contract_and_acceptance_tests.md) — PS-062-09
- [x] [import_export_backup_rollback](import_export_backup_rollback.md) — PS-062-10
