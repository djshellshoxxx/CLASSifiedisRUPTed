# TODO

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Process specifications drafted; implementation not started.

- [x] PS-033-01 domain_schema.md drafted (bid_ opaque; amount in auction currency only).
- [x] PS-033-02 validation_rules.md drafted (5% increment with 1-unit floor; rate limits).
- [x] PS-033-03 workflow_state_machine.md drafted (ACCEPTED, OUTBID, REJECTED, VOIDED; no withdrawal).
- [x] PS-033-04 commands_queries_events.md drafted (place, void, history; public events without acc_).
- [x] PS-033-05 authorization_capabilities.md drafted (seller bid block; pseudonym visibility).
- [x] PS-033-06 failure_recovery_idempotency.md drafted (auction lock, lease, offline rejection on ack).
- [x] PS-033-07 privacy_retention_abuse.md drafted (shill signals to F04.S02.M03).
- [x] PS-033-08 observability_performance.md drafted (no bidder identifiers in logs).
- [x] PS-033-09 contract_and_acceptance_tests.md drafted (1,000-bid concurrency suite).
- [x] PS-033-10 import_export_backup_rollback.md drafted (archive CSV without acc_).
- [ ] Confirm the 5% minimum increment and 1-unit floor with F04 owner (ASSUMPTION).
- [ ] Confirm pseudonymous bidder display during open auctions with F10 privacy lead (D10 OPEN).
- [ ] Record proxy bidding as Future scope in PROJECT_SPEC or F04 SPEC (no spec here).
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).
