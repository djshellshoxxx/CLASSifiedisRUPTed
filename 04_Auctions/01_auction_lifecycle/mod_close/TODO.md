# TODO

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Process specifications drafted; implementation not started.

- [x] PS-034-01 domain_schema.md drafted (one close record per auc_; winner hidden until confirmation).
- [x] PS-034-02 validation_rules.md drafted (effective end, cancel-with-bids, reserve boundary).
- [x] PS-034-03 workflow_state_machine.md drafted (ENDED_SOLD, CONFIRMED, UNCONFIRMED; 48 h confirmation).
- [x] PS-034-04 commands_queries_events.md drafted (close.run, cancel, confirm; public vs private events).
- [x] PS-034-05 authorization_capabilities.md drafted (sys-only close; winner-only confirm).
- [x] PS-034-06 failure_recovery_idempotency.md drafted (unique record; atomic trx handoff; reconciliation).
- [x] PS-034-07 privacy_retention_abuse.md drafted (winner PRIVATE until confirm; 20 cancellations per 30 days flag).
- [x] PS-034-08 observability_performance.md drafted (close lag; stuck-confirmation alert).
- [x] PS-034-09 contract_and_acceptance_tests.md drafted (sold, unsold, cancel e2e).
- [x] PS-034-10 import_export_backup_rollback.md drafted (archive CSV without reserve or acc_).
- [ ] Confirm 48 h winner confirmation window with F09 and product owners (ASSUMPTION).
- [ ] Confirm `trx_` creation point (at confirmation, not at close) with F09 owner.
- [ ] Confirm seller visibility of winner pseudonym before confirmation (D10 OPEN).
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).
