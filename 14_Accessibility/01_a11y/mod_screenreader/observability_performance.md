# PS-110-08 — Observability and performance: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-08.R01** CI reports rule violations per screen as artifacts; production builds send no metrics.
- **PS-110-08.R02** Spoken-name helpers run in at most 0.2 ms p95 per call.
- **PS-110-08.R03** The announcer adds no more than 2 KiB gzip to the initial bundle.

## Specification

**Metrics**
- ci_a11y_sr_violations_total{rule} (CI artifact)
- ci_a11y_sr_screens_checked_total (CI artifact)

**Logs**
- dev-only console.warn i18n.a11y.spoken_fallback {locale, helper} — no values; removed from production builds.

**Budgets**
- spoken helper call p95 ≤ 0.2 ms; announcer enqueue ≤ 1 ms.
- Screen reader structure checks for all screens complete ≤ 5 min in CI.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T12 | load | PS-110-08.R01, PS-110-08.R02, PS-110-08.R03 | 100 000 helper calls and 1000 announce calls | p95 ≤ 0.2 ms, enqueue ≤ 1 ms, bundle ≤ 2 KiB gzip |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, CTR-UX-001, CTR-MNY-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
