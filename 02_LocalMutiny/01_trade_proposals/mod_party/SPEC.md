# F02.S01.M02 — party (`mod_party`)

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Marketplace Lead (accountable role). **Parent:** [F02.S01 trade_proposals](../SPEC.md). **Registry:** PS-014-01 to PS-014-10. **Canonical contracts:** CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-SCH-001. **Open decisions:** D05, D07, D08, D10 (PROVISIONAL defaults, unapproved).

## Purpose and business behavior
A party is one participant slot (`par_`) in a barter cycle proposal (`cyc_`). The slot binds the participant's account (`acc_`, used only for authorization) to a pseudonymous view (`prf_`) shown to counterparties, and records invitation, acceptance, decline, withdrawal and removal. This module owns the `par_` record class for the whole system (B-06): cycle matching references slots by full ID and never creates them.

Out of scope: giving or receiving items (`mod_offer`), cycle lifecycle (`mod_two`), candidate reservation (F02.S02.M04 `mod_party`), precise location (never stored).

## User stories
- As a proposer, I invite a counterparty to a two- to six-party barter by pseudonym.
- As an invitee, I accept or decline with my region cell, without revealing my account.
- As a party, I see the status of every slot in my cycle and why a slot was removed (reason code).

## Scope
- PS-014-01 domain schema; PS-014-02 validation rules; PS-014-03 workflow state machine
- PS-014-04 commands, queries and events; PS-014-05 authorization and capabilities
- PS-014-06 failure, recovery and idempotency; PS-014-07 privacy, retention and abuse
- PS-014-08 observability and performance; PS-014-09 contract and acceptance tests
- PS-014-10 import, export, backup and rollback

## Public interfaces
Commands `party.invite`, `party.accept`, `party.decline`, `party.withdraw`; query `party.list_for_cycle`; events `party.invited|accepted|declined|withdrawn|removed|expired`. Signatures: PS-014-04.

## Relationships, dependencies and integration
Upstream: F02.S01.M01 `mod_two` (cycle creation, lock), F07 identity (`prf_` active view), F10 privacy (K_MIN region rule), F12 moderation (removal by case). Downstream: F02.S01.M03 `mod_offer` (slot must be `accepted`), F02.S02.M04 `mod_party` (cycle reservation by `par_` ID), F02.S03.M01 `mod_consent` (consent references `par_` ID). Contract tests: PS-014-09.

## Data ownership
Owns `par_` records. Does not own accounts, pseudonyms, cycles, offers or consent records.

## Risk considerations
- Identity leakage through slot data: `acc_` is authorization-only and never serialized to counterparties.
- Sybil and block spam: slot and invitation caps (PS-014-07 R03–R04).
- Region inference: coarse cells only, cell threshold K_MIN.
- Identity hopping: pseudonym switch refused after accept.
- Race between accept and expiry or removal: slot-level lock and fixed lock order with the cycle.
- Pseudonyms do not guarantee anonymity; a rare region cell with few participants can narrow identity.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE. Implementation and privacy/security review are future work; nothing is audited.

## Required process specification inventory
- [x] domain_schema.md (PS-014-01)
- [x] validation_rules.md (PS-014-02)
- [x] workflow_state_machine.md (PS-014-03)
- [x] commands_queries_events.md (PS-014-04)
- [x] authorization_capabilities.md (PS-014-05)
- [x] failure_recovery_idempotency.md (PS-014-06)
- [x] privacy_retention_abuse.md (PS-014-07)
- [x] observability_performance.md (PS-014-08)
- [x] contract_and_acceptance_tests.md (PS-014-09)
- [x] import_export_backup_rollback.md (PS-014-10)
