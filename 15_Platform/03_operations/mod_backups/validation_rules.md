# PS-120-02 — Validation rules: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-02.R01** Backup configuration is validated at startup, and a run refuses to start when preconditions fail.
- **PS-120-02.R02** Verification checks every integrity property before a snapshot may be marked verified.
- **PS-120-02.R03** Every violation maps to one stable error code with a messageKey for the operator tool.
- **PS-120-02.R04** Manifests and artifacts are accepted for verification, catalog import and restore planning only when their MAC verifies and they link into the chain.
- **PS-120-02.R05** A run refuses to start when encrypted MediaBlob bytes would be inside the backed-up database, and verification fails when a snapshot contains any.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | RELAY_BACKUP_DIR set, writable, not inside RELAY_DATA_DIR, and RELAY_BACKUP_KEY_FILE holds 32 bytes of base64 | PLATFORM_BACKUP_CONFIG_INVALID |
| V02 | free space in backup dir ≥ 2 x current database size | PLATFORM_BACKUP_NO_SPACE |
| V03 | no other backup run is in status running | CONFLICT_STATE |
| V04 | the supplied backup key's fingerprint equals the record's keyFingerprint | PLATFORM_BACKUP_DECRYPT_FAILED |
| V05 | PRAGMA integrity_check returns ok and PRAGMA foreign_key_check returns no rows | PLATFORM_BACKUP_VERIFY_FAILED |
| V06 | row counts of platform_backup_record, outbox and relay identity tables match the manifest | PLATFORM_BACKUP_VERIFY_FAILED |
| V07 | a WAL segment continues the previous one (same salts and fromFrame = previous toFrame + 1), or starts at frame 1 with new salts after a checkpoint the previous segment recorded as checkpointedAfter | PLATFORM_BACKUP_WAL_GAP |
| V08 | manual run rate: at most 1 per 10 minutes | RATE_LIMITED |
| V09 | artifact SHA-256 equals the recorded sha256 and every chunk authenticates under the per-artifact key with nonce = chunk index and AAD backupId ‖ chunkIndex ‖ finalFlag, with finalFlag set on the last chunk only | PLATFORM_BACKUP_VERIFY_FAILED |
| V10 | manifest MAC verifies under the manifest subkey and prevManifestHash equals SHA-256 of the previous manifest of this relay's chain | PLATFORM_BACKUP_MANIFEST_INVALID |
| V11 | a gap-triggered full snapshot starts only if none started in the last 1800000 ms (30 min) | RATE_LIMITED |
| V12 | the snapshot source is schema main, the archiver reads only the main database WAL, and no row of main.blobs with encrypted = 1 holds ciphertext bytes (the F15.S02.M03 relay adapter keeps them in the attached store blobs_enc) | PLATFORM_BACKUP_CONFIG_INVALID |
| V13 | the verification copy contains no ciphertext of an encrypted MediaBlob: every main.blobs row with encrypted = 1 has zero-length bytes and no blobs_enc schema is present | PLATFORM_BACKUP_VERIFY_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T02 | unit | PS-120-02.R01, PS-120-02.R02, PS-120-02.R03 | each rule V01-V11 violated in turn | documented error code returned, previous backups untouched |
| TEST-PS-120-09.T09 | chaos | PS-120-06.R03, PS-120-02.R01 | backup dir full, then unmounted, then verification with the wrong key | PLATFORM_BACKUP_NO_SPACE and PLATFORM_BACKUP_CONFIG_INVALID with failed events; wrong key leaves the record completed with errorCode PLATFORM_BACKUP_DECRYPT_FAILED and the alert metric increases |
| TEST-PS-120-09.T11 | integration | PS-120-07.R03, PS-120-02.R03 | tombstone recorded after the snapshot, restore of the latest snapshot | tombstone re-applied from the ledger before serving |
| TEST-PS-120-09.T21 | abuse | PS-120-07.R04, PS-120-02.R02 | splice chunk 3 of artifact A into artifact B, reorder two chunks of B, drop B's final chunk; derive keys for 1 000 artifacts | each splice fails chunk authentication; no (key, nonce) pair repeats across the 1 000 artifacts |
| TEST-PS-120-09.T22 | abuse | PS-120-02.R04, PS-120-07.R04 | copy an older authentic artifact and manifest under the latest name; delete a manifest from the middle of the chain; forge a manifest without the backup key; run import-catalog and the F15.S03.M03 plan | all rejected with PLATFORM_BACKUP_MANIFEST_INVALID; the catalog keeps the authenticated chain head |
| TEST-PS-120-09.T26 | abuse | PS-120-01.R05, PS-120-02.R05, PS-120-07.R05 | full snapshot and 10 min of WAL segments while attachments are uploaded and one is deleted; restore; scan every artifact for the canary; then a run with an adapter that keeps encrypted bytes in main, and verify of a planted snapshot holding ciphertext | P0 blobs, attachment rows and blob metadata restored; no canary in any artifact; excludedBlobs 3 in the record and event; the misconfigured run refused with PLATFORM_BACKUP_CONFIG_INVALID; the planted snapshot fails with PLATFORM_BACKUP_VERIFY_FAILED |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
