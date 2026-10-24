# F01.S01.M01 — Create listing module
**Status:** SPECIFIED — REVIEW PENDING. **Feature:** F01 LocalBazaar. **Subfeature:** F01.S01 listings. **Owner:** F01.S01.M01. **No application implementation.**
## Purpose / assembly
An unlocked local principal validates a proposed private draft and commits its owned object, receipt and local event atomically in one IndexedDB vault. No account/tenant/cookie/API/SQL dependency. F07/F16 provide local principal/unlock/protection policy, F10 retention/disclosure, F06 coarse region and F12/F18 locally selected content rules. Draft creation does not publish/export, reserve, send messages or verify settlement. Shared local types/events belong to F15.
## Process specification inventory (planning/SPEC_REGISTRY.csv is canonical)

**Inventory:** 10 registered contracts; status reflects the registry only.
- [domain_schema.md](domain_schema.md) — `PS-002-01`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [validation_rules.md](validation_rules.md) — `PS-002-02`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [workflow_state_machine.md](workflow_state_machine.md) — `PS-002-03`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [commands_queries_events.md](commands_queries_events.md) — `PS-002-04`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [authorization_capabilities.md](authorization_capabilities.md) — `PS-002-05`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — `PS-002-06`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [privacy_retention_abuse.md](privacy_retention_abuse.md) — `PS-002-07`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [observability_performance.md](observability_performance.md) — `PS-002-08`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — `PS-002-09`; registry status: **SPECIFIED_REVIEW_PENDING**.
- [import_export_backup_rollback.md](import_export_backup_rollback.md) — `PS-002-10`; registry status: **SPECIFIED_REVIEW_PENDING**.

## Module composition
Local form -> unlocked principal/context -> PS-002-02/05 validation/permission -> PS-002-06 exact command receipt -> PS-002-01/03 atomic local object/event -> PS-002-04 typed receipt -> PS-002-08 opt-in local diagnostics. PS-002-07/09/10 constrain privacy/tests/export/restore. Sibling edits/publish use current economic revision and local storage guards; private drafts never reach F06/F11. Persistence of sensitive drafts is blocked until storage/key protection review; memory-only composition has no durable-commit label.

## Acceptance
Ten process contracts are review pending. Required evidence: reviewed local principal/key/storage protection profile, versioned in-process schemas and error matrices, conflict/deletion/receipt semantics, browser transaction/quota/tab-race fixtures, privacy/accessibility tests specified and independent review links. No SQL FK or OpenAPI gate. This module cannot confer approval on its siblings or parent feature. Product tests execute only after whole-spec GO.
