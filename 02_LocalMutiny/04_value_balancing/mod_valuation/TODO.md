# TODO

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Process specifications drafted; implementation not started.

- [x] PS-027-01 domain_schema.md drafted (snapshot keyed by cyc_ and revision; value_source on every line).
- [x] PS-027-02 validation_rules.md drafted (VALUE.* codes; integer-only arithmetic).
- [x] PS-027-03 workflow_state_machine.md drafted (COMPUTED, CURRENT, STALE, RECOMPUTED).
- [x] PS-027-04 commands_queries_events.md drafted (compute, get, declare_value).
- [x] PS-027-05 authorization_capabilities.md drafted (slot-owner declare, participant read).
- [x] PS-027-06 failure_recovery_idempotency.md drafted (single-row compute, no partial writes).
- [x] PS-027-07 privacy_retention_abuse.md drafted (50% deviation advisory to F12).
- [x] PS-027-08 observability_performance.md drafted (label allowlist, partial-write alert).
- [x] PS-027-09 contract_and_acceptance_tests.md drafted (HALF_EVEN tie vectors, 16-item fixture).
- [x] PS-027-10 import_export_backup_rollback.md drafted (export only; rounding version kept per snapshot).
- [ ] Confirm with F09.S03 owner that quote and rounding authority sits there (review M-16); update CONTRACTS.md owner table.
- [ ] Confirm the 50% advisory threshold and 16-item limit with F12 and F02 owners (ASSUMPTION values).
- [ ] Confirm whether listing-reference lines are mandatory when a listing exists (product decision).
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).
