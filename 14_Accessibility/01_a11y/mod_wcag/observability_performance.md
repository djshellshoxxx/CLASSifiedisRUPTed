# PS-111-08 — Observability and performance: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-08.R01** CI publishes violation counts by rule, route and impact as artifacts and a trend over the last 30 builds.
- **PS-111-08.R02** The pull-request axe subset completes in 15 minutes or less and the nightly full matrix in 60 minutes or less on the CI runner, assuming at most 60 routes with 4 applicable states on average; above 60 routes the budget and the subset are revisited.
- **PS-111-08.R03** The contrast check completes in 10 seconds or less.

## Specification

**Metrics**
- ci_a11y_axe_violations_total{impact, rule} (CI artifact)
- ci_a11y_routes_covered_ratio (CI artifact)
- ci_a11y_waivers_active (CI artifact)
- ci_a11y_suite_duration_s{matrix} (CI artifact)

**Logs**
- CI log lines per failure: code, route, state, theme, viewport, locale, rule, selector; no page text.

**Budgets**
- Pull-request subset ≤ 15 min over all routes and applicable states in 2 combinations; nightly full matrix ≤ 60 min over 2 themes, 2 viewports and 2 locales; both assume ≤ 60 routes and ≤ 4 applicable states on average with 4 workers.
- Contrast check ≤ 10 s; authentication-assistance check ≤ 60 s; report generation ≤ 30 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T12 | load | PS-111-08.R01, PS-111-08.R02, PS-111-08.R03 | pull-request subset and nightly full matrix on the CI runner with the 60-route fixture | subset ≤ 15 min, full ≤ 60 min, contrast ≤ 10 s, trend artifact published |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, F16.S02.M01, F07.S01.M03, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
