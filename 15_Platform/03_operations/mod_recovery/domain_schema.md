# PS-122-01 — Domain schema: Disaster recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M03 Disaster recovery](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/recovery` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-122-01.R01** The module owns no persisted entity; restore progress and results live in a restore-report.json file in the target directory.
- **PS-122-01.R02** Dead letters are rows of the dead_letter table owned by the storage module and are only read and re-queued here.
- **PS-122-01.R03** The restore report records timing, selected artifacts, checks and the data-loss window so that drills are evidenced.

## Specification

**Note:** Tooling module: restore state is the file restore-report.json { startedAt, finishedAt, baseBackupId, walSegments[], reachedTimestamp, eventsReplayed, tombstonesApplied, checks, rpoAchievedMs, rtoElapsedMs } written to the restore directory and exported by the operator; dead letters are owned by F15.S02.M03.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-122-09.T01 | integration | PS-122-01.R01, PS-122-01.R03, PS-122-03.R02 | relay restore to an empty directory at latest | database opens, integrity ok, restore-report.json contains all documented fields |
| TEST-PS-122-09.T06 | integration | PS-122-04.R03, PS-122-01.R02 | publish backup.failed and backup.completed events | plan marks restore point stale then fresh and widens or narrows the data-loss window accordingly |

## Dependencies

Module depends on: F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001. Predecessor: [module SPEC](SPEC.md).
