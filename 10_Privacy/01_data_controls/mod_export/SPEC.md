# F10.S01.M03 — export

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Privacy Lead (F10). **Parent:** [F10.S01 data_controls](../SPEC.md).

## Purpose and business behavior
Give a data subject a complete, verifiable copy of their own personal data and commerce records. The module generates an encrypted package (JSON per data class plus original attachment bytes, with a SHA-256 manifest), delivers it through a single-use download token, and expires it after 7 days or 24 h after first download. Counterparty identities are replaced by per-export pseudonyms. Precise location is included only on explicit, versioned confirmation. The module is export-only; importing a package into another node belongs to F11.S01.M01 and profile import to F07.S02.M01.

## User stories
- As a participant, I can request a full export of my data after re-authenticating and download it once.
- As a participant, I can see which parts of the export are about other people and how they appear (pseudonymised).
- As a participant, I can include precise location only by ticking a confirmation I can read.
- As an operator, I can see generation health without viewing any package content.

## Scope
- In: four export scopes; manifest and encryption; delivery and expiry; pseudonymisation; generation health.
- Out: deletion (`mod_delete`), retention schedules (`mod_retention`), federation bundles (`mod_portable` F11), operator-initiated legal exports (Future).
- Required process specs (registry PS-078-01 to PS-078-10):
  - [domain_schema.md](domain_schema.md) (PS-078-01)
  - [validation_rules.md](validation_rules.md) (PS-078-02)
  - [workflow_state_machine.md](workflow_state_machine.md) (PS-078-03)
  - [commands_queries_events.md](commands_queries_events.md) (PS-078-04)
  - [authorization_capabilities.md](authorization_capabilities.md) (PS-078-05)
  - [failure_recovery_idempotency.md](failure_recovery_idempotency.md) (PS-078-06)
  - [privacy_retention_abuse.md](privacy_retention_abuse.md) (PS-078-07)
  - [observability_performance.md](observability_performance.md) (PS-078-08)
  - [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) (PS-078-09)
  - [import_export_backup_rollback.md](import_export_backup_rollback.md) (PS-078-10)

## Public interfaces
Commands `privacy.export.request`, `privacy.export.download`; query `privacy.export.get`; events `export.*`. Errors `EXPORT.*`. Package format pending CTR-PORT-001.

## Relationships, dependencies and integration
Upstream: authentication and reauthentication (F07.S01), precise location disclosures (F06.S02, CTR-PRV-001), commerce records (F09, CTR-COM-001), consent (F10.S01.M01). Downstream: notifications (F13, generic text), encryption key handling (F16.S02.M01 `mod_key`). Retention of packages follows CTR-PRV-001 RET-EPH and RET-SEC.

## Data ownership
Owns: export requests, manifests, package lifecycle, download-token hashes. Does not own: source records (their feature owners), keys (F16), federation bundles (F11.S01.M01).

## Risk considerations
- Session theft followed by bulk export of private messages and location history.
- Export files leaking through caches, CDN or logs.
- Pseudonymisation that is reversible by comparing with other exports.
- Stale packages after deletion (snapshot semantics, PS-078-10 R05).
- Users misreading a package as complete when counterparty copies are absent.

## Completion criteria
- All ten canonical process specs SPEC-DRAFT-COMPLETE (pending approval).
- Golden fixtures and redaction suite defined (PS-078-09).
- Key-handling decision D10 recorded; privacy review recorded (future gate).

## Required process specification inventory
- [x] `domain_schema.md` — PS-078-01 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `validation_rules.md` — PS-078-02 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `workflow_state_machine.md` — PS-078-03 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `commands_queries_events.md` — PS-078-04 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `authorization_capabilities.md` — PS-078-05 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `failure_recovery_idempotency.md` — PS-078-06 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `privacy_retention_abuse.md` — PS-078-07 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `observability_performance.md` — PS-078-08 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `contract_and_acceptance_tests.md` — PS-078-09 — SPEC-DRAFT-COMPLETE (pending approval)
- [x] `import_export_backup_rollback.md` — PS-078-10 — SPEC-DRAFT-COMPLETE (pending approval)
