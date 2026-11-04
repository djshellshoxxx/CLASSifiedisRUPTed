# PS-120-07 — Privacy, retention and abuse: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-07.R01** Backups contain only data the relay holds (signed public projections, ciphertext envelopes, operational records) and are encrypted at rest with AES-256-GCM; plaintext P2 or higher and vault keys never exist on the relay and so never in backups.
- **PS-120-07.R02** Retention is 8 six-hourly, 30 daily, 12 monthly snapshots and 7 days of WAL segments, and expired artifacts are deleted from disk.
- **PS-120-07.R03** Honoring signed tombstones (CTR-PRV-001 PRV-6) must survive restore, so restored relays re-apply tombstones recorded after the snapshot from the outbox archive.

## Specification

**Data classification**
- Full snapshots: relay database content (public projections P0, ciphertext envelopes, relay operational data P1).
- Manifests: P1 metadata without keys.

**Retention**
- six_hourly 48 h (8 snapshots); daily 30 copies; monthly 12 copies; WAL segments 7 days; BackupRecord rows 1 year (RET-AUDIT).
- Tombstoned public projections remain in older snapshots until those expire; restore re-applies tombstones before the relay serves traffic.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Backup theft exposes relay data | AES-256-GCM per 1 MiB chunk with HKDF-derived key from operator-supplied key, key never stored with artifacts, relay holds no plaintext private data to begin with |
| T02 | Backup tampering or substitution | per-artifact SHA-256 in manifest and record, GCM authentication per chunk with chunk index and final-chunk flag in AAD, weekly re-verification |
| T03 | Key loss makes backups unreadable | key fingerprint recorded, quarterly drill proves the operator can decrypt, runbook requires two offline copies of the key held by different people |
| T04 | Resurrection of deleted public data after restore | tombstone re-application from outbox archive before serving; deletion statements are signed and replayed |
| T05 | Backup job used to exhaust disk | free-space precheck (2 x database size), retention rotation, max one run at a time, manual runs limited to 1 per 10 minutes |

**Abuse controls**
- Operator-only capabilities with signed requests; every run and verify is audit-logged by the bus (CTR-CAP-001 CAP-7).
- Manual run rate limit of 1 per 10 minutes and single-flight lock.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T10 | integration | PS-120-07.R01, PS-120-07.R02 | rotation over simulated 14 months | exactly 8 six-hourly, 30 daily, 12 monthly, WAL 7 days remain; expired artifacts deleted from disk |
| TEST-PS-120-09.T11 | integration | PS-120-07.R03, PS-120-02.R03 | tombstone recorded after snapshot, restore | tombstone re-applied from outbox archive before serving |
| TEST-PS-120-09.T12 | abuse | PS-120-07.R01, PS-120-07.R02 | flip one byte in an artifact and truncate another | checksum and GCM tag fail, record failed, extra snapshot scheduled |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
