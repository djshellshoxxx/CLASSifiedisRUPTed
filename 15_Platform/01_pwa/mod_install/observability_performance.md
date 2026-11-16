# PS-115-08 — Observability and performance: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-08.R01** Install and update outcomes are counted locally and viewable in the diagnostics panel; no telemetry is sent.
- **PS-115-08.R02** The install card and update banner must not worsen CLS (≤ 0.1) or INP (≤ 200 ms) per CTR-OBS-001 OBS-5.
- **PS-115-08.R03** The module adds at most 6 KiB gzip to the initial bundle.

## Specification

**Metrics**
- local counters install_prompt_shown, install_accepted, install_dismissed, update_prompted, update_accepted, update_deferred (never transmitted)

**Logs**
- Local diagnostic log lines install.state {state} and update.state {state}; exportable by the user, never uploaded.

**Budgets**
- Initial bundle contribution ≤ 6 KiB gzip; banner render ≤ 16 ms; layout reserves space so CLS contribution is 0.
- Update now to reloaded app ≤ 3 s on a Moto G-class device with warm cache.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T11 | a11y | PS-115-07.R03, PS-115-08.R02 | install card, iOS sheet and update banner scanned with axe | zero serious issues; targets ≥ 44 px; CLS contribution 0 |
| TEST-PS-115-09.T12 | load | PS-115-08.R01, PS-115-08.R03 | Lighthouse CI installability and bundle check | installable, module ≤ 6 KiB gzip, LCP ≤ 2.5 s, INP ≤ 200 ms |

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
