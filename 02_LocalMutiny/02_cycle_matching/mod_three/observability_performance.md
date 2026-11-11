# PS-020-08 — Observability and performance: Three-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M01 Three-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/three` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-020-08.R01** Explanation latency is recorded locally and no data leaves the device.
- **PS-020-08.R02** Explanation computation completes within 10 ms for 3 participants.
- **PS-020-08.R03** Profile version in use is visible in engine run statistics.

## Specification

**Metrics**
- classrup_mutiny_cycle3_explain_duration_ms (histogram, local diagnostics and relay if served there)

**Logs**
- debug cycle3.explained {suggestionId, profileVersion, correlationId} — no DIDs or amounts.

**Budgets**
- explain p95 ≤ 10 ms computing and ≤ 100 ms including IndexedDB reads on a mid-range phone.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-020-09.T09 | integration | PS-020-06.R01, PS-020-06.R02, PS-020-08.R02 | crash and restart | explanations rebuilt, computation within 10 ms |
| TEST-PS-020-09.T10 | unit | PS-020-08.R01, PS-020-08.R03 | engine run statistics | profile version p3.2 present, latency recorded locally only |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
