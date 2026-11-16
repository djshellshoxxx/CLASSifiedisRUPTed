# PS-109-08 — Observability and performance: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-08.R01** CI reports counts of violations per rule and per screen as a build artifact; production builds send no metrics.
- **PS-109-08.R02** Focus moves after route change complete within 100 ms.
- **PS-109-08.R03** Keyboard and target-size checks for all screens finish within 5 minutes in CI.

## Specification

**Metrics**
- ci_a11y_keyboard_violations_total{rule} (CI artifact, not a runtime metric)
- ci_a11y_keyboard_suite_duration_s (CI artifact)

**Logs**
- dev-only console.warn i18n.a11y.focus_fallback {selector, fallback} — no values; removed from production builds.

**Budgets**
- Route focus move ≤ 100 ms after navigation commit; dialog open to focus inside ≤ 100 ms.
- Keyboard e2e suite ≤ 5 min on the CI runner.
- Primitives add ≤ 6 KiB gzip to the initial JS budget (CTR-OBS-001 OBS-5).

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T12 | load | PS-109-08.R01, PS-109-08.R02, PS-109-08.R03 | measure focus move, dialog open, suite duration and bundle size | ≤ 100 ms, ≤ 100 ms, ≤ 5 min and ≤ 6 KiB gzip |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
