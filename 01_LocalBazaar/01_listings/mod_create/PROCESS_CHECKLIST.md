# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (pending approval). Owner: [module](SPEC.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-002-01 — SPEC-DRAFT-COMPLETE
- [x] Field table with data classes for `listing.draft` (no coordinates or addresses)
- [x] Upstream: F15 ID and envelope contracts; downstream: mod_edit, mod_publish, mod_archive
- [x] Privacy and offline review (only `region_cell` as location)
- [x] Test fixtures and acceptance conditions defined
- [x] [validation_rules.md](validation_rules.md) — PS-002-02 — SPEC-DRAFT-COMPLETE
- [x] Rule R01–R13 with pass and fail fixtures
- [x] Error table: `LST.FIELD_INVALID`, `LST.TYPE_DISABLED`, `PRV.PRECISE_LOCATION_FORBIDDEN`, `SYS.*`
- [x] Location-key rejection before unknown-key rejection
- [x] Test fixtures and acceptance conditions defined
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-002-03 — SPEC-DRAFT-COMPLETE
- [x] Transition table for `none → draft` with replay and failure rows
- [x] Client-only states (`pending_local`, `not_applied`) excluded from server records
- [x] Upstream and downstream mapping (edit, publish, archive out of scope)
- [x] Test fixtures and acceptance conditions defined
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-002-04 — SPEC-DRAFT-COMPLETE
- [x] `listing.create` request and response schemas; `listing.created` envelope
- [x] Payload excludes title, description and price; `content_digest` defined
- [x] Subscriber list for `listing.created` (no notifications on create)
- [x] Test fixtures and acceptance conditions defined
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-002-05 — SPEC-DRAFT-COMPLETE
- [x] `lst.create` matrix: owner, suspended, non-user principals, operators
- [x] Owner-only field visibility for drafts
- [x] Operator and support paths confirmed to exclude draft create or edit
- [x] Test fixtures and acceptance conditions defined
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-002-06 — SPEC-DRAFT-COMPLETE
- [x] Scenario table: lost response, commit failure, offline after 7 days, client ID collision
- [x] Key reuse and in-flight behavior defined
- [x] Offline queue never discards entries
- [x] Test fixtures and acceptance conditions defined
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-002-07 — SPEC-DRAFT-COMPLETE
- [x] Quota (20/24 h), open-draft cap (50), 90-day expiry defined
- [x] Residual risk: personal data in free text, creation time in `lst_` ID
- [x] Retention table per data class
- [x] Test fixtures and acceptance conditions defined
- [x] [observability_performance.md](observability_performance.md) — PS-002-08 — SPEC-DRAFT-COMPLETE
- [x] Latency, commit and validation budgets defined
- [x] Log redaction rules (no title, description, amount or IP)
- [x] Alerts: precise-location, field-invalid share, success rate, key reuse
- [x] Test fixtures and acceptance conditions defined
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-002-09 — SPEC-DRAFT-COMPLETE
- [x] Contract suite cross-checks CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001
- [x] Mobile (360 px), keyboard-only and offline e2e scenarios
- [x] Test fixtures and acceptance conditions defined
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-002-10 — SPEC-DRAFT-COMPLETE
- [x] Import refusal for `federated_import` and `migration` sources
- [x] Owner export and backup restore with hold and deletion replay
- [x] Feature-flag-off and rollback behavior for pending drafts
- [x] Test fixtures and acceptance conditions defined

## Integration gates
- [ ] Resolve cross-module ownership and dependencies (taxonomy owner, region-cell scheme, consumer subscriptions).
- [x] Validate typed errors, capabilities, events and schema versioning against CTR-ERR-001, CTR-CAP-001, CTR-EVT-001 and CTR-SCH-001.
- [x] Cover rollback, backup/restore, import/export and retention (PS-002-10, PS-002-07).
- [x] Record unresolved choices: D03, D05, D07, D08 are referenced in the process specs; DECISIONS.md is not edited by this module.
- [ ] Complete Prompt 3 specification-quality review before implementation.
