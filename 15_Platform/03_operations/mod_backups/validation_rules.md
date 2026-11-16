# PS-120-02 — Validation rules: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-02.R01** Backup configuration is validated at startup, and a run refuses to start when preconditions fail.
- **PS-120-02.R02** Verification checks every integrity property before a snapshot may be marked verified.
- **PS-120-02.R03** Every violation maps to one stable error code with a messageKey for the operator tool.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | RELAY_BACKUP_DIR set, writable, not inside RELAY_DATA_DIR, and RELAY_BACKUP_KEY_FILE holds 32 bytes of base64 | PLATFORM_BACKUP_CONFIG_INVALID |
| V02 | free space in backup dir ≥ 2 x current database size | PLATFORM_BACKUP_NO_SPACE |
| V03 | no other backup run is in status running | CONFLICT_STATE |
| V04 | artifact SHA-256 equals the recorded sha256 and every GCM chunk authenticates | PLATFORM_BACKUP_DECRYPT_FAILED |
| V05 | PRAGMA integrity_check returns ok and PRAGMA foreign_key_check returns no rows | PLATFORM_BACKUP_VERIFY_FAILED |
| V06 | row counts of platform_backup_record, outbox and relay identity tables match the manifest | PLATFORM_BACKUP_VERIFY_FAILED |
| V07 | WAL segment frame range continues the previous segment (salt and frame numbers) | PLATFORM_BACKUP_WAL_GAP |
| V08 | manual run rate: at most 1 per 10 minutes | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T02 | unit | PS-120-02.R01, PS-120-02.R02, PS-120-02.R03 | each rule V01-V08 violated in turn | documented error code returned, previous backups untouched |
| TEST-PS-120-09.T09 | chaos | PS-120-06.R03, PS-120-02.R01 | backup dir full, then unmounted, then key wrong | PLATFORM_BACKUP_NO_SPACE, PLATFORM_BACKUP_CONFIG_INVALID, PLATFORM_BACKUP_DECRYPT_FAILED; failed events emitted; alert metric increases |
| TEST-PS-120-09.T11 | integration | PS-120-07.R03, PS-120-02.R03 | tombstone recorded after snapshot, restore | tombstone re-applied from outbox archive before serving |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
