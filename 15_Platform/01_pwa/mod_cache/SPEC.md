# F15.S01.M02 — cache

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead. **Parent:** [F15.S01 pwa](../SPEC.md).

## Purpose and business behavior
Decide what the progressive web app stores on the device for offline and fast reloads: the versioned app shell, the locale catalogs, and public listing and region-cell data. Nothing else is cached. Authenticated, private, financial, secret and precise-location responses are never stored. Pending writes are not cache entries; they belong to the offline pending queue (D08 PROVISIONAL). Logout and account switch purge the data layer.

## User stories
- As a participant on a weak connection, I can reopen the app and see the last public listings I viewed.
- As a participant on a shared phone, I can log out and know that my signed-in data is gone from the device.
- As an operator, I can disable the service worker cache with one flag if a bad build ships.

## Scope
- In scope: build manifest, shell precache, data cache classes, quota and eviction, purge triggers, build switch.
- Out of scope: pending-write queue (mod_offline), install prompts (mod_install), server caches.

## Public interfaces
Local operations `cache.purge_data`, `cache.activate_build`. No server command. Consumes F07 session events. See [commands_queries_events.md](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: storage (F15.S02.M03), session and security boundary (F16.S01.M02). Downstream: offline queue (F15.S01.M01), install (F15.S01.M03), performance tests (F17.S02.M03). Contracts: CTR-PRV-001, CTR-ERR-001, CTR-SCH-001. Edges per DEPENDENCY_MATRIX.md.

## Data ownership
Owns device-local cache entries and build manifests. Owns no server records.

## Risk considerations
- Privacy: cached public data on shared devices; cached private data would be a severe leak, so classes are enforced in code.
- Integrity: cache poisoning or mixed builds; mitigated by hash manifest and atomic build switch.
- Availability: stale data served while offline must be marked as stale.
- Abuse: offline phishing copies of the app; mitigated by same-origin rules.
- No platform custody of money; no payment data is cached.

## Completion criteria
Process specs PS-114-01 to PS-114-10 at SPEC-DRAFT-COMPLETE; Security Lead and Privacy Lead reviews pending; D05 and D08 defaults remain PROVISIONAL.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-114-01
- [x] [validation_rules.md](validation_rules.md) — PS-114-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-114-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-114-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-114-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-114-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-114-07
- [x] [observability_performance.md](observability_performance.md) — PS-114-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-114-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-114-10
