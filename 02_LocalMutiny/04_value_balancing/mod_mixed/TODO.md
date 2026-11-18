# TODO

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Process specifications drafted; implementation not started.

- [x] PS-026-01 domain_schema.md drafted (leg sub-object, six kinds aligned to CTR-COM-001 method enum).
- [x] PS-026-02 validation_rules.md drafted (MIXED.* codes, gap balance exact).
- [x] PS-026-03 workflow_state_machine.md drafted (DRAFT → DECLARED → CONSENTED → SUBMITTED; UNATTESTED timer).
- [x] PS-026-04 commands_queries_events.md drafted (four commands, four events).
- [x] PS-026-05 authorization_capabilities.md drafted (participant-scoped legs, case-scoped moderator reads).
- [x] PS-026-06 failure_recovery_idempotency.md drafted (submit-then-link reconciliation).
- [x] PS-026-07 privacy_retention_abuse.md drafted (FINANCIAL_EVIDENCE legs, 30-day draft purge).
- [x] PS-026-08 observability_performance.md drafted (label allowlist, no amounts in logs).
- [x] PS-026-09 contract_and_acceptance_tests.md drafted (six kinds, three-party on-chain fixture).
- [x] PS-026-10 import_export_backup_rollback.md drafted (participant export, no import in MVP).
- [ ] Confirm with F09 owner that leg kinds map one-to-one to CTR-COM-001 `method` (no extra kind added here).
- [ ] Confirm the 8-leg limit and 72 h attestation grace period with F02 owner (ASSUMPTION values).
- [ ] Confirm D04 partial-execution wording with F02 owner before approval (PROVISIONAL).
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).
