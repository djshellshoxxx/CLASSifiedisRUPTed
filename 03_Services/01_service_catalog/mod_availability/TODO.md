# TODO

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Process specifications drafted; implementation not started.

- [x] PS-028-01 domain_schema.md drafted (avw_ window record; coarse region only).
- [x] PS-028-02 validation_rules.md drafted (DST gap, RRULE subset, 500-window cap, ICS limits).
- [x] PS-028-03 workflow_state_machine.md drafted (OPEN, HELD, BOOKED, BLOCKED, RETIRED; 72 h hold).
- [x] PS-028-04 commands_queries_events.md drafted (create, hold, block, import, search).
- [x] PS-028-05 authorization_capabilities.md drafted (provider self-scope; anonymous counts only).
- [x] PS-028-06 failure_recovery_idempotency.md drafted (capacity-1 race, hold expiry timer).
- [x] PS-028-07 privacy_retention_abuse.md drafted (schedule PRIVATE_PERSONAL; hold caps).
- [x] PS-028-08 observability_performance.md drafted (label allowlist, double-booking alert).
- [x] PS-028-09 contract_and_acceptance_tests.md drafted (three DST zones, booking e2e).
- [x] PS-028-10 import_export_backup_rollback.md drafted (ICS export without customer data).
- [ ] Request CTR-ID-001 registration for `avw` prefix (opaque class, owner F03); record in CONTRACTS.md.
- [ ] Confirm with F01 owner that listing stock (F01.S03.M01) and service windows (F03.S01.M02) are separate record classes (review B-06).
- [ ] Confirm 72 h hold TTL and 3-holds-per-day cap with F03 owner (ASSUMPTION values).
- [ ] Confirm timezone database update policy with F15 owner.
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).
