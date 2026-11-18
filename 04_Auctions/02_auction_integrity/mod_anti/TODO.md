# TODO

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Process specifications drafted; implementation not started.

- [x] PS-036-01 domain_schema.md drafted (schedule and extension log embedded in auction; policy immutable).
- [x] PS-036-02 validation_rules.md drafted (120 s window, server time, monotonic end, policy pinning).
- [x] PS-036-03 workflow_state_machine.md drafted (NORMAL, EXTENDED, EXTENSION_CAP_REACHED, ENDED).
- [x] PS-036-04 commands_queries_events.md drafted (evaluate, publish policy, schedule events).
- [x] PS-036-05 authorization_capabilities.md drafted (sys-only extension; advisory signals cannot alter result).
- [x] PS-036-06 failure_recovery_idempotency.md drafted (sequence-based idempotency; replay determinism).
- [x] PS-036-07 privacy_retention_abuse.md drafted (no account identifiers; stall signal counts).
- [x] PS-036-08 observability_performance.md drafted (evaluation lag; repair alert).
- [x] PS-036-09 contract_and_acceptance_tests.md drafted (property and boundary tests).
- [x] PS-036-10 import_export_backup_rollback.md drafted (public schedule export; replay check on restore).
- [ ] Confirm 120 s window, 120 s extension and 10-extension cap with F04 owner (ASSUMPTION values).
- [ ] Confirm boundary with F04.S02.M02 `mod_sniping` (detection vs rule) with F04 owner (PROVISIONAL).
- [ ] Record slug rename (review B-07, proposed `mod_auction_anti_sniping`) in INDEX.md and registry.
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).
