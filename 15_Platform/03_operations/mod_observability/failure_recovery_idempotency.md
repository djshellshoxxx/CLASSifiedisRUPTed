# PS-121-06 — Failure recovery and idempotency: Observability

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M01 Observability](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/observability` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-121-06.R01** A throwing log sink never fails the caller; the line is dropped and counted.
- **PS-121-06.R02** Metrics rendering is a pure read of in-memory state and histogram bucket counts, sums and counts stay consistent.
- **PS-121-06.R03** A readiness probe that throws reports unready for that check instead of failing the endpoint.

## Specification

- **idempotency:** Metric registration is idempotent for identical definitions; rendering and readiness checks have no side effects except the storage ping transaction.
- **concurrency:** Single-threaded event loop per process; counters and histograms update synchronously so a render never sees half an observation.
- **retries:** No retries: a dropped log line is counted, a failed readiness check is reported and re-evaluated on the next probe.
- **offline:** Fully local: the vault logger works offline and keeps at most the configured number of lines (default 1 000) in memory.
- **partial failure:** A failing sink or probe degrades only that signal; command processing continues and /healthz stays available.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-121-09.T04 | unit | PS-121-02.R03, PS-121-06.R01 | warn level logger, invalid level, throwing sink | debug and info discarded; creation throws; no exception to the caller and dropped count 2 |
| TEST-PS-121-09.T07 | unit | PS-121-06.R02, PS-121-08.R03, PS-121-09.R02 | counter with escaped labels, gauge, histogram with three observations | exact Prometheus text with cumulative buckets, sum and count; default buckets include 150 and 300 |
| TEST-PS-121-09.T08 | integration | PS-121-01.R03, PS-121-03.R02, PS-121-06.R03 | pending migration, lag 60 s, throwing lag probe, failing ping, closed storage | unready with the failing check false; ready only when all pass |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001, CTR-ERR-001, CTR-TST-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
