# PS-122-01 — Domain schema: Disaster recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M03 Disaster recovery](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/recovery` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-122-01.R01** The module owns no persisted entity; restore progress and results live in a restore-report.json file in the target directory.
- **PS-122-01.R02** Dead letters are rows of the dead_letter table owned by the storage module, which keeps replay_count and last_replayed_at across requeue and re-dead-lettering; this module only reads and re-queues them.
- **PS-122-01.R03** The restore report records timing, selected artifacts, checks, the data-loss window, events re-delivered and lost, excluded consumers, the restore announcement and frozen auctions so that drills are evidenced.

## Specification

**Note:** Tooling module: restore state is the file restore-report.json { startedAt, finishedAt, baseBackupId, walSegments[], reachedTimestamp, eventsReplayed, lostEvents, excludedConsumers[], tombstonesApplied, ledgerBackupId, checks, rpoAchievedMs, lostWindow { from, to }, announcementCid, receiptEpoch, frozenAuctions, newIdentity, rtoElapsedMs } written to the restore directory and exported by the operator; dead letters are owned by F15.S02.M03 (dead_letter with replay_count and last_replayed_at).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-122-09.T01 | integration | PS-122-01.R01, PS-122-01.R03, PS-122-03.R02 | relay restore to an empty directory at latest | database opens, integrity ok, restore-report.json contains all documented fields |
| TEST-PS-122-09.T18 | integration | PS-122-06.R02, PS-122-01.R02 | replay 20 dead letters, let 5 fail again, replay those; diff every relay table before and after | only dead_letter and inbox rows changed; replay_count is 2 for the 5 re-dead-lettered events and last_replayed_at kept |
| TEST-PS-122-09.T20 | integration | PS-122-03.R04, PS-122-01.R03 | archive holds events before and after reachedTimestamp, one whose aggregate revision is missing in the restored records, and push events in range | only events ≤ reachedTimestamp with existing revisions re-delivered; the rest counted in lostEvents and rpoAchievedMs; push consumer listed in excludedConsumers and sends nothing |

## Dependencies

Module depends on: F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
