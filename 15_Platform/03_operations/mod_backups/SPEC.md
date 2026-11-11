# F15.S03.M02 — Backups

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S03](../SPEC.md). **Process IDs:** PS-120-01…PS-120-10. **Code:** `apps/relay/src/ops/backups`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A relay operator's backups: full SQLite snapshots every 6 h taken with the node:sqlite online backup API on the relay's writer connection (page-exact, consistent as of the completion of the final step), continuous WAL archiving in the Litestream style (this module is the only checkpointer: automatic checkpoints are off, a read transaction is held between archive runs, frames are copied up to mxFrame and fsynced before a checkpoint), and a tombstone ledger so that no restore ever resurrects deleted public content. Every artifact is encrypted with its own key derived from an operator-supplied backup key, every manifest is authenticated and chained to the previous one, retention rotates to 30 daily and 12 monthly copies, and an automated restore check verifies each snapshot (CTR-IOX-001 IOX-3, IOX-7). Under ADR-0016 these backups cover only what a relay holds: signed public projections, end-to-end encrypted envelopes, P0 media and relay-local operational data; the encrypted attachment MediaBlobs of F08.S01.M03 are excluded and only their attachment rows are backed up. The user's own vault export is the primary backup of private records (IOX-6) and is not handled here; losing a relay loses no user-owned private data. The relay never holds funds and backups never contain vault keys.

## Responsibilities

- Take a full snapshot of the relay SQLite database every 6 h with node:sqlite backup() on the relay's writer connection in steps of 100 pages, record its true consistency point (consistentAt, the completion of the final step) and walPosition {salt1, salt2, mxFrame} read on the same connection right after, write it encrypted to the configured backup directory and record a BackupRecord; VACUUM INTO is not used because it renumbers pages and WAL frames could not be applied to its output.
- Archive WAL frames continuously as the only checkpointer of the relay database - connections run with PRAGMA wal_autocheckpoint=0, a read transaction is held between archive runs, every 5 min or when the WAL reaches 64 MiB the frames up to mxFrame are copied into an encrypted segment and fsynced, then the read transaction is released, wal_checkpoint(RESTART) runs and a new read transaction starts - and register a pre-checkpoint hook with F15.S02.M01 so the WAL is archived before the shutdown TRUNCATE.
- Encrypt every artifact with AES-256-GCM in 1 MiB chunks under a per-artifact key HKDF-SHA256(backupKey, salt = 32 random bytes stored in the manifest, info = "classrup-backup:v1:" + backupId), with a 96-bit chunk-counter nonce and AAD backupId ‖ chunkIndex ‖ finalFlag; the backup key comes from RELAY_BACKUP_KEY_FILE and is never stored in the repository or next to the artifacts.
- Authenticate every manifest with HMAC-SHA256 under a subkey derived from the backup key over its facts and the hash of the previous manifest, so relabelled, spliced or out-of-chain manifests are rejected by catalog import and restore planning.
- Keep a tombstone ledger - every tombstone the relay received, appended at each run to an encrypted ledger artifact retained for at least the maximum snapshot age plus 180 days (546 days) - that restore re-applies before serving traffic.
- Rotate retention to 8 six-hourly, 30 daily and 12 monthly full snapshots, 7 days of WAL segments and 546 days of ledger, deleting a completed or verified artifact only after a newer verified snapshot covers its tier and a failed record's artifact when its tier retention ends.
- Verify each snapshot right after writing it (key fingerprint, manifest MAC and chain, decrypt, checksum, PRAGMA integrity_check, foreign_key_check, row-count comparison) and provide the verification command used by quarterly restore drills.
- Emit platform.backup.completed and platform.backup.failed for operators and the observability module.
- Exclude encrypted MediaBlobs (encrypted true, the F08.S01.M03 attachment ciphertext) from every snapshot, WAL segment and archive - the backup set is schema main of the relay database, where the attachment rows and blob metadata (ref, size, encrypted, holders) live, while the ciphertext bytes live in the separate attached store blobs_enc of the F15.S02.M03 relay adapter, which this module never snapshots, archives or checkpoints - and record how many were left out.

## Not responsible for

- Restore tooling, runbook, RPO/RTO drills and dead-letter replay (F15.S03.M03 mod_recovery).
- Opening relay SQLite connections with wal_autocheckpoint=0 and keeping encrypted MediaBlob bytes in the separate attached store blobs_enc (F15.S02.M03 relay adapter options this module requires) and the shutdown sequence (F15.S02.M01 runs the registered pre-checkpoint hook).
- Attachment slots, rows and their expiry after a restore (F08.S01.M03, whose reconciliation sweep marks rows without ciphertext as expired).
- Tombstone verification and the tombstone records themselves (F11.S01.M02 registers a TombstoneSourcePort with the relay process; no depends_on edge).
- The user's vault export and its 30-day reminder (F10.S01.M03 and F15.S01.M01); this module never reads vaults.
- Backup of the relay identity key file and the backup key; the operator stores them separately.
- Offsite transport beyond a mounted filesystem path. Future: native S3-compatible and SFTP targets; Future: incremental block-level snapshots.

## User stories

- As a relay operator, I get an encrypted verified backup every 6 hours and WAL segments every 5 minutes without stopping the relay, and an alert if one fails or none succeeded in 7 hours.
- As a relay operator, I can run a verification that restores the latest backup into a temporary directory and proves it opens and passes integrity checks.
- As a relay operator, I know that someone with write access to my backup directory cannot pass off an older backup as the latest or splice artifacts together.
- As a member who selected this relay, I know that losing it never loses my private records, because those are in my own vault export, and that restoring it never brings back a listing I deleted.
- As a member who deleted a photo attachment, I know this relay's backups never held its ciphertext, so a restore cannot bring it back.

## Edge cases

- The backup directory is full or free space is below 2 times the database size; the run fails fast with PLATFORM_BACKUP_NO_SPACE, emits platform.backup.failed and leaves earlier backups untouched.
- The relay is writing heavily during a snapshot; backup() runs in steps of 100 pages on the writer connection with 5 ms pauses, writes made through that connection between steps are copied too, so writers are never blocked for more than 50 ms and the snapshot is consistent as of the completion of its final step (consistentAt), not of its start.
- Something other than the archiver checkpoints the WAL (an operator running the sqlite3 CLI, a misconfigured connection); the archiver sees new salts without a checkpoint it recorded, marks the segment gap, and requests a full snapshot at most once per 30 min, so recovery falls back to the last snapshot (RPO bound 6 h) until it is taken.
- The WAL reaches 64 MiB between two 5-minute runs under load; an archive run and checkpoint are forced at once, so the WAL never resets past unarchived frames.
- SIGTERM arrives; F15.S02.M01 runs this module's pre-checkpoint hook, which archives the frames up to mxFrame before the TRUNCATE; if the hook fails, the TRUNCATE is skipped and the next start archives the WAL first.
- The backup key is wrong or missing at verification time; the fingerprint check fails with PLATFORM_BACKUP_DECRYPT_FAILED, the record stays completed and unverified with that errorCode, the artifact is untouched and an alert fires.
- Two backup runs overlap (manual run during the schedule); the second is refused with CONFLICT_STATE.
- A backup artifact is truncated, modified or has a chunk spliced in from another artifact; checksum or chunk authentication fails with the correct key, the record becomes failed and an extra snapshot is taken.
- An older authentic artifact and manifest are copied or renamed to look like the latest; the manifest chain does not link, catalog import and restore planning reject it with PLATFORM_BACKUP_MANIFEST_INVALID.
- Clock jumps backward; scheduling uses a monotonic timer for intervals and stamps records with wall time only for labeling.
- The storage adapter is misconfigured and encrypted MediaBlob bytes sit in schema main; the run refuses with PLATFORM_BACKUP_CONFIG_INVALID before writing anything, because a snapshot or WAL segment would otherwise copy attachment ciphertext.

## UX and accessibility



Headless operator service with CLI: relay backup run, relay backup list, relay backup verify <id|latest> [--drill], relay backup prune --dry-run, relay backup import-catalog <dir>. Backup status appears in the operator status query and metrics; the PWA shows only relay reachability, never relay backup data.

## Owned data

- `BackupRecord` (classrup.platform.backup_record/v1, P1, RET-AUDIT)

## Interfaces

- Commands: `platform.backup.run`, `platform.backup.verify`
- Queries: `platform.backup.list`, `platform.backup.get_status`
- Emits: `platform.backup.completed`, `platform.backup.failed`
- Consumes: none

## Dependencies

F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-120-01 | [Domain schema](domain_schema.md) | 5 |
| PS-120-02 | [Validation rules](validation_rules.md) | 5 |
| PS-120-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-120-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-120-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-120-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-120-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-120-08 | [Observability and performance](observability_performance.md) | 4 |
| PS-120-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-120-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/relay/src/ops/backups/index.ts`.

## Acceptance criteria

- All tests T01-T26 pass in CI and a restore drill is performed at least every 100 days.
- A verified encrypted snapshot exists at least every 6 hours or an alert fires within 7 hours, and WAL archiving keeps the typical data-loss window at 5 minutes with zero gaps under the reference load.
- No backup artifact contains plaintext private data, key material or encrypted attachment MediaBlobs, and no spliced or relabelled artifact or manifest is accepted.
- A restored relay reproduces the database content hash of the snapshot and re-applies every ledger tombstone, whatever the age of the snapshot.
