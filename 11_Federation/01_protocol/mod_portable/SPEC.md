# F11.S01.M01 — portable

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead (role). **Parent:** F11.S01.

## Purpose and business behavior
Create signed, expiring bundles of a user's federable items (per-item `federate` opt-in) for delivery to a named peer audience, and verify and import such bundles at a receiving node with provenance kept. Bundles reuse CTR-EVT-001 envelopes and CTR-FED-001 verification; this module adds no new envelope.
B-06 (PROVISIONAL): profile-level account data export is owned by `07_Identity/02_profiles/mod_portable`. This module owns federated portable bundles only.

## User stories
- As a participant, I can export my opted-in listings as a bundle for a named peer node.
- As a receiving operator, I can verify a bundle before any row is written.
- As a participant, an item I have not opted in to federation is never in a bundle.
- As a user, a bundle expires and can be revoked if my node's key is compromised.

## Scope
- [domain_schema.md](domain_schema.md) — PS-083-01
- [validation_rules.md](validation_rules.md) — PS-083-02
- [workflow_state_machine.md](workflow_state_machine.md) — PS-083-03
- [commands_queries_events.md](commands_queries_events.md) — PS-083-04
- [authorization_capabilities.md](authorization_capabilities.md) — PS-083-05
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-083-06
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-083-07
- [observability_performance.md](observability_performance.md) — PS-083-08
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-083-09
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-083-10

## Public interfaces
Commands `portable.create_bundle`, `portable.import_bundle`; query/dry-run `portable.verify_bundle`. Events `bundle.created`, `bundle.delivered`, `bundle.imported`, `bundle.rejected`, `bundle.expired`, `bundle.revoked`. Details in PS-083-04.

## Relationships, dependencies and integration
Upstream: federation envelope and verification (CTR-FED-001), per-item opt-in (`11_Federation/01_protocol/mod_records`), key lifecycle (F16). Downstream: peer nodes, relay delivery (`mod_delivery`), profile export (`07_Identity/02_profiles/mod_portable`) by full ID.

## Data ownership
Owns bundle records and manifests. Does not own items, envelopes or profile data.

## Risk considerations
Bundles leak restricted data if the opt-in filter fails. Stable pseudonyms let two peers correlate one owner. Bundles signed under a compromised key are imported later. Duplicate profile-export records drift from this module's bundles. Partial imports leave inconsistent aggregates.

## Completion criteria
All 10 process specs reviewed by Platform and Privacy leads; two-node acceptance test defined; B-06 link confirmed.

## Required process specification inventory
- [x] `domain_schema.md` — PS-083-01, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-083-02, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-083-03, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-083-04, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-083-05, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-083-06, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-083-07, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-083-08, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-083-09, SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-083-10, SPEC-DRAFT-COMPLETE (pending approval)
