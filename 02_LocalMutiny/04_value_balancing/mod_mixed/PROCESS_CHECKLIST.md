# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — legs have no standalone ID; `clm_` only after submit
  - [ ] Confirm `in_kind_compensation` description limit (280) with privacy lead
- [x] [validation_rules.md](validation_rules.md) — MIXED.* codes registered
  - [ ] Confirm gap tolerance of 0 minor units with mod_valuation owner
- [x] [workflow_state_machine.md](workflow_state_machine.md) — no PAID state; UNATTESTED timer
  - [ ] Confirm 72 h grace period with F02 owner
- [x] [commands_queries_events.md](commands_queries_events.md) — four commands, four events
  - [ ] Confirm event payloads carry no amounts with F13 notifications owner
- [x] [authorization_capabilities.md](authorization_capabilities.md) — participant-scoped legs
  - [ ] Confirm moderator case-scope read with F12 owner
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — submit-then-link reconciliation
  - [ ] Confirm offline pending queue behavior for legs with D08 owner
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — 30-day draft purge, 14 + 365 day evidence
  - [ ] Confirm retention periods with F10 owner and jurisdiction review (OPEN)
- [x] [observability_performance.md](observability_performance.md) — label allowlist, stuck-leg alert
  - [ ] Confirm p95 budgets after load test (future phase)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — six leg kinds covered
  - [ ] Confirm accessibility standard for CI check (OPEN)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — export only in MVP
  - [ ] Confirm export size limit and link expiry with F15 owner

## Integration gates
- [ ] Resolve cross-module ownership: claims owned by F09 (CTR-COM-001), snapshots by F02.S04.M03.
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D03, D04, D07, D08).
- [ ] Complete specification-quality review before implementation.
