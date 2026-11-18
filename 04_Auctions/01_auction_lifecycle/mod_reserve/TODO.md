# TODO

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Process specifications drafted; implementation not started.

- [x] PS-035-01 domain_schema.md drafted (reserve embedded in auction; history append-only).
- [x] PS-035-02 validation_rules.md drafted (opening-price floor; raise-before-bid rule; change limit).
- [x] PS-035-03 workflow_state_machine.md drafted (UNSET, SET, MET; MET one-way).
- [x] PS-035-04 commands_queries_events.md drafted (set, lower, status; value never in events).
- [x] PS-035-05 authorization_capabilities.md drafted (seller-only value; status public).
- [x] PS-035-06 failure_recovery_idempotency.md drafted (MET in bid transaction; reconciliation fallback).
- [x] PS-035-07 privacy_retention_abuse.md drafted (value purged 30 days after close).
- [x] PS-035-08 observability_performance.md drafted (reconciliation alert).
- [x] PS-035-09 contract_and_acceptance_tests.md drafted (invariant and boundary tests).
- [x] PS-035-10 import_export_backup_rollback.md drafted (seller export before purge only).
- [ ] Confirm the raise-before-first-bid rule with product owner (ASSUMPTION).
- [ ] Decide whether lowering below current high bid is allowed (OPEN).
- [ ] Confirm 30-day post-close purge with F10 owner and jurisdiction review (OPEN).
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).
