# F15.S04.M03 — mod_tenants

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead. **Parent:** [F15.S04](../SPEC.md). **Registry:** PS-125-01 to PS-125-10 in [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md).

## Purpose and business behavior
Owns the tenant record for one ClassRup node. A tenant is an operator-administered community namespace with a unique slug, one admin account, a configuration document, a set of coarse region cells, a federation mode and a retention profile. The module creates, configures, suspends, resumes and offboards tenants. It never reads or changes another tenant's listings, messages or evidence.

ASSUMPTION: "tenant" is not yet defined in PROJECT_SPEC.md. This module records the working definition above until F15 confirms it.

Operator actions are explicit, dual-approved where marked, auditable and reversible up to offboarding. No tenant action moves money or creates evidence.

## User stories
- As an operator, I can provision a tenant with a slug, admin and region set, and see its provisioning state without reading its content.
- As a tenant admin, I can change my tenant's display name and configuration with optimistic-concurrency protection.
- As an operator, I can suspend a tenant that is abusive, and the suspension takes effect for writes at commit.
- As a tenant admin, I can export my tenant's configuration and references before offboarding.

## Scope
- Tenant identity, slug uniqueness and reservation rules.
- Tenant lifecycle: provisioning, active, suspended, offboarding, deleted.
- Tenant configuration document and its schema versioning.
- Federation mode and retention profile defaults (values owned by F11 and F10; see Relationships).
- Out of scope: admin account lifecycle (F07), peer records and federation traffic (F11), retention class definitions (F10), authorization rules (F16 mod_authorization).

## Public interfaces
Commands `tenant.create`, `tenant.update_config`, `tenant.suspend`, `tenant.resume`, `tenant.offboard`; queries `tenant.get`, `tenant.get_by_slug`, `tenant.list`; events `tenant.*` on CTR-EVT-001; errors `TEN.*` on CTR-ERR-001. Full signatures are in [PS-125-04](commands_queries_events.md).

## Relationships, dependencies and integration
- Upstream: CTR-ID-001 (identifier format; `ten_` prefix is an ASSUMPTION not yet registered), CTR-SCH-001 (config schema versions), CTR-CAP-001 (who may act), CTR-PRV-001 (data classes, region cells).
- Downstream: F16 mod_authorization (tenant-scoped grants), F11 federation (reads `federation_mode`), F10 retention (reads `retention_profile`), F15 observability.
- Reference other records by full ID only. Federation mode default `none` follows D01 (PROVISIONAL).

## Data ownership
Owns: tenant record, tenant configuration document, tenant lifecycle events. Does not own: admin account (`acc_`, F07), region cell registry (CTR-PRV-001), peer trust state (F11).

## Risk considerations
- Cross-tenant leakage through shared slugs, cached configuration or list endpoints that ignore `tenant_id`.
- Operator over-privilege when suspending or deleting tenants; mitigated by dual approval (ASSUMPTION).
- Slug squatting and impersonation of public bodies, which need a reserved list and manual review.
- Federation mode changed without opt-in, exposing tenant content to peers.
- Offboarding that purges records under legal hold (D07).

## Completion criteria
All ten process specifications SPEC-DRAFT-COMPLETE; cross-module IDs resolved against the CTR-* contracts; TEN.* codes registered; Platform Lead review recorded (future gate).

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-125-01 — SPEC-DRAFT-COMPLETE
- [x] [validation_rules.md](validation_rules.md) — PS-125-02 — SPEC-DRAFT-COMPLETE
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-125-03 — SPEC-DRAFT-COMPLETE
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-125-04 — SPEC-DRAFT-COMPLETE
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-125-05 — SPEC-DRAFT-COMPLETE
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-125-06 — SPEC-DRAFT-COMPLETE
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-125-07 — SPEC-DRAFT-COMPLETE
- [x] [observability_performance.md](observability_performance.md) — PS-125-08 — SPEC-DRAFT-COMPLETE
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-125-09 — SPEC-DRAFT-COMPLETE
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-125-10 — SPEC-DRAFT-COMPLETE
