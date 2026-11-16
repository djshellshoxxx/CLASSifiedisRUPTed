# PS-074-05 — Authorization and capabilities: Money precision

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M03 Money precision](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/precision` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-074-05.R01** The library performs no authorization; callers authorize before using it.
- **PS-074-05.R02** It has no network access, no storage access and no ambient authority, so it cannot leak data by construction.
- **PS-074-05.R03** Importing the package into a client bundle adds no more than 12 KiB gzip.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-074-09.T10 | unit | PS-074-05.R01, PS-074-05.R02, PS-074-07.R01 | static analysis of the package imports and call graph | no fetch, fs, Date or Math.random usage and no logging calls |
| TEST-PS-074-09.T12 | load | PS-074-08.R02, PS-074-05.R03 | 1 000 weights allocation and bundle size check | p99 ≤ 2 ms and gzip size ≤ 12 KiB |

## Dependencies

Module depends on: CTR-MNY-001, CTR-ERR-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
