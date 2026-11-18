# F11.S02.M03 — conflicts

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead. **Parent:** [F11.S02 relay_sync](../SPEC.md).

**Canonical contracts:** CTR-FED-001 (R06 equivocation, R07 tombstones, verification step 12–14), CTR-EVT-001 (R02 revision, R08 hash chain), CTR-SCH-001 (R08 lossless evidence), CTR-ID-001 (`nod_`, `fpr_`, `cfl_` PENDING), CTR-ERR-001, CTR-CAP-001, CTR-PRV-001 (RET-EVD). Error slug: `CONFLICTS`. Codes used from CTR-FED-001: `FED.EQUIVOCATION`, `FED.PEER_NOT_TRUSTED`. Canonical owner of the conflict record class `cfl_`: this module (PROVISIONAL).

## Purpose and business behavior
Detect and record federated events that contradict each other, and keep the local node from silently accepting either version. Two cases matter. Equivocation: one origin node signs two different events for the same revision of the same aggregate. Revision gap: an origin's event arrives before its predecessor. Equivocation quarantines the peer and keeps both signed versions as evidence. A revision gap is held for a bounded time and then closed or rejected. The module never merges payloads. An origin node is the sole authority for its own aggregates, so the local node never rewrites a remote aggregate to resolve a conflict.

## User stories
- As a node steward, I can see every equivocation with both signed versions, the peer involved, and the status of its quarantine.
- As a node steward, I cannot restore a quarantined peer without a recorded review.
- As a participant, my listings and offers are never silently replaced by a conflicting copy from another node.

## Scope
- [PS-086-01 domain schema](domain_schema.md)
- [PS-086-02 validation rules](validation_rules.md)
- [PS-086-03 workflow state machine](workflow_state_machine.md)
- [PS-086-04 commands, queries and events](commands_queries_events.md)
- [PS-086-05 authorization and capabilities](authorization_capabilities.md)
- [PS-086-06 failure, recovery and idempotency](failure_recovery_idempotency.md)
- [PS-086-07 privacy, retention and abuse](privacy_retention_abuse.md)
- [PS-086-08 observability and performance](observability_performance.md)
- [PS-086-09 contract and acceptance tests](contract_and_acceptance_tests.md)
- [PS-086-10 import, export, backup and rollback](import_export_backup_rollback.md)

## Public interfaces
Internal: `conflict.open` (`sys_`, from the ingress pipeline), `conflict.review`, `conflict.close` (`ope_`), queries `conflict.list` and `conflict.get`. Events `conflict.opened`, `conflict.reviewed`, `conflict.closed`. Typed errors `CONFLICTS.REVISION_GAP`, `CONFLICTS.REVIEW_REQUIRED` and CTR-FED-001 codes. Full contracts in PS-086-04.

## Relationships, dependencies and integration
- Declared dependencies (DEPENDENCY_MATRIX.md): F11.S01.M02 mod_records, F11.S02.M02 mod_dedup.
- Declared dependents: F11.S03.M03 mod_migration.
- Runtime callers: ingress pipeline (`fed.receive_batch`, steps 12–14), peer trust transitions (F11.S03.M01 mod_trust).
- Reference IDs only. F12 owns moderation cases; a conflict may be linked to a `cas_` by ID only.

## Data ownership
This module owns conflict records and the raw evidence bytes of conflicting events. It does not own stored envelopes (F11.S01.M02), duplicate detection (F11.S02.M02), or peer trust state (F11.S03.M01, which this module triggers and reads). Export and deletion follow PS-086-07 and CTR-PRV-001.

## Risk considerations
Main risks: a malicious peer forks an aggregate to make the node show one version and then another; a silent overwrite of local state by a remote revision; evidence lost in a race between two arrivals; a quarantined peer restored without review; hold queues for revision gaps used for memory exhaustion. Mitigations: PS-086-03 (no overwrite, quarantine atomic with the record), PS-086-06 (both arrivals stored), PS-086-05 (review required for restore), PS-086-06 R03 (bounded holds). No platform custody of money. Pseudonyms do not guarantee anonymity.

## Completion criteria
All ten PS-086 process specs are SPEC-DRAFT-COMPLETE. Error codes are registered (PENDING CTR-ERR-001). Evidence retention is reviewed by F10. Steward and F12 review ownership is agreed.

## Open decisions
- PROVISIONAL (D01 default, unapproved): origin node is the sole authority for its aggregates; explicit opt-in.
- ASSUMPTION: 24 h revision-gap hold window (CTR-FED-001 uses 24 h for unknown keys; not specified for gaps).
- OPEN: whether a remote node may ever supply a corrected revision after equivocation. Default: no; a new `aggregate_id` is required (CTR-FED-001 R07).
- PROVISIONAL (D07 default, unapproved): evidence retention RET-EVD.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-086-01
- [x] [validation_rules.md](validation_rules.md) — PS-086-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-086-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-086-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-086-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-086-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-086-07
- [x] [observability_performance.md](observability_performance.md) — PS-086-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-086-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-086-10
