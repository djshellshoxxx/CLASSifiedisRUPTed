# Process inventory and integration checklist

**Status:** SPEC-DRAFT-COMPLETE (10 of 10). Owner: [module](SPEC.md). Open reviewer items are tracked in [TODO](TODO.md). See [registry](../../../planning/SPEC_REGISTRY.md).

- [x] [domain_schema.md](domain_schema.md) — PS-004-01: publish fields, `hold` shape, `price` class flagged (OPEN-1)
- [x] Publish fields defined and mapped to `lst_` revision and `listing.*` events
- [x] Data class and retention class set per field (CTR-PRV-001)
- [x] Producers mapped: mod_create, mod_edit, mod_archive, F12 risk verdict

- [x] [validation_rules.md](validation_rules.md) — PS-004-02: steps V0–V10, eight PUB codes
- [x] Order fixed: visibility (V2) before field checks (V7–V10)
- [x] PII scan on title and description maps to hold, not error
- [x] Rate limit (30 per 24 h) placed before any database read

- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-004-03: T1–T9
- [x] Risk timeout fails closed to held_review
- [x] No transition moves published to held_review
- [x] Status announced once through a polite live region, with text labels

- [x] [commands_queries_events.md](commands_queries_events.md) — PS-004-04: `lst.publish`, three events
- [x] Held and rejected events excluded from federation
- [x] Owner-only hold fields in `lst.get_publish_state`
- [x] Request, response and error examples checked against PUB registry

- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-004-05: owner, moderator release, sys check
- [x] Decision matrix rows mapped to CTR-CAP-001 reason codes
- [x] No operator or global override of owner publish
- [x] Owner sees hold reason only; case and moderator identity case-scoped

- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-004-06: atomic commit, outbox, offline re-check
- [x] Failure table covers lost response, two-device conflict, risk timeout, media pending
- [x] Compensation by new events only; no deletion of published events
- [x] Timeouts set: request 3 s, risk 300 ms, media read 2 s

- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-004-07: PII scan, federation opt-in, abuse limits
- [x] Matched PII text never stored, logged or returned
- [x] Draft existence hidden from non-owners
- [x] Deletion propagates to federated tombstones within 24 h

- [x] [observability_performance.md](observability_performance.md) — PS-004-08: metrics, budgets, alerts
- [x] Metric labels exclude listing_id, owner_ref, region_cell and free text
- [x] Publish-log PII pattern raises page alert (zero tolerance)
- [x] Latency and index-lag budgets set

- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-004-09: TEST-PS-004-09-01 to -10
- [x] Every PUB code and T1–T9 row has a test
- [x] Accessibility test covers keyboard, announcement and colour-free state labels
- [x] Consumer contract for F12 events listed as PENDING CTR-MOD-001

- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-004-10: export, import, restore, flag rollback
- [x] Owner export excludes moderator identity and case ID
- [x] Federated listings read-only in this module
- [x] Feature flag `lst.publish.enabled` rollback leaves drafts and events unchanged
