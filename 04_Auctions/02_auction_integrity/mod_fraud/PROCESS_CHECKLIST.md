# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-037-01
  - [x] Every field classed per CTR-PRV-001 R01 (device_key_hash PRIVATE_PERSONAL)
  - [ ] Register `afs_`/`afc_` in CTR-ID-001 (lead)
  - [x] bid_/auc_/acc_ referenced by ID only
- [x] [validation_rules.md](validation_rules.md) — PS-037-02
  - [x] Validation order and FRAUD.* codes listed
  - [x] Diagnostics exclude account, bid and feature values
  - [ ] Fixture corpus reviewed by F12 (pending)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-037-03
  - [x] Bidder-moderator conflict guard specified
  - [x] 90-day and 30-day timers specified
  - [ ] mod_close consumer of UPHELD confirmed (pending)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-037-04
  - [x] Idempotency keys per command
  - [x] No device hash or account ID in events
  - [ ] Producer/consumer map with mod_bids confirmed (pending)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-037-05
  - [x] Actor x action x capability table
  - [x] Appellant view limited to own outcome
  - [ ] Dual-control policy approved by F16 (pending)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-037-06
  - [x] Backoff schedule and DLQ specified
  - [x] Reconciler repairs missing case within 5 min
  - [ ] Load test plan reviewed by F15 (pending)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-037-07
  - [x] Retention periods listed, PROVISIONAL (D07)
  - [x] Key rotation for device hash every 30 days
  - [ ] F10 privacy review (pending; not audited)
- [x] [observability_performance.md](observability_performance.md) — PS-037-08
  - [x] Metric labels exclude account-level values
  - [x] Redaction test defined
  - [ ] Telemetry budget confirmed by F15 (pending)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-037-09
  - [x] True-positive and false-positive fixtures defined
  - [x] Zero-leak acceptance criterion stated
  - [ ] Real-data validation gate scheduled (future)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-037-10
  - [x] Subject export excludes other accounts
  - [x] Rule rollback leaves signals unchanged
  - [ ] Restore drill scheduled (future)

## Integration gates
- [ ] Resolve boundary with 02_auction_integrity/mod_anti.
- [ ] Validate typed errors, capabilities, events and schema versioning with owners.
- [ ] Cover rollback, backup/restore, import/export and retention in review.
- [ ] Record unresolved choices in DECISIONS.md (lead).
- [ ] Complete Prompt 3 specification-quality review before implementation.
