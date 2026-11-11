# PS-120-09 — Contract and acceptance tests: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-120-09.R02** Encryption, rotation and verification are tested with real node:sqlite databases and the real backup API in CI.
- **PS-120-09.R03** A restore drill test restores a generated database with 100 000 rows and proves equality of content hashes.

## Specification

See the module test table below (all processes).

**Fixtures:** Temp relay data dir with a 100 000-row database opened with wal_autocheckpoint=0 and the attached store blobs_enc holding 3 encrypted attachment blobs with a canary byte pattern next to 2 P0 blobs in main, backup dir on a separate tmpfs, 32-byte test key and a second wrong key, tombstone fixtures over 14 months, fixed clock 2026-11-04T00:00:00Z advanced by the test.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T01 | integration | PS-120-01.R01, PS-120-01.R02, PS-120-01.R03 | run a full backup and read record plus manifest | record and manifest agree, contain keyFingerprint, salt, MAC and chain hash and no key bytes |
| TEST-PS-120-09.T02 | unit | PS-120-02.R01, PS-120-02.R02, PS-120-02.R03 | each rule V01-V11 violated in turn | documented error code returned, previous backups untouched |
| TEST-PS-120-09.T03 | property | PS-120-03.R01, PS-120-03.R02, PS-120-03.R03 | random sequences of run, verify with right and wrong key, tamper, expire | only declared transitions occur; newest verified snapshot never expires; expired is the only terminal state |
| TEST-PS-120-09.T04 | integration | PS-120-03.R01, PS-120-06.R01 | kill the process during a snapshot and during a WAL archive run | no visible partial artifact, next run succeeds, record is failed or absent, WAL archive resumes from the last toFrame |
| TEST-PS-120-09.T05 | contract | PS-120-04.R01, PS-120-04.R03 | run and verify commands | outputs and platform.backup.completed/failed payloads validate against the registry; event written in the same transaction as the status change |
| TEST-PS-120-09.T06 | integration | PS-120-04.R02, PS-120-06.R03 | scheduled and manual runs overlap | second refused with CONFLICT_STATE; scheduled run uses the same code path and events |
| TEST-PS-120-09.T07 | abuse | PS-120-05.R01, PS-120-05.R02, PS-120-05.R03 | member key, tenant-scoped operator key and expired relay_operator assignment call run, verify, list; artifact read without key | FORBIDDEN for all three; ciphertext does not decrypt without key; key never in API output |
| TEST-PS-120-09.T08 | integration | PS-120-06.R02, PS-120-08.R02 | 50 req/s write load while a 1 GiB snapshot runs | writer stall ≤ 50 ms, write p95 ≤ 300 ms |
| TEST-PS-120-09.T09 | chaos | PS-120-06.R03, PS-120-02.R01 | backup dir full, then unmounted, then verification with the wrong key | PLATFORM_BACKUP_NO_SPACE and PLATFORM_BACKUP_CONFIG_INVALID with failed events; wrong key leaves the record completed with errorCode PLATFORM_BACKUP_DECRYPT_FAILED and the alert metric increases |
| TEST-PS-120-09.T10 | integration | PS-120-07.R02 | rotation over simulated 14 months including failed records | exactly 8 six-hourly, 30 daily, 12 monthly, WAL 7 days and ledger 546 days remain; expired artifacts, including those of failed records, deleted from disk |
| TEST-PS-120-09.T11 | integration | PS-120-07.R03, PS-120-02.R03 | tombstone recorded after the snapshot, restore of the latest snapshot | tombstone re-applied from the ledger before serving |
| TEST-PS-120-09.T12 | abuse | PS-120-07.R01, PS-120-07.R02 | flip one byte in an artifact and truncate another (correct key) | checksum and chunk authentication fail with PLATFORM_BACKUP_VERIFY_FAILED, record failed, extra snapshot scheduled |
| TEST-PS-120-09.T13 | integration | PS-120-08.R01, PS-120-08.R02 | scrape metrics after success and failure | metrics per CTR-OBS-001 present, alert thresholds fire on simulated 8 h without verified backup |
| TEST-PS-120-09.T14 | load | PS-120-08.R03, PS-120-08.R02 | 1 GiB database snapshot and verify | snapshot ≤ 120 s, verify ≤ 180 s |
| TEST-PS-120-09.T15 | unit | PS-120-09.R01 | traceability tool run | every PS-120 requirement maps to a passing test |
| TEST-PS-120-09.T16 | integration | PS-120-09.R02, PS-120-09.R03, PS-120-10.R03 | restore drill of the 100 000-row database to a fresh directory plus WAL segments | content hashes equal, integrity ok, procedure time recorded |
| TEST-PS-120-09.T17 | integration | PS-120-10.R01, PS-120-10.R02 | export manifest list and check that vault data is absent; attempt to restore on a different relay key | manifests list only relay data; restore without the identity key file refused |
| TEST-PS-120-09.T18 | manual | PS-120-06.R03, PS-120-08.R03 | quarterly restore drill by the operator on a clean machine | drill recorded with drillAt, elapsed time below 4 h, checklist signed off |
| TEST-PS-120-09.T19 | load | PS-120-08.R04, PS-120-08.R01 | 1 h at 50 req/s with 5-minute archive runs, then a burst that grows the WAL past 64 MiB | zero WAL gaps; forced archive and checkpoint at 64 MiB; typical data loss window ≤ 5 min |
| TEST-PS-120-09.T20 | integration | PS-120-01.R04, PS-120-04.R04 | full snapshot under write load, then WAL segments; restore snapshot plus frames after walPosition; inspect the platform.backup.completed payload | restored content equals the live database at the target; consistentAt equals completion of the final step; page numbers identical to the source (no VACUUM INTO); payload carries consistentAt and walPosition and no event exists for WAL segments |
| TEST-PS-120-09.T21 | abuse | PS-120-07.R04, PS-120-02.R02 | splice chunk 3 of artifact A into artifact B, reorder two chunks of B, drop B's final chunk; derive keys for 1 000 artifacts | each splice fails chunk authentication; no (key, nonce) pair repeats across the 1 000 artifacts |
| TEST-PS-120-09.T22 | abuse | PS-120-02.R04, PS-120-07.R04 | copy an older authentic artifact and manifest under the latest name; delete a manifest from the middle of the chain; forge a manifest without the backup key; run import-catalog and the F15.S03.M03 plan | all rejected with PLATFORM_BACKUP_MANIFEST_INVALID; the catalog keeps the authenticated chain head |
| TEST-PS-120-09.T23 | integration | PS-120-07.R03 | restore the 6-month-old monthly snapshot after 40 tombstones were applied since then | every tombstoned projection stays deleted after restore; ledger applied before readyz returns 200 |
| TEST-PS-120-09.T24 | integration | PS-120-03.R02, PS-120-03.R03 | failed record reaches its tier expiry; completed record reaches retention with and without a newer verified snapshot | failed artifact deleted, record kept; completed expires only when a newer verified snapshot covers the tier |
| TEST-PS-120-09.T25 | integration | PS-120-06.R03, PS-120-08.R04 | SIGTERM with 900 unarchived frames; then an external sqlite3 checkpoint twice within 30 min | shutdown hook archives the 900 frames before TRUNCATE; first external checkpoint marks a gap and triggers one full snapshot; second gap within 30 min triggers no further snapshot |
| TEST-PS-120-09.T26 | abuse | PS-120-01.R05, PS-120-02.R05, PS-120-07.R05 | full snapshot and 10 min of WAL segments while attachments are uploaded and one is deleted; restore; scan every artifact for the canary; then a run with an adapter that keeps encrypted bytes in main, and verify of a planted snapshot holding ciphertext | P0 blobs, attachment rows and blob metadata restored; no canary in any artifact; excludedBlobs 3 in the record and event; the misconfigured run refused with PLATFORM_BACKUP_CONFIG_INVALID; the planted snapshot fails with PLATFORM_BACKUP_VERIFY_FAILED |

## Acceptance criteria

- All tests T01-T26 pass in CI and a restore drill is performed at least every 100 days.
- A verified encrypted snapshot exists at least every 6 hours or an alert fires within 7 hours, and WAL archiving keeps the typical data-loss window at 5 minutes with zero gaps under the reference load.
- No backup artifact contains plaintext private data, key material or encrypted attachment MediaBlobs, and no spliced or relabelled artifact or manifest is accepted.
- A restored relay reproduces the database content hash of the snapshot and re-applies every ledger tombstone, whatever the age of the snapshot.

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
