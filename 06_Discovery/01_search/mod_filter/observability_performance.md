# PS-044-08 — Observability and performance: Search filters

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M03 Search filters](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/filter` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-044-08.R01** Validation and compilation are fast enough to be negligible in the query budget.
- **PS-044-08.R02** Failures are counted by error code without recording values.
- **PS-044-08.R03** The compiled SQL is covered by an explain-plan test showing index use.

## Specification

**Metrics**
- classrup_discovery_filter_validation_total{code}

**Logs**
- debug filter.rejected {code, path} - never the value.

**Budgets**
- validateFilter plus compileFilter <= 1 ms p95 for a filter with all keys and 200 categories; compiled queries use discovery_doc_cell or the category index (explain-plan test).

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-044-09.T07 | abuse | PS-044-07.R02, PS-044-07.R03, PS-044-08.R01 | 10 000 fuzz strings with SQL metacharacters and 5 000-item lists | no SQL injection, errors for oversize lists, validation under 1 ms p95 |
| TEST-PS-044-09.T11 | integration | PS-044-08.R02, PS-044-08.R03 | explain query plan for distance and category filters | index used, metrics counted by code without values |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001, CTR-MNY-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
