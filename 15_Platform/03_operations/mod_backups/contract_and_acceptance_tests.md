# PS-120-09 — Contract and acceptance tests: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-120-09.R02** Encryption, rotation and verification are tested with real node:sqlite databases and the real backup API in CI.
- **PS-120-09.R03** A restore drill test restores a generated database with 100 000 rows and proves equality of content hashes.

## Specification

See the module test table below (all processes).

**Fixtures:** Temp relay data dir with a 100 000-row database, backup dir on a separate tmpfs, 32-byte test key, fixed clock 2026-11-04T00:00:00Z advanced by the test.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T01 | integration | PS-120-01.R01, PS-120-01.R02, PS-120-01.R03 | run a full backup and read record plus manifest | record and manifest agree, contain keyFingerprint and no key bytes |
| TEST-PS-120-09.T02 | unit | PS-120-02.R01, PS-120-02.R02, PS-120-02.R03 | each rule V01-V08 violated in turn | documented error code returned, previous backups untouched |
| TEST-PS-120-09.T03 | property | PS-120-03.R01, PS-120-03.R02, PS-120-03.R03 | random sequences of run, verify, tamper, expire | only declared transitions occur; newest verified snapshot never expires |
| TEST-PS-120-09.T04 | integration | PS-120-03.R01, PS-120-06.R01 | kill the process during a snapshot | no visible partial artifact, next run succeeds, record is failed or absent |
| TEST-PS-120-09.T05 | contract | PS-120-04.R01, PS-120-04.R03 | run and verify commands | outputs and platform.backup.completed/failed payloads validate against the registry; event written in the same transaction as the status change |
| TEST-PS-120-09.T06 | integration | PS-120-04.R02, PS-120-06.R03 | scheduled and manual runs overlap | second refused with CONFLICT_STATE; scheduled run uses the same code path and events |
| TEST-PS-120-09.T07 | abuse | PS-120-05.R01, PS-120-05.R02, PS-120-05.R03 | non-operator calls run, verify, list; artifact read without key | FORBIDDEN; ciphertext does not decrypt without key; key never in API output |
| TEST-PS-120-09.T08 | integration | PS-120-06.R02, PS-120-08.R03 | 50 req/s write load while a 1 GiB snapshot runs | writer stall ≤ 50 ms, write p95 ≤ 300 ms |
| TEST-PS-120-09.T09 | chaos | PS-120-06.R03, PS-120-02.R01 | backup dir full, then unmounted, then key wrong | PLATFORM_BACKUP_NO_SPACE, PLATFORM_BACKUP_CONFIG_INVALID, PLATFORM_BACKUP_DECRYPT_FAILED; failed events emitted; alert metric increases |
| TEST-PS-120-09.T10 | integration | PS-120-07.R01, PS-120-07.R02 | rotation over simulated 14 months | exactly 8 six-hourly, 30 daily, 12 monthly, WAL 7 days remain; expired artifacts deleted from disk |
| TEST-PS-120-09.T11 | integration | PS-120-07.R03, PS-120-02.R03 | tombstone recorded after snapshot, restore | tombstone re-applied from outbox archive before serving |
| TEST-PS-120-09.T12 | abuse | PS-120-07.R01, PS-120-07.R02 | flip one byte in an artifact and truncate another | checksum and GCM tag fail, record failed, extra snapshot scheduled |
| TEST-PS-120-09.T13 | integration | PS-120-08.R01, PS-120-08.R02 | scrape metrics after success and failure | metrics per CTR-OBS-001 present, alert thresholds fire on simulated 8 h without verified backup |
| TEST-PS-120-09.T14 | load | PS-120-08.R03, PS-120-08.R02 | 1 GiB database snapshot and verify | snapshot ≤ 120 s, verify ≤ 180 s |
| TEST-PS-120-09.T15 | unit | PS-120-09.R01 | traceability tool run | every PS-120 requirement maps to a passing test |
| TEST-PS-120-09.T16 | integration | PS-120-09.R02, PS-120-09.R03, PS-120-10.R03 | restore drill of the 100 000-row database to a fresh directory plus WAL segments | content hashes equal, integrity ok, procedure time recorded |
| TEST-PS-120-09.T17 | integration | PS-120-10.R01, PS-120-10.R02 | export manifest list and check that vault data is absent; attempt to restore on a different relay key | manifests list only relay data; restore without the identity key file refused |
| TEST-PS-120-09.T18 | manual | PS-120-06.R03, PS-120-08.R03 | quarterly restore drill by the operator on a clean machine | drill recorded with drillAt, elapsed time below 4 h, checklist signed off |

## Acceptance criteria

- All tests T01-T18 pass in CI and a restore drill is performed at least every 100 days.
- A verified encrypted snapshot exists at least every 6 hours or an alert fires within 7 hours.
- No backup artifact contains plaintext private data or key material.
- A restored relay reproduces the database content hash of the snapshot and re-applies tombstones.

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
