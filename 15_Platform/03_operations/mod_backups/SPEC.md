# F15.S03.M02 — Backups

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S03](../SPEC.md). **Process IDs:** PS-120-01…PS-120-10. **Code:** `apps/relay/src/ops/backups`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A relay operator's backups: scheduled SQLite online backups every 6 h plus WAL segment archiving, encrypted at rest with an operator-supplied key, rotated to 30 daily and 12 monthly copies, and verified by an automated restore check (CTR-IOX-001 IOX-3, IOX-7). Under ADR-0016 these backups cover only what a relay holds: signed public projections, end-to-end encrypted envelopes and relay-local operational data. The user's own vault export is the primary backup of private records (IOX-6) and is not handled here; losing a relay loses no user-owned private data. The relay never holds funds and backups never contain vault keys.

## Responsibilities

- Take a consistent full snapshot of the relay SQLite database every 6 h using the SQLite online backup API (node:sqlite backup()), write it encrypted to the configured backup directory and record a BackupRecord.
- Archive WAL segments every 5 min with a held read transaction so no checkpoint resets the WAL during the copy, record each segment with frame range and checksum, and ship the hourly outbox archive segments alongside.
- Encrypt every artifact with AES-256-GCM in 1 MiB chunks under a key derived by HKDF-SHA256 from the operator-supplied backup key (RELAY_BACKUP_KEY_FILE), never stored in the repository or next to the artifacts.
- Rotate retention to 8 six-hourly snapshots, 30 daily and 12 monthly full snapshots and 7 days of WAL segments, deleting only artifacts older than their tier after a newer verified snapshot exists.
- Verify each snapshot right after writing it (decrypt, checksum, PRAGMA integrity_check, foreign_key_check, row-count comparison) and provide the verification command used by quarterly restore drills.
- Emit platform.backup.completed and platform.backup.failed for operators and the observability module.

## Not responsible for

- Restore tooling, runbook, RPO/RTO drills and dead-letter replay (F15.S03.M03 mod_recovery).
- The user's vault export and its 30-day reminder (F10.S01.M03 and F15.S01.M01); this module never reads vaults.
- Backup of the relay identity key file and the backup key; the operator stores them separately.
- Offsite transport beyond a mounted filesystem path. Future: native S3-compatible and SFTP targets; Future: incremental block-level snapshots.

## User stories

- As a relay operator, I get an encrypted verified backup every 6 hours without stopping the relay, and an alert if one fails or none succeeded in 7 hours.
- As a relay operator, I can run a verification that restores the latest backup into a temporary directory and proves it opens and passes integrity checks.
- As a member who selected this relay, I know that losing it never loses my private records, because those are in my own vault export.

## Edge cases

- The backup directory is full or free space is below 2 times the database size; the run fails fast with PLATFORM_BACKUP_NO_SPACE, emits platform.backup.failed and leaves earlier backups untouched.
- The relay is writing heavily during a snapshot; the online backup runs in steps of 100 pages with 5 ms pauses so writers are never blocked for more than 50 ms, and the snapshot is consistent as of its start.
- The WAL file is reset by a checkpoint between two archive runs, leaving a gap; the segment is marked gap and the next full snapshot is requested immediately, so recovery falls back to the last snapshot (RPO bound 6 h).
- The backup key is wrong or missing at verification time; decryption fails with PLATFORM_BACKUP_DECRYPT_FAILED and the record stays completed but never verified, and an alert fires.
- Two backup runs overlap (manual run during the schedule); the second is refused with CONFLICT_STATE.
- A backup artifact is truncated or modified on disk; checksum verification fails, the record becomes failed and an extra snapshot is taken.
- Clock jumps backward; scheduling uses a monotonic timer for intervals and stamps records with wall time only for labeling.

## UX and accessibility



Headless operator service with CLI: relay backup run, relay backup list, relay backup verify <id|latest> [--drill], relay backup prune --dry-run. Backup status appears in the operator status query and metrics; the PWA shows only relay reachability, never relay backup data.

## Owned data

- `BackupRecord` (classrup.platform.backup_record/v1, P1, RET-AUDIT)

## Interfaces

- Commands: `platform.backup.run`, `platform.backup.verify`
- Queries: `platform.backup.list`, `platform.backup.get_status`
- Emits: `platform.backup.completed`, `platform.backup.failed`
- Consumes: none

## Dependencies

F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-120-01 | [Domain schema](domain_schema.md) | 3 |
| PS-120-02 | [Validation rules](validation_rules.md) | 3 |
| PS-120-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-120-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-120-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-120-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-120-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-120-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-120-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-120-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/relay/src/ops/backups/index.ts`.

## Acceptance criteria

- All tests T01-T18 pass in CI and a restore drill is performed at least every 100 days.
- A verified encrypted snapshot exists at least every 6 hours or an alert fires within 7 hours.
- No backup artifact contains plaintext private data or key material.
- A restored relay reproduces the database content hash of the snapshot and re-applies tombstones.
