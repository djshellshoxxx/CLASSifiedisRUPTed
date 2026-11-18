# F07.S01.M01 — pseudonyms

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Identity&Trust Lead (F07). **Parent:** F07.S01.

## Purpose and business behavior
Lets each account (`acc_`) act under one or more pseudonymous views (`prf_`), so listings, offers, messages and reputation attach to a handle rather than to a legal name or home address. Covers creating a `prf_`, assigning and reserving handles, editing the short label, and retiring a `prf_`. Does not own sign-in, sessions, recovery (mod_recovery), profile content (mod_profiles) or reputation scores (mod_reputation).

## User stories
- As an account holder, I create a second pseudonym for a separate trading context, and no public surface links it to my first one.
- As an account holder, I retire a pseudonym; its handle stays reserved for 90 days so nobody else can take it.
- As a counterparty, I see only handle and label of a pseudonym, never its account.
- As Trust&Safety, I see retirement and handle-conflict counts without seeing account linkage.

## Scope
- [domain_schema.md](domain_schema.md) — PS-052-01
- [validation_rules.md](validation_rules.md) — PS-052-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-052-03
- [commands_queries_events.md](commands_queries_events.md) — PS-052-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-052-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-052-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-052-07
- [observability_performance.md](observability_performance.md) — PS-052-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-052-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-052-10

## Public interfaces
Commands `CreatePseudonym`, `ChangeHandle`, `UpdateLabel`, `RetirePseudonym`; queries `ListOwnPseudonyms`, `GetPublicPseudonym`; events `pseudonym.created`, `pseudonym.handle_changed`, `pseudonym.label_changed`, `pseudonym.retired` in CTR-EVT-001 envelopes. Details in PS-052-04.

## Relationships, dependencies and integration
Upstream: mod_sessions (authenticated `acc_`), F12 reserved-handle list, configuration of caps. Downstream: mod_profiles and mod_reputation (keyed by `prf_`), listings, offers and messaging (reference `prf_` by full ID only). Retirement guard depends on producer events from F02, F03, F04, F05 and F08 (PS-052-03 R04). Canonical IDs: CTR-ID-001 prefixes `acc`, `prf`.

## Data ownership
Owns `prf_` rows, `handle_reservations`, and the `acc_`→`prf_` link. Does not own `acc_` credentials (mod_sessions, F16), profile fields (mod_profiles), reputation (mod_reputation) or moderation records (F12). Retention per PS-052-07.

## Risk considerations
Specific to pseudonyms: (1) linkability through shared timing, label reuse, repeated counterparties and meetups; (2) Sybil creation to farm reputation or evade bans; (3) handle squatting and impersonation of operators and known users; (4) `acc_` leakage through API fields, logs, push payloads or federation; (5) retired handles resurfacing. A pseudonym is not an anonymity guarantee; this module reduces casual linkage only.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; every `PS-052-*.Rnn` mapped to `TEST-PS-052-*`; D10 and D07 approved or kept PROVISIONAL with explicit sign-off; privacy and security review pass (future gate).

## Required process specification inventory
- [x] `domain_schema.md` — PS-052-01, SPEC-DRAFT-COMPLETE
- [x] `validation_rules.md` — PS-052-02, SPEC-DRAFT-COMPLETE
- [x] `workflow_state_machine.md` — PS-052-03, SPEC-DRAFT-COMPLETE
- [x] `commands_queries_events.md` — PS-052-04, SPEC-DRAFT-COMPLETE
- [x] `authorization_capabilities.md` — PS-052-05, SPEC-DRAFT-COMPLETE
- [x] `failure_recovery_idempotency.md` — PS-052-06, SPEC-DRAFT-COMPLETE
- [x] `privacy_retention_abuse.md` — PS-052-07, SPEC-DRAFT-COMPLETE
- [x] `observability_performance.md` — PS-052-08, SPEC-DRAFT-COMPLETE
- [x] `contract_and_acceptance_tests.md` — PS-052-09, SPEC-DRAFT-COMPLETE
- [x] `import_export_backup_rollback.md` — PS-052-10, SPEC-DRAFT-COMPLETE
