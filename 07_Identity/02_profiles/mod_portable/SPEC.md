# F07.S02.M01 — portable

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Identity&Trust Lead (F07). **Parent:** [F07.S02 profiles](../SPEC.md).

## Purpose and business behavior
Let an account holder export their own profile data as a signed bundle and import a bundle into a node, so a profile can move between nodes without the platform holding recoverable keys (D10). Exports carry only the owner's data at permitted classes. Imports verify signature, schema and expiry before any write, and apply at most once per bundle. Reputation, moderation and evidence are not portable.

## User stories
- As an account holder, I export my profile as a file and keep it.
- As an account holder moving to another node, I import my profile bundle and review what will be created before I confirm.
- As an account holder, I can see that an import was rejected and why, without seeing my data in the message.

## Scope
Ten canonical process specifications listed in the inventory below. Out of scope: federation transport (11_Federation/01_protocol/mod_portable) and live profile editing ([mod_profiles](../mod_profiles/SPEC.md)).

## Public interfaces
Commands `portable.export.generate`, `portable.import.stage`, `portable.import.apply`, `portable.import.cancel`; query `portable.export.download`. Events `portable_bundle.*`, `portable_import.*` (CTR-EVT-001). Error prefix `MOD_PORTABLE.`. Prefixes `bnd_` and `imj_` are PENDING CTR-ID-001 registry entries.

## Relationships, dependencies and integration
Upstream: mod_profiles (source data), mod_sessions (step-up), D10 key model. Downstream: 11_Federation/01_protocol/mod_portable consumes `bnd_` IDs under CTR-FED-001 and does not own bundle records. Canonical contracts: CTR-SCH-001, CTR-PRV-001, CTR-CAP-001, CTR-EVT-001.

## Data ownership
Canonical owner of portable profile bundle and import-job records: `07_Identity/02_profiles/mod_portable` (F07.S02.M01). Slug shared with `11_Federation/01_protocol/mod_portable`; that module owns federation transport only and references `bnd_` by full ID (REVIEW B-06).

## Risk considerations
Bundle exfiltration (contains personal data), replayed or forged bundles, import of a bundle that re-creates a profile from a compromised key, decompression or parsing abuse, and leakage of counterparty data inside an owner's bundle. Signature validity proves integrity and origin of the signing key, not the truth of profile content.

## Completion criteria
All 10 process specs at SPEC-DRAFT-COMPLETE; TEST-PS-055-01 to -23 mapped; Privacy Lead (F10) review of field classes and Security Lead (F16) review of signing design pending.

## Required process specification inventory
- [x] `domain_schema.md` — PS-055-01
- [x] `validation_rules.md` — PS-055-02
- [x] `workflow_state_machine.md` — PS-055-03
- [x] `commands_queries_events.md` — PS-055-04
- [x] `authorization_capabilities.md` — PS-055-05
- [x] `failure_recovery_idempotency.md` — PS-055-06
- [x] `privacy_retention_abuse.md` — PS-055-07
- [x] `observability_performance.md` — PS-055-08
- [x] `contract_and_acceptance_tests.md` — PS-055-09
- [x] `import_export_backup_rollback.md` — PS-055-10
