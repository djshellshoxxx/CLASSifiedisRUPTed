# PS-122-02 — Validation rules: Disaster recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M03 Disaster recovery](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/recovery` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-122-02.R01** Restore refuses to run unless the target, the artifacts and the keys pass all preconditions.
- **PS-122-02.R02** Replay is bounded by count, repetition and consumer state so that it cannot cause event storms.
- **PS-122-02.R03** Every refusal returns one stable error code with a messageKey for the operator tool.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | restore target directory is empty, writable and on a different volume than RELAY_DATA_DIR | PLATFORM_RECOVERY_TARGET_INVALID |
| V02 | selected base snapshot is in status verified (or --allow-unverified with explicit flag) and its SHA-256 matches | PLATFORM_RECOVERY_SNAPSHOT_UNVERIFIED |
| V03 | backup key matches the recorded keyFingerprint | PLATFORM_RECOVERY_KEY_MISMATCH |
| V04 | WAL segments form a contiguous chain from the base snapshot | PLATFORM_RECOVERY_WAL_GAP |
| V05 | relay identity key file present, or --new-identity given | PLATFORM_RECOVERY_IDENTITY_MISSING |
| V06 | replay selection is ≤ 500 events and each event has replayCount < 3 | PLATFORM_DEADLETTER_REPLAY_LIMIT |
| V07 | consumer module of the event is enabled for the relay | FEATURE_DISABLED |
| V08 | requested restore time is not older than the oldest retained snapshot | PLATFORM_RECOVERY_TARGET_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-122-09.T02 | unit | PS-122-02.R01, PS-122-02.R02, PS-122-02.R03 | each rule V01-V08 violated in turn | documented error code returned and live data untouched |

## Dependencies

Module depends on: F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
