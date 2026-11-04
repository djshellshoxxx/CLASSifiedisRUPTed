# PS-120-03 — Workflow state machine: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-03.R01** A backup moves from running to completed only after the encrypted artifact and manifest are fsynced and renamed into place.
- **PS-120-03.R02** completed becomes verified only through a passing verification; a failed verification never deletes the artifact until retention expires it.
- **PS-120-03.R03** Expiry is the only way an artifact is removed and only when a newer verified snapshot covers the tier.

## Specification

### BackupRecord lifecycle

Initial **running**; terminal **failed**, **expired**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| running -> completed | artifact written, encrypted, fsynced, manifest renamed into place | emits no event until verification passes |
| running -> failed | any error (no space, IO, snapshot error) | partial files removed; emits platform.backup.failed |
| completed -> verified | verification passes V04-V06 | verifiedAt set; emits platform.backup.completed |
| completed -> failed | verification fails | emits platform.backup.failed; an extra snapshot is scheduled |
| verified -> failed | later periodic re-verification fails (weekly checksum scan) | emits platform.backup.failed |
| verified -> expired | retention elapsed and a newer verified snapshot covers the tier | artifact deleted, record kept |
| completed -> expired | retention elapsed | artifact deleted, record kept |

```mermaid
stateDiagram-v2
  [*] --> running
  running --> completed: artifact written, encrypted, fsynced, manifest renamed into place
  running --> failed: any error (no space, IO, snapshot error)
  completed --> verified: verification passes V04-V06
  completed --> failed: verification fails
  verified --> failed: later periodic re-verification fails (weekly checksum scan)
  verified --> expired: retention elapsed and a newer verified snapshot covers the tier
  completed --> expired: retention elapsed
  failed --> [*]
  expired --> [*]
```

### Timeouts and scheduled transitions

- Full snapshot every 21600000 ms (6 h) at offsets derived from the relayId (so relays do not all run at the same minute); WAL archive every 300000 ms (5 min).
- A run exceeding 1800000 ms (30 min) is aborted as failed with errorCode INTERNAL.
- Alert if no verified snapshot exists in the last 25200000 ms (7 h); weekly checksum re-verification of all retained artifacts.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T03 | property | PS-120-03.R01, PS-120-03.R02, PS-120-03.R03 | random sequences of run, verify, tamper, expire | only declared transitions occur; newest verified snapshot never expires |
| TEST-PS-120-09.T04 | integration | PS-120-03.R01, PS-120-06.R01 | kill the process during a snapshot | no visible partial artifact, next run succeeds, record is failed or absent |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
