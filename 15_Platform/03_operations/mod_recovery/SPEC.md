# F15.S03.M03 — Disaster recovery

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S03](../SPEC.md). **Process IDs:** PS-122-01…PS-122-10. **Code:** `apps/relay/src/ops/recovery`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Restore tooling and the runbook for a relay, with targets of RPO 6 h and RTO 4 h (CTR-IOX-001 IOX-3, IOX-4), plus operator replay of dead-lettered events (CTR-EVT-001 EVT-6). Recovery always creates a new relay instance from verified backups of F15.S03.M02, applies WAL segments up to the chosen time, re-applies signed tombstones, re-delivers archived events to idempotent relay consumers, and only then opens the port. Under ADR-0016 the relay holds no user-owned private records, so recovery of a user's private data is a vault restore from the user's own export (F10.S01.M03), which this module documents but does not perform. Event replay re-delivers events to consumers; it does not reconstruct aggregates, and data written after the last snapshot or WAL segment is lost, which is the stated RPO.

## Responsibilities

- Provide the restore command relay restore --to <dir> [--at <timestamp>|latest] that locates the base snapshot, verifies checksums, decrypts, applies WAL segments in order up to the target time, runs integrity checks and migrations check, and writes a restore report.
- Provide a recovery plan query that shows which snapshot, WAL segments and archive segments would be used, the expected data-loss window and an RTO estimate before anything is restored.
- Re-deliver archived outbox events newer than the restored watermark to relay consumers through the inbox, and re-apply signed tombstones before serving traffic.
- Provide dead-letter listing and operator replay (max 500 events per call, max 3 replays per event) with audit and a dry-run mode.
- Maintain the restore runbook with timed steps that fit in 4 h and the quarterly drill checklist.

## Not responsible for

- Taking and verifying backups (F15.S03.M02 mod_backups).
- Recovery of a user's vault; the user restores from their own export, F10.S01.M03 and the recovery kit of F07, and nothing here can read or rebuild a vault.
- Failover orchestration, hot standby and DNS automation. Future: warm standby relay with continuous WAL shipping; Future: automatic DNS cutover.
- Incident process and communications (F16.S03.M02 and F16.S03.M03).

## User stories

- As a relay operator, after losing my server I can restore the latest backup to a new machine in under 4 hours, losing at most the last 6 hours, and know exactly what was lost.
- As a relay operator, I can see which events failed delivery, fix the cause and replay them without duplicating side effects.
- As a member, I understand that if my relay is lost, my private records are safe in my own vault and my deliveries show as pending until I choose another relay.

## Edge cases

- The newest snapshot fails verification; the plan automatically selects the newest verified snapshot and states the larger data-loss window.
- A WAL segment in the middle of the chain is missing or corrupt; restore stops at the last contiguous segment and reports the exact timestamp reached, never applying later segments.
- The relay identity key file is not available; restore proceeds only with --new-identity, which creates a new key id and warns that vaults will show a changed fingerprint.
- Dead-lettered event is replayed but the consumer module is disabled by flag; replay is refused with FEATURE_DISABLED and the event stays dead-lettered.
- Replay of the same event is requested a fourth time; refused with PLATFORM_DEADLETTER_REPLAY_LIMIT and the operator must investigate.
- Restored database is older than events already seen by peers; restored relay serves from restored data, and vaults detect missing receipts through their sync outbox states, not through the relay.
- Restore target directory is not empty or on the same volume as the live database; the tool refuses.

## UX and accessibility



Operator CLI and API: relay restore, relay restore plan, relay deadletter list, relay deadletter replay [--dry-run]. A restore report is written to <dir>/restore-report.json and printed. No end-user UI; the PWA only shows relay reachability and pending delivery states.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: `platform.deadletter.replay`
- Queries: `platform.deadletter.list`, `platform.recovery.get_plan`
- Emits: `platform.deadletter.replayed`
- Consumes: `platform.backup.completed`, `platform.backup.failed`

## Dependencies

F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-122-01 | [Domain schema](domain_schema.md) | 3 |
| PS-122-02 | [Validation rules](validation_rules.md) | 3 |
| PS-122-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-122-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-122-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-122-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-122-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-122-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-122-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-122-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/relay/src/ops/recovery/index.ts`.

## Acceptance criteria

- All tests T01-T16 pass in CI and the manual drill T17 is completed at least every 100 days.
- A restore to a new instance completes within 4 h with at most 6 h of data loss, and the report states both numbers.
- Dead-letter replay never produces duplicate side effects and is limited to 3 replays per event.
- Recovery never reads or reconstructs vault data, and user private records remain recoverable only from the user's own export.
