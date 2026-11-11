# PS-120-06 — Failure recovery and idempotency: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-06.R01** A scheduled run that crashes leaves no partial artifact visible and is retried at the next slot; a manual rerun after failure starts a new record.
- **PS-120-06.R02** Backups never block relay writes beyond 50 ms and never run concurrently with each other.
- **PS-120-06.R03** A missing or failing backup is loud, with failure events, an alert after 7 h without a verified snapshot, and an extra snapshot after any integrity failure.

## Specification

- **idempotency:** Artifacts are written to a .partial name and renamed only after fsync, so a rerun never exposes partial data. The run command is not idempotent by design (it creates a new snapshot), but a second call while one is running returns CONFLICT_STATE with the running backupId. Verification is idempotent and read-only except for verifiedAt and errorCode. A WAL archive run that crashes before fsync is repeated from the last recorded toFrame because no checkpoint ran.
- **concurrency:** A single-flight lock row (local to this relay, IDM-8) allows one running backup. The archiver holds its own read transaction between runs, and because relay connections run with wal_autocheckpoint=0 and only the archiver checkpoints, the WAL never resets past unarchived frames; the archiver releases its read transaction only for its own wal_checkpoint(RESTART) after fsync. Snapshot steps of 100 pages run on the writer connection with 5 ms pauses, so writes through that connection are copied and never stall more than 50 ms.
- **retries:** A failed snapshot is retried once after 5 minutes, then at the next 6 h slot; failure events fire on each failure. IO errors use IDM-4 backoff (base 500 ms, cap 30 s, 6 attempts) inside a run. A failed checkpoint after a successful archive is retried at the next run; frames are never lost because the read transaction is reacquired first.
- **offline:** Backups need no network; a missing mount of the backup directory fails the run with PLATFORM_BACKUP_CONFIG_INVALID. The relay continues serving while backups fail, and the alert makes the operator act. While the backup directory is missing the archiver keeps its read transaction and skips checkpoints, so the WAL grows instead of losing frames, and the WAL-size alert fires.
- **partial failure:** If the manifest rename fails after the artifact is written, the artifact is deleted and the run is failed. If rotation deletes fail midway, records keep their status and the next rotation retries; a completed or verified artifact is never deleted unless a newer verified snapshot exists. If the shutdown hook cannot archive, F15.S02.M01 skips TRUNCATE and the next start archives first.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T04 | integration | PS-120-03.R01, PS-120-06.R01 | kill the process during a snapshot and during a WAL archive run | no visible partial artifact, next run succeeds, record is failed or absent, WAL archive resumes from the last toFrame |
| TEST-PS-120-09.T06 | integration | PS-120-04.R02, PS-120-06.R03 | scheduled and manual runs overlap | second refused with CONFLICT_STATE; scheduled run uses the same code path and events |
| TEST-PS-120-09.T08 | integration | PS-120-06.R02, PS-120-08.R02 | 50 req/s write load while a 1 GiB snapshot runs | writer stall ≤ 50 ms, write p95 ≤ 300 ms |
| TEST-PS-120-09.T09 | chaos | PS-120-06.R03, PS-120-02.R01 | backup dir full, then unmounted, then verification with the wrong key | PLATFORM_BACKUP_NO_SPACE and PLATFORM_BACKUP_CONFIG_INVALID with failed events; wrong key leaves the record completed with errorCode PLATFORM_BACKUP_DECRYPT_FAILED and the alert metric increases |
| TEST-PS-120-09.T18 | manual | PS-120-06.R03, PS-120-08.R03 | quarterly restore drill by the operator on a clean machine | drill recorded with drillAt, elapsed time below 4 h, checklist signed off |
| TEST-PS-120-09.T25 | integration | PS-120-06.R03, PS-120-08.R04 | SIGTERM with 900 unarchived frames; then an external sqlite3 checkpoint twice within 30 min | shutdown hook archives the 900 frames before TRUNCATE; first external checkpoint marks a gap and triggers one full snapshot; second gap within 30 min triggers no further snapshot |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
