# PS-120-07 — Privacy, retention and abuse: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-07.R01** Backups contain only data the relay holds (signed public projections, ciphertext envelopes, P0 media, operational records) and are encrypted at rest with AES-256-GCM under per-artifact keys; plaintext P2 or higher and vault keys never exist on the relay and so never in backups.
- **PS-120-07.R02** Retention is 8 six-hourly, 30 daily, 12 monthly snapshots, 7 days of WAL segments and 546 days of tombstone ledger, and expired artifacts, including those of failed records, are deleted from disk.
- **PS-120-07.R03** Signed tombstones (CTR-PRV-001 PRV-6, CTR-FED-001 FED-4) survive restore - every tombstone the relay received is in the ledger, kept at least the maximum snapshot age plus 180 days and written by every run, and restore re-applies the newest ledger in its replaying phase - so restoring any retained snapshot, including a 12-month-old monthly one, never resurrects deleted public content.
- **PS-120-07.R04** Nonces never repeat under one key, chunks cannot be moved between artifacts, and manifests are authenticated and chained, so someone with write access to the backup directory cannot splice artifacts or relabel an older authentic backup as the latest.

## Specification

**Data classification**
- Full snapshots and WAL segments: relay database content (public projections P0, P0 media, ciphertext envelopes, relay operational data P1).
- Tombstone ledger: P0 tombstone cids, target cids and receipt times.
- Manifests: P1 metadata with salt, MAC and chain hash, without keys.

**Retention**
- six_hourly 48 h (8 snapshots); daily 30 copies; monthly 12 copies; WAL segments 7 days; tombstone ledger 546 days (366 days maximum snapshot age plus 180 days); BackupRecord rows 1 year (RET-AUDIT), ledger records as long as their artifacts.
- Tombstoned public projections remain in older snapshots until those expire; restore re-applies the ledger before the relay serves traffic.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Backup theft exposes relay data | AES-256-GCM per 1 MiB chunk under a per-artifact HKDF key, backup key never stored with artifacts, relay holds no plaintext private data to begin with |
| T02 | Backup tampering, substitution or chunk splicing | per-artifact key with random salt and backupId in info, 96-bit chunk-counter nonce, AAD backupId ‖ chunkIndex ‖ finalFlag, per-artifact SHA-256 in the authenticated manifest, weekly re-verification |
| T03 | Key loss makes backups unreadable | key fingerprint recorded, quarterly drill proves the operator can decrypt, runbook requires two offline copies of the key held by different people |
| T04 | Resurrection of deleted public data after restore of an old snapshot | tombstone ledger retained 546 days and re-applied before serving; deletion statements are signed and replayed |
| T05 | Backup job used to exhaust disk | free-space precheck (2 x database size), retention rotation, max one run at a time, manual runs limited to 1 per 10 minutes, gap snapshots at most every 30 min |
| T06 | Rollback attack: an older authentic artifact and manifest relabelled as the latest | MAC over backupId, startedAt, eventWatermark, walPosition and prevManifestHash; catalog import and restore plan accept only the authenticated chain |
| T07 | Silent RPO loss through WAL resets | archiver is the only checkpointer, autocheckpoint off, forced archive at 64 MiB, archive before shutdown TRUNCATE, gap counter alert |

**Abuse controls**
- Operator-only capabilities with signed requests by relay_operator or admin keys; every run and verify is audit-logged by the bus (CTR-CAP-001 CAP-7).
- Manual run rate limit of 1 per 10 minutes, single-flight lock, gap-triggered snapshots at most every 30 min.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T10 | integration | PS-120-07.R02 | rotation over simulated 14 months including failed records | exactly 8 six-hourly, 30 daily, 12 monthly, WAL 7 days and ledger 546 days remain; expired artifacts, including those of failed records, deleted from disk |
| TEST-PS-120-09.T11 | integration | PS-120-07.R03, PS-120-02.R03 | tombstone recorded after the snapshot, restore of the latest snapshot | tombstone re-applied from the ledger before serving |
| TEST-PS-120-09.T12 | abuse | PS-120-07.R01, PS-120-07.R02 | flip one byte in an artifact and truncate another (correct key) | checksum and chunk authentication fail with PLATFORM_BACKUP_VERIFY_FAILED, record failed, extra snapshot scheduled |
| TEST-PS-120-09.T21 | abuse | PS-120-07.R04, PS-120-02.R02 | splice chunk 3 of artifact A into artifact B, reorder two chunks of B, drop B's final chunk; derive keys for 1 000 artifacts | each splice fails chunk authentication; no (key, nonce) pair repeats across the 1 000 artifacts |
| TEST-PS-120-09.T22 | abuse | PS-120-02.R04, PS-120-07.R04 | copy an older authentic artifact and manifest under the latest name; delete a manifest from the middle of the chain; forge a manifest without the backup key; run import-catalog and the F15.S03.M03 plan | all rejected with PLATFORM_BACKUP_MANIFEST_INVALID; the catalog keeps the authenticated chain head |
| TEST-PS-120-09.T23 | integration | PS-120-07.R03 | restore the 6-month-old monthly snapshot after 40 tombstones were applied since then | every tombstoned projection stays deleted after restore; ledger applied before readyz returns 200 |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
