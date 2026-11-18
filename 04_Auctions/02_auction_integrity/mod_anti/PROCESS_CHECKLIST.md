# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — schedule and log embedded in auction; policy immutable
  - [ ] Confirm `anti_policy` fields with F04 owner
- [x] [validation_rules.md](validation_rules.md) — ANTISNIP.* codes; server-time window
  - [ ] Confirm 1 s clock skew tolerance with platform owner
- [x] [workflow_state_machine.md](workflow_state_machine.md) — cap reached is terminal for extensions only
  - [ ] Confirm bids after cap are still accepted with F04.S01.M02 owner
- [x] [commands_queries_events.md](commands_queries_events.md) — public schedule events; sequence-based dedupe
  - [ ] Confirm `auction.extended` consumers (F13) with notifications owner
- [x] [authorization_capabilities.md](authorization_capabilities.md) — sys-only extension; dual-control policy
  - [ ] Confirm policy approval path with F12 owner
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — replay determinism; reconciliation
  - [ ] Confirm 60 s catch-up target with platform owner
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — no account identifiers; stall signal
  - [ ] Confirm 5-extension stall threshold with F04.S02.M03 owner
- [x] [observability_performance.md](observability_performance.md) — evaluation lag; repair alert
  - [ ] Confirm lag budget after load test (future phase)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — property and boundary suites
  - [ ] Confirm accessibility standard for CI (OPEN)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — public export; replay check on restore
  - [ ] Confirm export rate limit with F15 owner

## Integration gates
- [ ] Resolve cross-module boundary with F04.S02.M02 `mod_sniping` (detection vs extension rule).
- [ ] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.
- [ ] Cover rollback, backup/restore, import/export and retention.
- [ ] Record unresolved choices in DECISIONS.md (D03, D07, D10) and the slug rename in the registry.
- [ ] Complete specification-quality review before implementation.
