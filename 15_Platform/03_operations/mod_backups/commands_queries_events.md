# PS-120-04 — Commands, queries and events: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-04.R01** The module exposes relay commands for an on-demand run and a verification, and queries for listing and status, all for the relay_operator or admin role of the relay hosting them.
- **PS-120-04.R02** Scheduled runs use the same code path as the manual run command and emit the same events.
- **PS-120-04.R03** platform.backup.completed and platform.backup.failed are emitted in the same transaction as the BackupRecord status change.
- **PS-120-04.R04** The platform.backup.completed payload carries consistentAt and walPosition so the restore point is known; WAL segments and ledger appends emit no event, and F15.S03.M03 builds its recovery plan from BackupRecords and authenticated manifests rather than from events.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `platform.backup.run` | platform.backup.run | { kind?: full (default) } — relay command, relay_operator or admin | { backupId, status: running } | FORBIDDEN, CONFLICT_STATE, RATE_LIMITED, PLATFORM_BACKUP_CONFIG_INVALID, PLATFORM_BACKUP_NO_SPACE | platform.backup.failed | no |
| `platform.backup.verify` | platform.backup.verify | { backupId \| 'latest', drill?: boolean } — relay command, relay_operator or admin; restores into a temporary directory and checks V04-V06, V09, V10, V13 | { backupId, status, checks: { keyFingerprint, manifest, checksum, decrypt, integrity, foreignKeys, rowCounts, noEncryptedBlobs }, excludedBlobs?, durationMs } | FORBIDDEN, NOT_FOUND, PLATFORM_BACKUP_DECRYPT_FAILED, PLATFORM_BACKUP_VERIFY_FAILED, PLATFORM_BACKUP_MANIFEST_INVALID | platform.backup.completed, platform.backup.failed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `platform.backup.list` | platform.backup.read | { status?, kind?, cursor?, limit ≤ 100 } — relay query, relay_operator or admin | { items: BackupRecord[], nextCursor? } | FORBIDDEN |
| `platform.backup.get_status` | platform.backup.read | { } (no input) — relay query, relay_operator or admin | { lastVerifiedAt?, lastDrillAt?, rpoEstimateMs, rpoTargetMs: 21600000, walLagMs, walBytes, walGaps24h, bytesUsed, nextRunAt } | FORBIDDEN |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `platform.backup.completed` | P1 | { backupId, kind, tier, sizeBytes, finishedAt, consistentAt?, walPosition?: { salt1, salt2, mxFrame }, schemaVersion, eventWatermark?, excludedBlobs? } |
| `platform.backup.failed` | P1 | { backupId, kind, errorCode, failedAt } |

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_BACKUP_CONFIG_INVALID | 500 | no | backup directory or key file missing or invalid |
| PLATFORM_BACKUP_NO_SPACE | 507 | no | free space below 2 times the database size |
| PLATFORM_BACKUP_DECRYPT_FAILED | 422 | no | the supplied backup key is wrong or missing (fingerprint mismatch); the artifact is untouched |
| PLATFORM_BACKUP_VERIFY_FAILED | 422 | no | checksum, chunk authentication, integrity, foreign key or row-count check failed with the correct key |
| PLATFORM_BACKUP_WAL_GAP | 409 | no | WAL segment sequence has a gap; recovery falls back to the last snapshot |
| PLATFORM_BACKUP_MANIFEST_INVALID | 422 | no | manifest MAC does not verify or the manifest does not link into the chain; it is not trusted for import or restore |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
$ relay backup run
POST /api/v1/cmd/platform.backup.run  { "kind": "full" }   (signed request by a relay_operator key)
202 { "backupId": "0192f500-0000-7000-8000-000000000001", "status": "running" }
... backup() steps on the writer connection complete at 06:17:40.910Z; walPosition read; verification passes ...
event platform.backup.completed { "backupId": "0192f500-…", "kind": "full", "tier": "six_hourly", "sizeBytes": 18734592,
  "finishedAt": "2026-11-04T06:17:41.220Z", "consistentAt": "2026-11-04T06:17:40.910Z",
  "walPosition": { "salt1": 2894121, "salt2": 991, "mxFrame": 4410 }, "schemaVersion": "0007" }
artifact: backups/2026/11/04/full-20261104T061700Z.sqlite.enc  + full-20261104T061700Z.manifest.json { ..., "salt": "…", "prevManifestHash": "…", "manifestMac": "…" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T05 | contract | PS-120-04.R01, PS-120-04.R03 | run and verify commands | outputs and platform.backup.completed/failed payloads validate against the registry; event written in the same transaction as the status change |
| TEST-PS-120-09.T06 | integration | PS-120-04.R02, PS-120-06.R03 | scheduled and manual runs overlap | second refused with CONFLICT_STATE; scheduled run uses the same code path and events |
| TEST-PS-120-09.T20 | integration | PS-120-01.R04, PS-120-04.R04 | full snapshot under write load, then WAL segments; restore snapshot plus frames after walPosition; inspect the platform.backup.completed payload | restored content equals the live database at the target; consistentAt equals completion of the final step; page numbers identical to the source (no VACUUM INTO); payload carries consistentAt and walPosition and no event exists for WAL segments |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
