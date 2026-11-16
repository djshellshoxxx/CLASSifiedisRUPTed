# PS-122-09 — Contract and acceptance tests: Disaster recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M03 Disaster recovery](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/recovery` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-122-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-122-09.R02** The restore path is exercised in CI against generated backups with WAL segments, including corrupted and missing inputs.
- **PS-122-09.R03** A quarterly manual drill on a clean machine is recorded with timings against the RPO and RTO.

## Specification

See the module test table below (all processes).

**Fixtures:** Backup fixture set from F15.S03.M02 tests: 3 full snapshots, 71 WAL segments, 2 archive segments, 100 000-row database, 40 dead-lettered events across 2 consumers (one disabled), fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-122-09.T01 | integration | PS-122-01.R01, PS-122-01.R03, PS-122-03.R02 | relay restore to an empty directory at latest | database opens, integrity ok, restore-report.json contains all documented fields |
| TEST-PS-122-09.T02 | unit | PS-122-02.R01, PS-122-02.R02, PS-122-02.R03 | each rule V01-V08 violated in turn | documented error code returned and live data untouched |
| TEST-PS-122-09.T03 | property | PS-122-03.R01, PS-122-03.R03 | random failures injected per phase | only declared transitions occur; aborted runs never modify the live database; requeued becomes delivered or dead_lettered only |
| TEST-PS-122-09.T04 | integration | PS-122-03.R01, PS-122-06.R03 | delete a middle WAL segment | restore stops at the last contiguous segment, reports reachedTimestamp, applies no later segment |
| TEST-PS-122-09.T05 | contract | PS-122-04.R01, PS-122-04.R02 | replay, list and plan calls | outputs and the platform.deadletter.replayed payload validate against registry schemas; list omits payloads |
| TEST-PS-122-09.T06 | integration | PS-122-04.R03, PS-122-01.R02 | publish backup.failed and backup.completed events | plan marks restore point stale then fresh and widens or narrows the data-loss window accordingly |
| TEST-PS-122-09.T07 | abuse | PS-122-05.R01, PS-122-05.R02, PS-122-05.R03 | non-operator replays and lists; operator reads payloads through the API | FORBIDDEN; no payload field exists in any response |
| TEST-PS-122-09.T08 | integration | PS-122-06.R01, PS-122-06.R02 | rerun restore on a failed directory; replay same eventIds twice | refused with PLATFORM_RECOVERY_TARGET_INVALID; second replay reports skipped; consumer inbox shows one effect |
| TEST-PS-122-09.T09 | chaos | PS-122-06.R03, PS-122-03.R03 | kill the restore process in each phase and the consumer during replay | restart from scratch succeeds; failed consumers leave dead letters, not lost events |
| TEST-PS-122-09.T10 | abuse | PS-122-07.R03, PS-122-07.R01 | tombstone issued after snapshot, restore then query public projection | tombstone re-applied before readyz 200; deleted projection not served |
| TEST-PS-122-09.T11 | abuse | PS-122-07.R02, PS-122-07.R01 | restore then scan filesystem for plaintext snapshots and temp files | decrypted data only inside target, mode 0600, temp files wiped |
| TEST-PS-122-09.T12 | integration | PS-122-08.R01, PS-122-08.R03 | scrape metrics before and after a backup failure and a dead-letter spike | restore point age and dead-letter alerts fire; replay counters correct |
| TEST-PS-122-09.T13 | load | PS-122-08.R02, PS-122-08.R03 | restore of a generated 5 GiB database with 600 WAL segments, replay of 500 events | total ≤ 2 h, requeue ≤ 2 s, throughput ≥ 1 000 events/s |
| TEST-PS-122-09.T14 | unit | PS-122-09.R01 | traceability tool run | every PS-122 requirement maps to a passing test |
| TEST-PS-122-09.T15 | integration | PS-122-09.R02, PS-122-09.R03, PS-122-10.R03 | CI restore drill against fixture set with rpo and rto assertion | achieved data loss ≤ 6 h, elapsed time recorded in the report, N-1 binary opens the restored data |
| TEST-PS-122-09.T16 | integration | PS-122-10.R01, PS-122-10.R02 | export restore report, restore with --new-identity | report exportable without payloads; new identity creates a new key id and prints a fingerprint warning |
| TEST-PS-122-09.T17 | manual | PS-122-08.R02, PS-122-09.R03 | quarterly drill on a clean machine following the runbook | all phases complete within 4 h and the operator signs the checklist |

## Acceptance criteria

- All tests T01-T16 pass in CI and the manual drill T17 is completed at least every 100 days.
- A restore to a new instance completes within 4 h with at most 6 h of data loss, and the report states both numbers.
- Dead-letter replay never produces duplicate side effects and is limited to 3 replays per event.
- Recovery never reads or reconstructs vault data, and user private records remain recoverable only from the user's own export.

## Dependencies

Module depends on: F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
