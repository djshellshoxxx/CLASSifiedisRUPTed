# F08.S03.M02 — handoff

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (F08). **Parent:** F08.S03.

## Purpose and business behavior
Records, for an exchange between two pseudonyms (`prf_`), what each party says was given and received at the physical handover, as signed per-item attestations. Confirms a line only when both parties' statements match; flags conflicts for the dispute process in F09 and does not decide fault. Covers meetup-based handoff; rental handover (05_Rentals/mod_handoff) must reference this record class by full ID. Does not verify physical transfer, does not hold goods or funds, does not record location (mod_coordination holds the meetup reference), and does not create payment claims (F09).

## User stories
- As a seller, I attest that I handed over two items at the meetup, and the buyer's matching attestation confirms the handover.
- As a buyer, I see that one item is confirmed and another is waiting for the seller's statement.
- As a party, when the other party's statement conflicts with mine, the handoff goes to dispute with both statements visible to F09 and not to the public.
- As a moderator, I can see that a handoff exists and its state without reading signatures.

## Scope
- [domain_schema.md](domain_schema.md) — PS-065-01
- [validation_rules.md](validation_rules.md) — PS-065-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-065-03
- [commands_queries_events.md](commands_queries_events.md) — PS-065-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-065-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-065-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-065-07
- [observability_performance.md](observability_performance.md) — PS-065-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-065-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-065-10

## Public interfaces
Commands `OpenHandoff`, `AttestHandoff`, `WithdrawAttestation`, `RaiseHandoffDispute`; queries `GetHandoff`, `ListHandoffsForExchange`; events `handoff.opened`, `handoff.attested`, `handoff.confirmed`, `handoff.disputed`, `handoff.closed` (CTR-EVT-001). Details in PS-065-04.

## Relationships, dependencies and integration
Upstream: F02–F05 exchange state and item lists; mod_coordination (`mtg_` reference, PENDING prefix); key registry (F16); mod_pseudonyms (`prf_`). Downstream: F09 dispute flow (`dsp_`, by reference); mod_reputation receives only F09 final outcomes, not raw lines. Canonical owner ID: PENDING CTR-ID-001 (candidate `hof`, owner F08), shared with 05_Rentals/mod_handoff by full ID.

## Data ownership
Owns handoff records, per-item attestation lines and dispute referrals from this flow. Does not own exchange items (F02–F05), meetup records (mod_coordination), payment claims (F09) or dispute outcomes (F09). Retention per PS-065-07.

## Risk considerations
Specific to handoff: (1) attestations treated as proof of physical transfer; (2) one party confirming alone to pressure the other; (3) quantity inflation or item substitution at handover; (4) disputes decided on attestations without evidence; (5) rental and meetup handoff record classes diverging; (6) handover records revealing where and when a person was. The record is an attestation of what parties claim; atomic exchange is not guaranteed (D04).

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; every `PS-065-*.Rnn` mapped to `TEST-PS-065-*`; canonical owner ID decided with 05_Rentals owner and recorded in CTR-ID-001; D04 and D06 approved or kept PROVISIONAL; privacy and security review pass (future gate).

## Required process specification inventory
- [x] `domain_schema.md` — PS-065-01, SPEC-DRAFT-COMPLETE
- [x] `validation_rules.md` — PS-065-02, SPEC-DRAFT-COMPLETE
- [x] `workflow_state_machine.md` — PS-065-03, SPEC-DRAFT-COMPLETE
- [x] `commands_queries_events.md` — PS-065-04, SPEC-DRAFT-COMPLETE
- [x] `authorization_capabilities.md` — PS-065-05, SPEC-DRAFT-COMPLETE
- [x] `failure_recovery_idempotency.md` — PS-065-06, SPEC-DRAFT-COMPLETE
- [x] `privacy_retention_abuse.md` — PS-065-07, SPEC-DRAFT-COMPLETE
- [x] `observability_performance.md` — PS-065-08, SPEC-DRAFT-COMPLETE
- [x] `contract_and_acceptance_tests.md` — PS-065-09, SPEC-DRAFT-COMPLETE
- [x] `import_export_backup_rollback.md` — PS-065-10, SPEC-DRAFT-COMPLETE
