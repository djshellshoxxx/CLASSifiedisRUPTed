# F07.S02.M02 — profiles

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Identity&Trust Lead (F07). **Parent:** F07.S02.

## Purpose and business behavior
Holds the profile attached to each pseudonym (`prf_`): a short public bio, languages, an optional coarse region cell, and an optional private block of contact methods that is shared with a counterparty only on explicit, expiring disclosure. Owns field-level visibility, profile versioning, disclosure grants and the freeze/purge of profiles when a pseudonym is retired. Does not own handles or pseudonym lifecycle (mod_pseudonyms), reputation (mod_reputation), precise location (06_Discovery geoprivacy) or consent records (mod_consent).

## User stories
- As a pseudonym holder, I write a bio and pick languages without entering my name or any contact detail in public fields.
- As a pseudonym holder, I share my contact method with one counterparty for a defined window and can revoke it.
- As a counterparty in an active exchange, I see only the fields the holder disclosed to me.
- As a moderator, I see that a profile has contact methods without seeing their values.

## Scope
- [domain_schema.md](domain_schema.md) — PS-056-01
- [validation_rules.md](validation_rules.md) — PS-056-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-056-03
- [commands_queries_events.md](commands_queries_events.md) — PS-056-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-056-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-056-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-056-07
- [observability_performance.md](observability_performance.md) — PS-056-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-056-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-056-10

## Public interfaces
Commands `UpdateProfile`, `SetFieldVisibility`, `DisclosePrivateField`, `RevokeDisclosure`; queries `GetPublicProfile`, `GetOwnProfile`, `GetCounterpartyView`; events `profile.updated`, `profile.visibility_changed`, `profile.frozen`, `profile.disclosure_granted`, `profile.disclosure_revoked`, `profile.private_purged` (CTR-EVT-001 envelopes). Details in PS-056-04.

## Relationships, dependencies and integration
Upstream: mod_pseudonyms (`pseudonym.created`, `pseudonym.retired`), mod_sessions, F14 supported-locale list, 06_Discovery region grid and K_MIN registry. Downstream: mod_reputation and listings read public fields by `prf_` ID; messaging reads counterparty view. Consent for disclosure: canonical owner ID PENDING (mod_consent). Canonical IDs: CTR-ID-001 `prf`.

## Data ownership
Owns profile rows, visibility settings, disclosure grants and the private block. Does not own `prf_` rows (mod_pseudonyms), reputation scores, region grid, or consent records. Retention per PS-056-07.

## Risk considerations
Specific to profiles: (1) the bio and coarse region are the richest linkage surface in the identity area, since a distinctive bio plus a small region can re-identify a pseudonym across contexts; (2) disclosed contact values persist at a counterparty after revocation, so revocation cannot recall copies; (3) contact data written into public free text bypasses field rules; (4) cached private values on offline devices; (5) region cells with too few profiles reveal location, which K_MIN = 5 is meant to prevent. Profiles do not guarantee anonymity.

## Completion criteria
All ten process specs at SPEC-DRAFT-COMPLETE; every `PS-056-*.Rnn` mapped to `TEST-PS-056-*`; K_MIN, disclosure window and consent owner resolved or kept PROVISIONAL with sign-off; privacy and security review pass (future gate).

## Required process specification inventory
- [x] `domain_schema.md` — PS-056-01, SPEC-DRAFT-COMPLETE
- [x] `validation_rules.md` — PS-056-02, SPEC-DRAFT-COMPLETE
- [x] `workflow_state_machine.md` — PS-056-03, SPEC-DRAFT-COMPLETE
- [x] `commands_queries_events.md` — PS-056-04, SPEC-DRAFT-COMPLETE
- [x] `authorization_capabilities.md` — PS-056-05, SPEC-DRAFT-COMPLETE
- [x] `failure_recovery_idempotency.md` — PS-056-06, SPEC-DRAFT-COMPLETE
- [x] `privacy_retention_abuse.md` — PS-056-07, SPEC-DRAFT-COMPLETE
- [x] `observability_performance.md` — PS-056-08, SPEC-DRAFT-COMPLETE
- [x] `contract_and_acceptance_tests.md` — PS-056-09, SPEC-DRAFT-COMPLETE
- [x] `import_export_backup_rollback.md` — PS-056-10, SPEC-DRAFT-COMPLETE
