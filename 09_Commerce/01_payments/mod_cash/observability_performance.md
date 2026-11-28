# PS-067-08 — Observability and performance: Cash payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M02 Cash payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/cash` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-067-08.R01** The PWA sends no telemetry (OBS-7); counters stay in local diagnostics.
- **PS-067-08.R02** Local commit meets the budgets below.
- **PS-067-08.R03** Guidance and limit rejections are counted locally.

## Specification

**Metrics**
- Local diagnostics: classrup_commerce_cash_terms_total{status}
- Local diagnostics: classrup_commerce_cash_limit_rejections_total
- Local diagnostics: classrup_commerce_cash_guidance_shown_total{level=standard|elevated}

**Logs**
- info cash_terms.accepted {termsId, dealId, correlationId} — no hint text, no amounts.

**Budgets**
- set, accept and decline p95 ≤ 100 ms local commit on a mid-range phone.
- Terms sweep over 5 000 rows ≤ 500 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-067-09.T10 | unit | PS-067-08.R01, PS-067-08.R02 | diagnostics and timing run | no network telemetry; budgets met |
| TEST-PS-067-09.T18 | unit | PS-067-08.R03 | show standard and elevated guidance and trigger a cash limit rejection | classrup_commerce_cash_guidance_shown_total{level} and classrup_commerce_cash_limit_rejections_total increase in local diagnostics |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M03, F18.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
