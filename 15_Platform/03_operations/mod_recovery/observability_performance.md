# PS-122-08 — Observability and performance: Disaster recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M03 Disaster recovery](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/recovery` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-122-08.R01** Recovery readiness is measured continuously as restore-point age and dead-letter count per CTR-OBS-001.
- **PS-122-08.R02** Drills measure real restore time and compare it with the 4 h RTO and the achieved data-loss window with the 6 h RPO.
- **PS-122-08.R03** Replay throughput and failure counts are visible while running.

## Specification

**Metrics**
- classrup_platform_recovery_restore_point_age_seconds (alert at 25200)
- classrup_platform_deadletter_count (alert when above 0 for 15 minutes)
- classrup_platform_deadletter_replay_total{outcome=requeued|refused}
- classrup_platform_recovery_drill_duration_ms (from restore-report.json, recorded by drill)

**Logs**
- info restore.phase {phase, durationMs}; warn restore.aborted {phase, code}; info deadletter.replayed {replayId, requeued, refused} — no payloads.

**Budgets**
- End-to-end restore of a 5 GiB database ≤ 2 h in drills, hard target RTO 4 h.
- Achieved data loss ≤ 6 h (RPO) even without WAL segments; typical ≤ 5 min with segments.
- Replay of 500 events requeues within 2 s; consumers process 1 000 events/s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-122-09.T12 | integration | PS-122-08.R01, PS-122-08.R03 | scrape metrics before and after a backup failure and a dead-letter spike | restore point age and dead-letter alerts fire; replay counters correct |
| TEST-PS-122-09.T13 | load | PS-122-08.R02, PS-122-08.R03 | restore of a generated 5 GiB database with 600 WAL segments, replay of 500 events | total ≤ 2 h, requeue ≤ 2 s, throughput ≥ 1 000 events/s |
| TEST-PS-122-09.T17 | manual | PS-122-08.R02, PS-122-09.R03 | quarterly drill on a clean machine following the runbook | all phases complete within 4 h and the operator signs the checklist |

## Dependencies

Module depends on: F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
