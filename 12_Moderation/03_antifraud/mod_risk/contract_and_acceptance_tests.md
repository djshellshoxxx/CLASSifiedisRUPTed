# PS-100-09 — Contract and acceptance tests: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-100-09.R02** Score math, hysteresis and explanation completeness are covered by property tests.
- **PS-100-09.R03** Friction-only semantics are covered by a schema test and abuse tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Store with subject B and signals: 2 no_show (10 each, 60-day half-life, 10 days old), 1 dispute_opened (10), 3 completed dealings; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T01 | unit | PS-100-01.R01, PS-100-01.R03, PS-100-02.R01, PS-100-02.R02 | compute assessment for fixture | score equals documented sum of factor points; level per thresholds; model risk/1 recorded |
| TEST-PS-100-09.T02 | property | PS-100-01.R03, PS-100-03.R02 | random signal sets and times | factors sum to score before clamping; level function of score and hysteresis state; same digest same output |
| TEST-PS-100-09.T03 | unit | PS-100-02.R03 | invalid subject, unknown model, transaction without two keys, stale read | documented error codes |
| TEST-PS-100-09.T04 | integration | PS-100-03.R01, PS-100-03.R03 | burst of 20 signal events within 5 seconds | one recompute; assessment unique per digest |
| TEST-PS-100-09.T05 | contract | PS-100-04.R01, PS-100-04.R02, PS-100-09.R02 | command, queries and event | validate against registry schemas; no signed statement produced |
| TEST-PS-100-09.T06 | integration | PS-100-04.R03, PS-100-03.R02 | score crossing 70 up and 60 down | elevated event once on rise; level stays high until below 60 |
| TEST-PS-100-09.T07 | abuse | PS-100-05.R01, PS-100-05.R02, PS-100-05.R03 | counterparty reads own assessment from the other's vault; member reads another's relay assessment | NOT_FOUND; level never in federation payloads |
| TEST-PS-100-09.T08 | abuse | PS-100-07.R01, PS-100-07.R02, PS-100-07.R03 | schema with a ban-like friction value; 61 recomputes in an hour | schema rejects; 61st RATE_LIMITED |
| TEST-PS-100-09.T09 | integration | PS-100-06.R01, PS-100-06.R02, PS-100-06.R03 | same digest recompute twice; signal store failure; crash after assessment before event | single row; previous assessment valid; event delivered once after recovery |
| TEST-PS-100-09.T10 | unit | PS-100-07.R02, PS-100-01.R02 | assessment retention at 30 days and consumer payload | purged; payload has level and kinds only |
| TEST-PS-100-09.T11 | load | PS-100-08.R01, PS-100-08.R02, PS-100-08.R03 | 200 recomputes per second for 5 minutes; sweep 10 000 subjects | p95 ≤ 50 ms, sweep ≤ 60 s |
| TEST-PS-100-09.T12 | unit | PS-100-09.R01, PS-100-09.R03 | traceability tool run | every PS-100 requirement maps to a passing test |
| TEST-PS-100-09.T13 | integration | PS-100-10.R01, PS-100-10.R02, PS-100-10.R03 | export, import, backup restore | assessments excluded from export and recomputed after restore with identical results |
| TEST-PS-100-09.T14 | e2e | PS-100-01.R02, PS-100-04.R01 | mobile user confirms a trade with a high-level counterparty | caution banner and extra confirmation shown, factor sentences readable, axe zero serious issues |

## Acceptance criteria

- All tests T01–T14 pass in CI.
- Every high level shows its factors to the subject on a relay and to the vault owner locally, and triggers friction only.
- Identical inputs always yield identical level, score and factors.

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
