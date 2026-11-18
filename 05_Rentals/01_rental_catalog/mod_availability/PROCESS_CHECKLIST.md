# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). Registry: [SPEC_REGISTRY](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-039-01
  - [x] Half-open interval semantics stated
  - [x] Exclusion constraint on item_id and date range specified
  - [ ] Register `avb_` in CTR-ID-001 (lead)
- [x] [validation_rules.md](validation_rules.md) — PS-039-02
  - [x] Span, window and protected-booking codes listed
  - [x] Conflict message hides blocking renter
  - [ ] F05 review of 730-day horizon (pending)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-039-03
  - [x] 15-minute hold expiry timer
  - [x] BOOKED to IN_USE tied to mod_handoff event; IN_USE to RELEASED tied to mod_return
  - [ ] Lifecycle event contract with mod_handoff confirmed (pending)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-039-04
  - [x] Public read returns FREE or BUSY only
  - [x] Idempotency keys per command
  - [ ] Event names reviewed by F15 (pending)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-039-05
  - [x] Owner resolved from listing, not client claim
  - [x] rental.confirm limited to lifecycle service principal
  - [ ] Anonymous rate limit confirmed by F16 (pending)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-039-06
  - [x] Concurrent hold race resolved by exclusion constraint
  - [x] Offline holds disabled; offline owner blocks queued
  - [ ] D08 owner sign-off (pending)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-039-07
  - [x] Renter identity excluded from public calendar
  - [x] Hold caps (3 active, 5 per item per 24 h) specified
  - [ ] F10 review of BUSY-range residual risk (pending; not audited)
- [x] [observability_performance.md](observability_performance.md) — PS-039-08
  - [x] Hold-squatting metric defined
  - [x] Read and write latency budgets
  - [ ] Load plan reviewed by F15 (pending)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-039-09
  - [x] Adjacency and DST-week fixtures
  - [x] Lifecycle integration fixture
  - [ ] Calendar accessibility audit scheduled (F14, future)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-039-10
  - [x] Owner and renter export scope
  - [x] Restore revalidates exclusion constraint
  - [ ] Restore drill scheduled (future)

## Integration gates
- [ ] Record canonical owner for rental availability in CONTRACTS.md (B-06, lead).
- [ ] Validate typed errors, capabilities, events and schema versioning with owners.
- [ ] Cover rollback, backup/restore, import/export and retention in review.
- [ ] Record unresolved choices in DECISIONS.md (lead).
- [ ] Complete Prompt 3 specification-quality review before implementation.
