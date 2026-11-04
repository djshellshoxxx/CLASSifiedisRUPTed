# PS-113-08 — Observability and performance: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-08.R01** CI reports key coverage per locale and the number of fallbacks used in end-to-end runs; production builds send no metrics.
- **PS-113-08.R02** Locale switch completes within 300 ms after the catalog is loaded, and t() takes 0.05 ms or less per call.
- **PS-113-08.R03** Each catalog is at most 30 KiB gzip and loads in 1 s or less on the 4G profile.

## Specification

**Metrics**
- ci_i18n_key_coverage_ratio{locale} (CI artifact)
- ci_i18n_fallbacks_total{locale} (CI artifact from e2e runs)
- ci_i18n_catalog_gzip_bytes{locale} (CI artifact)

**Logs**
- dev-only console.warn i18n.missing {locale, key} — no param values; production writes the key to local diagnostics only.

**Budgets**
- t() p95 ≤ 0.05 ms; locale switch ≤ 300 ms after catalog load.
- Catalog ≤ 30 KiB gzip; en inline in the main bundle within the 150 KiB initial JS budget (OBS-5).

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T12 | load | PS-113-08.R01, PS-113-08.R02, PS-113-08.R03 | 100 000 t() calls; catalog load on 4G profile; bundle size check | p95 ≤ 0.05 ms, switch ≤ 300 ms, load ≤ 1 s, catalogs ≤ 30 KiB gzip |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
