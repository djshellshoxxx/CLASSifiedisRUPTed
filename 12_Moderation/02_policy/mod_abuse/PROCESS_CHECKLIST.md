# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md). Drafting items are checked; approval gates stay open until reviewed.

## Process drafts
- [x] [domain_schema.md](domain_schema.md) — PS-095-01 drafted; finding fields and digest rule.
- [x] [validation_rules.md](validation_rules.md) — PS-095-02 drafted; normalization and rule approval.
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-095-03 drafted; findings and reporter misuse.
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-095-04 drafted; scanner principal split.
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-095-05 drafted; text access under case grant.
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-095-06 drafted; detective scanning, staged rollout.
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-095-07 drafted; keyed digests and bias review.
- [x] [observability_performance.md](observability_performance.md) — PS-095-08 drafted; precision monitoring.
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-095-09 drafted; evasion corpus.
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-095-10 drafted; signed rule bundles.

## Approval gates (open)
- [ ] Privacy Lead (F10) review of PS-095-07 and PIA requirement.
- [ ] Security Lead (F16) review of key handling for `match_digest` and scanner credentials.
- [ ] Trust&Safety Lead sign-off on lexicon governance and thresholds.
- [ ] QA Lead (F17) review of evasion corpus (PS-095-09).

## Integration gates
- [ ] Resolve `abf` prefix and rule aggregate in CTR-ID-001 (PENDING).
- [ ] Validate ABU.* codes against CTR-ERR-001 registry lint.
- [ ] Record D01, D07 in DECISIONS.md as referenced (PROVISIONAL).
