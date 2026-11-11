# PS-111-08 — Observability and performance: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-08.R01** CI publishes violation counts by rule, route and impact as artifacts and a trend over the last 30 builds.
- **PS-111-08.R02** The full axe suite completes in 15 minutes or less on the CI runner.
- **PS-111-08.R03** The contrast check completes in 10 seconds or less.

## Specification

**Metrics**
- ci_a11y_axe_violations_total{impact, rule} (CI artifact)
- ci_a11y_routes_covered_ratio (CI artifact)
- ci_a11y_waivers_active (CI artifact)
- ci_a11y_suite_duration_s (CI artifact)

**Logs**
- CI log lines per failure: code, route, state, theme, rule, selector; no page text.

**Budgets**
- Axe suite ≤ 15 min over all routes, 6 states, 2 themes, 2 viewports and 2 locales.
- Contrast check ≤ 10 s; report generation ≤ 30 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T12 | load | PS-111-08.R01, PS-111-08.R02, PS-111-08.R03 | full suite on the CI runner | axe ≤ 15 min, contrast ≤ 10 s, trend artifact published |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
