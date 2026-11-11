# PS-018-08 — Observability and performance: N-party cycle engine

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M03 N-party cycle engine](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/n` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-018-08.R01** Run duration, expansions, truncation and result counts are recorded locally per run and, on relays only, as metrics per CTR-OBS-001; the PWA sends no telemetry (OBS-7).
- **PS-018-08.R02** A relay run over a graph of at most 5000 edges with Lmax 5 completes within 250 ms at p95 on the reference relay.
- **PS-018-08.R03** Determinism is observable by exposing inputHash in run statistics.

## Specification

**Metrics**
- classrup_mutiny_matching_runs_total{outcome=complete|truncated|failed} (relay)
- classrup_mutiny_matching_expansions_count (histogram, relay)
- classrup_mutiny_matching_duration_ms (histogram, relay)
- classrup_mutiny_suggestions_total{outcome=created|refreshed|superseded|expired|dismissed} (relay)

**Logs**
- info matching.run_completed {runId, nodes, edges, expansions, durationMs, truncated, correlationId} — no DIDs, no item ids.
- warn matching.truncated {runId, reason, expansions, durationMs}

**Budgets**
- Search p95 ≤ 250 ms for graphs ≤ 5000 edges and Lmax 5 on the reference relay (OBS-4); hard stop at 250 ms and 100000 expansions everywhere.
- Vault-mode run on a mid-range phone runs in a Web Worker, never blocks the UI thread, and renders results within 1 s of completion.
- Graph build over 20000 edges ≤ 150 ms; memory ≤ 32 MiB.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-018-09.T16 | load | PS-018-08.R01, PS-018-08.R02, PS-018-08.R03 | gDense on reference relay, 100 runs | p95 ≤ 250 ms, truncation flagged when budget forced, metrics exported |

## Dependencies

Module depends on: F02.S02.M04, F02.S02.M05, F02.S04.M03, F01.S01.M01, F01.S02.M02, F01.S03.M01, F06.S02.M01, F07.S02.M02, F07.S02.M01, F07.S03.M01, F07.S03.M02, F09.S03.M02, F09.S03.M03, F11.S01.M01, F11.S01.M02, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-OBS-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
