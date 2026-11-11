# PS-120-01 — Domain schema: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-01.R01** A BackupRecord stores kind (full, wal, outbox_archive or tombstone_ledger), tier, timing, consistency point, WAL position or frame range, size, checksums, schema version, encryption parameters (salt, key fingerprint) and the manifest chain hash, but never key material.
- **PS-120-01.R02** A manifest JSON file next to every artifact holds the same facts so that restore works without a readable database, authenticated by an HMAC under a key derived from the backup key and chained to the previous manifest, so relabelled or out-of-chain manifests are refused.
- **PS-120-01.R03** Records are relay-local operational data (P1) retained under RET-AUDIT rules for 1 year, longer than the artifacts they describe, except tombstone ledger records which live as long as their 546-day artifacts.
- **PS-120-01.R04** A full BackupRecord records consistentAt and walPosition {salt1, salt2, mxFrame} at the true consistency point of the snapshot, and a WAL record the salts and frame range it covers, so the restore point and the data-loss window can be computed from records and manifests alone.

## Specification

### BackupRecord

Schema `classrup.platform.backup_record/v1` · storage **relay** · privacy **P1** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key (backupId) |
| kind | enum — full \| wal \| outbox_archive \| tombstone_ledger |
| tier | enum — six_hourly \| daily \| monthly \| wal \| archive \| ledger |
| status | enum — running \| completed \| verified \| failed \| expired |
| startedAt | timestamp — RFC 3339 UTC |
| finishedAt? | timestamp — RFC 3339 UTC |
| consistentAt? | timestamp — full only: completion of the final backup() step, the point the snapshot reflects |
| walPosition? | json — full only: { salt1, salt2, mxFrame } read on the writer connection right after the final step |
| walFrames? | json — wal only: { salt1, salt2, fromFrame, toFrame, checkpointedAfter: boolean, gap: boolean } |
| ledgerRange? | json — tombstone_ledger only: { fromSeq, toSeq, count } |
| sizeBytes? | int — encrypted artifact size |
| sha256? | string — hex SHA-256 of the encrypted artifact |
| plainSha256? | string — hex SHA-256 of the plaintext database snapshot (full only) |
| schemaVersion | string — migration id of the database at snapshot time |
| eventWatermark? | string — eventId of the newest outbox row included |
| salt | string — base64url of the 32 random bytes used to derive this artifact's key |
| keyFingerprint | string — first 16 hex of SHA-256 of the backup key; never the key |
| prevManifestHash? | string — hex SHA-256 of the previous manifest in this relay's chain |
| manifestMac | string — HMAC-SHA256 under HKDF(backupKey, info 'classrup-backup-manifest:v1') over the JCS manifest without this field |
| artifactPath | string — relative path under RELAY_BACKUP_DIR |
| verifiedAt? | timestamp — set when restore verification passed |
| drillAt? | timestamp — set when a quarterly restore drill used this snapshot |
| errorCode? | string — stable code when failed, or PLATFORM_BACKUP_DECRYPT_FAILED on a completed record verified with a wrong or missing key |
| expiresAt | timestamp — end of the tier retention |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- verified implies verifiedAt is set and integrity_check returned ok.
- A full snapshot is never deleted while it is the newest verified snapshot or required as the base of retained WAL segments.
- keyFingerprint is present on every record and the key itself is never stored in records, manifests, logs or events.
- No two artifacts share a derived key, because every artifact has its own random salt and backupId, so a (key, nonce) pair is never reused.
- Every manifest except the first carries prevManifestHash of the previous manifest, and its MAC verifies.

### Storage DDL

```sql
CREATE TABLE platform_backup_record (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, tier TEXT NOT NULL, status TEXT NOT NULL,
  started_at TEXT NOT NULL, finished_at TEXT, consistent_at TEXT, size_bytes INTEGER, sha256 TEXT,
  schema_version TEXT NOT NULL, artifact_path TEXT NOT NULL, verified_at TEXT,
  expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX platform_backup_status ON platform_backup_record(status, started_at);
CREATE INDEX platform_backup_kind ON platform_backup_record(kind, started_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T01 | integration | PS-120-01.R01, PS-120-01.R02, PS-120-01.R03 | run a full backup and read record plus manifest | record and manifest agree, contain keyFingerprint, salt, MAC and chain hash and no key bytes |
| TEST-PS-120-09.T20 | integration | PS-120-01.R04, PS-120-04.R04 | full snapshot under write load, then WAL segments; restore snapshot plus frames after walPosition; inspect the platform.backup.completed payload | restored content equals the live database at the target; consistentAt equals completion of the final step; page numbers identical to the source (no VACUUM INTO); payload carries consistentAt and walPosition and no event exists for WAL segments |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
