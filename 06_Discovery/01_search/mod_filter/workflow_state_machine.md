# PS-044-03 — Workflow state machine: Search filters

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M03 Search filters](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/filter` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-044-03.R01** The library is stateless; validate and compile are pure functions with no lifecycle.
- **PS-044-03.R02** Identical input always yields identical output and identical parameter order.
- **PS-044-03.R03** Compilation never reads the clock; the caller passes now explicitly for postedWithin.

## Specification

**Note:** Stateless library; there is no entity lifecycle. Functions - validateFilter(input, ports) returns Result, canonicalize(filter), compileFilter(filter, now) returns { sql, params }.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-044-09.T04 | unit | PS-044-01.R02, PS-044-03.R01 | compile each key alone and all together | SQL text and params equal golden fixtures |
| TEST-PS-044-09.T05 | property | PS-044-03.R02, PS-044-03.R03 | 200 runs of the same filter with the same clock | identical SQL and params; compile never reads the system clock |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001, CTR-MNY-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
