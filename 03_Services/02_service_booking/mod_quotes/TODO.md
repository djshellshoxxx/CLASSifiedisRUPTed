# TODO

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Process specifications drafted; implementation not started.

- [x] PS-032-01 domain_schema.md drafted (svq_ record; qte_ not reused).
- [x] PS-032-02 validation_rules.md drafted (SVCQUOTE codes; exact line-item sum).
- [x] PS-032-03 workflow_state_machine.md drafted (DRAFT, SENT, ACCEPTED and terminal states).
- [x] PS-032-04 commands_queries_events.md drafted (six commands, seven events).
- [x] PS-032-05 authorization_capabilities.md drafted (provider self-scope; customer accept).
- [x] PS-032-06 failure_recovery_idempotency.md drafted (atomic accept with outbox).
- [x] PS-032-07 privacy_retention_abuse.md drafted (scope purge at 30 days; 20 quotes per day).
- [x] PS-032-08 observability_performance.md drafted (partial-accept alert).
- [x] PS-032-09 contract_and_acceptance_tests.md drafted (single and three-window flows).
- [x] PS-032-10 import_export_backup_rollback.md drafted (export only in MVP).
- [ ] Request CTR-ID-001 registration for `svq` prefix (ulid, owner F03).
- [ ] Confirm hold TTL (72 h) and decline/withdraw release with F03.S01.M02 owner.
- [ ] Decide how tax-inclusive pricing is represented across currencies with F09 owner (OPEN).
- [ ] Confirm the off-platform contact flag is advisory only with F12 owner.
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).
