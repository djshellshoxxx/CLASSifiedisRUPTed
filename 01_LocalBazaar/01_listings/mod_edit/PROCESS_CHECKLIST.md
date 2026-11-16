# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

Spec authoring items are checked. Review and gate items stay open until the named leads sign off.

- [x] [domain_schema.md](domain_schema.md) — six editable fields with CTR-PRV-001 classes; region precision excluded
- [x] Requirement IDs and test IDs assigned (PS-003-01.Rnn, TEST-PS-003-01-nn)
- [ ] Privacy lead review: no coordinates or addresses stored (F10)
- [x] [validation_rules.md](validation_rules.md) — closed `changes` object; bidi and control-character rules; no values echoed
- [x] Requirement IDs and test IDs assigned (PS-003-02.Rnn, TEST-PS-003-02-nn)
- [ ] Accessibility lead review: field-error messages reachable by keyboard (F14)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — transition table for draft, published, archived, hidden
- [x] Requirement IDs and test IDs assigned (PS-003-03.Rnn, TEST-PS-003-03-nn)
- [ ] Commerce lead review: material-edit block while offers open (F09 with F02)
- [x] [commands_queries_events.md](commands_queries_events.md) — `listing.edit`, `listing.get_for_edit`, `listing.updated` v1.0.0
- [x] Requirement IDs and test IDs assigned (PS-003-04.Rnn, TEST-PS-003-04-nn)
- [ ] Platform lead review: CTR-SCH-001 registration of `listing.updated` (F15)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — owner-only `lst.update`; `ope` and `mod` denied
- [x] Requirement IDs and test IDs assigned (PS-003-05.Rnn, TEST-PS-003-05-nn)
- [ ] Security lead review: owner relation and `prf_` resolution (F16)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — atomic revision and outbox; no last-writer-wins; D08 queue
- [x] Requirement IDs and test IDs assigned (PS-003-06.Rnn, TEST-PS-003-06-nn)
- [ ] Platform lead review: outbox retry and dead-letter policy (F15)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — no content in events or logs; rate limits; churn signal
- [x] Requirement IDs and test IDs assigned (PS-003-07.Rnn, TEST-PS-003-07-nn)
- [ ] Trust and safety lead review: rate limits and churn threshold (F12)
- [x] [observability_performance.md](observability_performance.md) — metric label allow-list; budgets; alerts
- [x] Requirement IDs and test IDs assigned (PS-003-08.Rnn, TEST-PS-003-08-nn)
- [ ] QA lead review: load test plan at 200 req/s (F17)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — producer and consumer contracts; mobile and screen-reader tests
- [x] Requirement IDs and test IDs assigned (PS-003-09.Rnn, TEST-PS-003-09-nn)
- [ ] QA lead review: fixtures contain no personal data (F17)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — export shape; unknown-key rollback; flag-off behavior
- [x] Requirement IDs and test IDs assigned (PS-003-10.Rnn, TEST-PS-003-10-nn)
- [ ] Platform lead review: device queue retention and restore replay (F15)

## Integration gates
- [ ] Resolve cross-module ownership: listing lifecycle (CTR-LST-001 PENDING), open-offer flag (mod_offers).
- [ ] Validate typed errors (`EDIT.*`), capabilities (`lst.update`, `lst.read`), events and schema versioning.
- [ ] Cover rollback, backup/restore, import/export and retention (PS-003-10).
- [ ] Record unresolved choices in DECISIONS.md (D01, D03, D05, D07, D08).
- [ ] Complete Prompt 3 specification-quality review before implementation.
