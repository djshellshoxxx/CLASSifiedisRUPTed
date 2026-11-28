# PS-122-02 — Validation rules: Disaster recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M03 Disaster recovery](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/recovery` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-122-02.R01** Restore refuses to run unless the target, the artifacts, the manifests, the ledger and the keys pass all preconditions.
- **PS-122-02.R02** Replay is bounded by count, repetition and consumer state so that it cannot cause event storms.
- **PS-122-02.R03** Every refusal returns one stable error code with a messageKey for the operator tool.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | restore target directory is empty, writable, on a different volume than RELAY_DATA_DIR and is not the live data directory (no in-place restore) | PLATFORM_RECOVERY_TARGET_INVALID |
| V02 | selected base snapshot is in status verified (or --allow-unverified with explicit flag) and its SHA-256 matches | PLATFORM_RECOVERY_SNAPSHOT_UNVERIFIED |
| V03 | backup key matches the recorded keyFingerprint | PLATFORM_RECOVERY_KEY_MISMATCH |
| V04 | WAL segments form a contiguous chain from the base snapshot's walPosition | PLATFORM_RECOVERY_WAL_GAP |
| V05 | relay identity key file present, or --new-identity given (which always creates a new relayId) | PLATFORM_RELAY_IDENTITY_MISSING |
| V06 | replay selection is ≤ 500 events and each event has replay_count < 3 | PLATFORM_DEADLETTER_REPLAY_LIMIT |
| V07 | consumer module of the event is enabled for the relay | FEATURE_DISABLED |
| V08 | requested restore time is not older than the oldest retained snapshot | PLATFORM_RECOVERY_TARGET_INVALID |
| V09 | an authenticated tombstone ledger artifact exists whose range covers every tombstone up to the latest ledger append | PLATFORM_RECOVERY_LEDGER_MISSING |
| V10 | every manifest used by the plan or restore passes F15.S03.M02 V10 (MAC verifies and links into the chain) | PLATFORM_BACKUP_MANIFEST_INVALID |
| V11 | restore re-delivery never targets a consumer registered with externalSideEffects (push, email); such consumers are listed in excludedConsumers | FORBIDDEN |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-122-09.T02 | unit | PS-122-02.R01, PS-122-02.R02, PS-122-02.R03 | each rule V01-V11 violated in turn | documented error code returned and live data untouched |
| TEST-PS-122-09.T23 | abuse | PS-122-02.R01, PS-122-07.R03 | plan with a relabelled manifest, then with the tombstone ledger artifact removed | PLATFORM_BACKUP_MANIFEST_INVALID, then PLATFORM_RECOVERY_LEDGER_MISSING; nothing restored |

## Dependencies

Module depends on: F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
