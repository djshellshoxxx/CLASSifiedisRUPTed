# PS-047-06 — Failure recovery and idempotency: Coarse location regions

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M01 Coarse location regions](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/coarse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-047-06.R01** All functions are pure, so repeated calls and retries give identical results.
- **PS-047-06.R02** Invalid input returns an error and never a clamped or approximate value.
- **PS-047-06.R03** No function allocates more than 512 cells or 4 KiB of working memory per call.

## Specification

- **idempotency:** Pure functions; the same input always returns the same output.
- **concurrency:** No shared state; safe from workers and multiple tabs.
- **retries:** Not applicable; there is no I/O.
- **offline:** Fully offline; there is no network or data dependency.
- **partial failure:** A call either returns a complete result or an error; there are no partial results.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-047-09.T10 | property | PS-047-05.R01, PS-047-05.R03, PS-047-06.R01 | 200 runs of the same call sequence | byte-identical results, no I/O performed |
| TEST-PS-047-09.T13 | unit | PS-047-09.R01, PS-047-09.R02, PS-047-09.R03, PS-047-06.R02, PS-047-06.R03 | traceability run over PS-047 | every requirement maps to a passing test; vectors file unchanged |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
