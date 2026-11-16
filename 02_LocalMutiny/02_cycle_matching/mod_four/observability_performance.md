# PS-017-08 — Observability and performance: Four-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M02 Four-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/four` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-017-08.R01** Explanation latency is recorded locally; nothing leaves the device.
- **PS-017-08.R02** Explanation computation for 4 participants completes within 10 ms.
- **PS-017-08.R03** The active profile version is visible in engine run statistics.

## Specification

**Metrics**
- classrup_mutiny_cycle4_explain_duration_ms (histogram, local diagnostics and relay if served there)

**Logs**
- debug cycle4.explained {suggestionId, profileVersion, correlationId} — no DIDs or amounts.

**Budgets**
- explain p95 ≤ 10 ms computing, ≤ 100 ms including IndexedDB reads.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-017-09.T09 | integration | PS-017-06.R01, PS-017-06.R03, PS-017-07.R02, PS-017-08.R02 | crash and restart | explanations rebuilt within 10 ms and cache purged with suggestion |
| TEST-PS-017-09.T10 | unit | PS-017-07.R03, PS-017-08.R01, PS-017-08.R03 | load rule inputs and run statistics | only own knowledge used; profile version p4.1 in stats; latency recorded locally |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
