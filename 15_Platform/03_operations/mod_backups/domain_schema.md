# PS-120-01 — Domain schema: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-01.R01** A BackupRecord stores kind (full or wal), tier, timing, size, checksums, schema version and encryption parameters but never key material.
- **PS-120-01.R02** A manifest JSON file next to every artifact holds the same facts so that restore works without a readable database.
- **PS-120-01.R03** Records are relay-local operational data (P1) retained under RET-AUDIT rules for 1 year, longer than the artifacts they describe.

## Specification

### BackupRecord

Schema `classrup.platform.backup_record/v1` · storage **relay** · privacy **P1** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| kind | enum — full \| wal \| outbox_archive |
| tier | enum — six_hourly \| daily \| monthly \| wal \| archive |
| status | enum — running \| completed \| verified \| failed \| expired |
| startedAt | timestamp — RFC 3339 UTC |
| finishedAt? | timestamp — RFC 3339 UTC |
| sizeBytes? | int — encrypted artifact size |
| sha256? | string — hex SHA-256 of the encrypted artifact |
| plainSha256? | string — hex SHA-256 of the plaintext database snapshot (full only) |
| schemaVersion | string — migration id of the database at snapshot time |
| eventWatermark? | string — eventId of the newest outbox row included |
| walFrames? | json — { from, to, salt1, salt2 } for kind wal |
| keyFingerprint | string — first 16 hex of SHA-256 of the backup key; never the key |
| artifactPath | string — relative path under RELAY_BACKUP_DIR |
| verifiedAt? | timestamp — set when restore verification passed |
| drillAt? | timestamp — set when a quarterly restore drill used this snapshot |
| errorCode? | string — stable code when failed |
| expiresAt | timestamp — end of the tier retention |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- verified implies verifiedAt is set and integrity_check returned ok.
- A full snapshot is never deleted while it is the newest verified snapshot or required as the base of retained WAL segments.
- keyFingerprint is present on every record and the key itself is never stored in records, manifests, logs or events.

### Storage DDL

```sql
CREATE TABLE platform_backup_record (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, tier TEXT NOT NULL, status TEXT NOT NULL,
  started_at TEXT NOT NULL, finished_at TEXT, size_bytes INTEGER, sha256 TEXT,
  schema_version TEXT NOT NULL, artifact_path TEXT NOT NULL, verified_at TEXT,
  expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX platform_backup_status ON platform_backup_record(status, started_at);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T01 | integration | PS-120-01.R01, PS-120-01.R02, PS-120-01.R03 | run a full backup and read record plus manifest | record and manifest agree, contain keyFingerprint and no key bytes |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001. Predecessor: [module SPEC](SPEC.md).
