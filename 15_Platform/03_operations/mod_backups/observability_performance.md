# PS-120-08 — Observability and performance: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-08.R01** Backup health is exposed as metrics and events per CTR-OBS-001 with alerting thresholds that map to the RPO of 6 h and the typical data loss of 5 min.
- **PS-120-08.R02** Backups must not degrade relay latency beyond the OBS-4 budget while running.
- **PS-120-08.R03** Verification time and restore time are measured so that the RTO of 4 h is evidenced by drills.
- **PS-120-08.R04** WAL gaps are an anomaly that must stay at zero under the reference load, and WAL size and archive lag are observable.

## Specification

**Metrics**
- classrup_platform_backup_total{outcome=completed|failed|verified}
- classrup_platform_backup_last_verified_age_seconds (alert at 25200)
- classrup_platform_backup_duration_ms{kind=full|wal|tombstone_ledger}
- classrup_platform_backup_wal_lag_ms (alert at 900000)
- classrup_platform_backup_wal_bytes (alert at 67108864 when the forced archive did not shrink it)
- classrup_platform_backup_wal_gaps_total (alert when it increases)
- classrup_platform_backup_bytes (encrypted bytes on disk)
- classrup_platform_backup_last_restore_drill_age_days (alert at 100)

**Logs**
- info backup.completed {backupId, kind, sizeBytes, durationMs}; error backup.failed {backupId, errorCode}; warn backup.wal_gap {backupId}; never key material, paths outside RELAY_BACKUP_DIR or database content.

**Budgets**
- Full snapshot of a 1 GiB database ≤ 120 s; write latency p95 during backup ≤ 300 ms at 50 req/s (OBS-4).
- Verification of a 1 GiB snapshot ≤ 180 s; WAL archive run ≤ 2 s; checkpoint after archive ≤ 500 ms.
- RPO: worst-case data loss ≤ 21600000 ms (6 h); typical ≤ 300000 ms (5 min) with WAL segments, with zero gaps under 50 req/s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T08 | integration | PS-120-06.R02, PS-120-08.R02 | 50 req/s write load while a 1 GiB snapshot runs | writer stall ≤ 50 ms, write p95 ≤ 300 ms |
| TEST-PS-120-09.T13 | integration | PS-120-08.R01, PS-120-08.R02 | scrape metrics after success and failure | metrics per CTR-OBS-001 present, alert thresholds fire on simulated 8 h without verified backup |
| TEST-PS-120-09.T14 | load | PS-120-08.R03, PS-120-08.R02 | 1 GiB database snapshot and verify | snapshot ≤ 120 s, verify ≤ 180 s |
| TEST-PS-120-09.T18 | manual | PS-120-06.R03, PS-120-08.R03 | quarterly restore drill by the operator on a clean machine | drill recorded with drillAt, elapsed time below 4 h, checklist signed off |
| TEST-PS-120-09.T19 | load | PS-120-08.R04, PS-120-08.R01 | 1 h at 50 req/s with 5-minute archive runs, then a burst that grows the WAL past 64 MiB | zero WAL gaps; forced archive and checkpoint at 64 MiB; typical data loss window ≤ 5 min |
| TEST-PS-120-09.T25 | integration | PS-120-06.R03, PS-120-08.R04 | SIGTERM with 900 unarchived frames; then an external sqlite3 checkpoint twice within 30 min | shutdown hook archives the 900 frames before TRUNCATE; first external checkpoint marks a gap and triggers one full snapshot; second gap within 30 min triggers no further snapshot |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
