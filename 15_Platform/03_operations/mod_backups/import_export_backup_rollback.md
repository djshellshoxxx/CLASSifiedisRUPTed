# PS-120-10 — Import, export, backup and rollback: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-10.R01** The operator export is the list of BackupRecords and manifests, not user data; user exports are produced by vaults (CTR-IOX-001 IOX-6) and never by this module.
- **PS-120-10.R02** A snapshot restores only into a new relay instance (IOX-4) and the identity key file must be provided separately, otherwise the instance has a different identity.
- **PS-120-10.R03** Backup schema changes follow expand/contract and manifests stay readable for at least 400 days.

## Specification

- **export:** JSON Lines of BackupRecord (schema classrup.platform.backup_record/v1) via relay backup list --json; manifests are standalone JSON files next to artifacts.
- **import:** relay backup import-catalog <dir> rebuilds BackupRecords from manifests after a restore; artifacts are never decrypted by the import.
- **backup:** This module is the relay backup. The backup key and relay identity key file are backed up by the operator separately and never inside backup artifacts. Vault export remains the primary backup of private records.
- **migration rollback:** Manifest format carries formatVersion 1; unknown future versions are skipped with a warning. Rolling back the relay release leaves artifacts untouched; restore always creates a new instance and never downgrades data in place.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T16 | integration | PS-120-09.R02, PS-120-09.R03, PS-120-10.R03 | restore drill of the 100 000-row database to a fresh directory plus WAL segments | content hashes equal, integrity ok, procedure time recorded |
| TEST-PS-120-09.T17 | integration | PS-120-10.R01, PS-120-10.R02 | export manifest list and check that vault data is absent; attempt to restore on a different relay key | manifests list only relay data; restore without the identity key file refused |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
