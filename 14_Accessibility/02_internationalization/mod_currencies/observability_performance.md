# PS-112-08 — Observability and performance: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-08.R01** CI reports golden-string and property test results; production builds send no metrics.
- **PS-112-08.R02** Formatting one amount takes 0.05 ms or less at p95 after the formatter cache is warm.
- **PS-112-08.R03** The module adds at most 3 KiB gzip to the initial bundle beyond the browser's built-in Intl.

## Specification

**Metrics**
- ci_i18n_money_golden_mismatch_total{locale} (CI artifact)
- ci_i18n_money_property_runs_total (CI artifact)

**Logs**
- dev-only console.warn i18n.money.fallback {currency, reason} — no amounts; removed from production builds.

**Budgets**
- formatMoney p95 ≤ 0.05 ms warm, ≤ 1 ms cold; parseMoneyInput p95 ≤ 0.05 ms.
- Self-test of both formatting paths ≤ 10 ms at startup.
- Bundle addition ≤ 3 KiB gzip.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T12 | load | PS-112-08.R01, PS-112-08.R02, PS-112-08.R03 | 100 000 format calls warm and cold; bundle check | p95 ≤ 0.05 ms warm, ≤ 1 ms cold, ≤ 3 KiB gzip |

## Dependencies

Module depends on: F14.S02.M01, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
