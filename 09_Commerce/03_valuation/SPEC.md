# F09.S03 — 03_valuation

**Status:** SPECIFIED. **Parent:** [F09](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F09.S03.M01 | [Currency registry](mod_currency/SPEC.md) | SPECIFIED | ISO 4217 + configured crypto assets with decimals; tenant allowed-currency list. |
| F09.S03.M02 | [FX rates and quotes](mod_rates/SPEC.md) | SPECIFIED | RateSourcePort adapters, quotes with rational rates and expiry (default 15 min), source attribution; manual operator rates allowed and labelled. |
| F09.S03.M03 | [Money precision](mod_precision/SPEC.md) | SPECIFIED | Money type, parsing/formatting-neutral serialization, HALF_EVEN rounding, conversion, allocation (largest remainder) — pure library implementing CTR-MNY-001. |

## Aggregation

Modules in this subfeature share the feature package `packages/commerce` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| commerce.currency.registered | F09.S03.M01 | F09.S03.M02 | internal |
| commerce.currency.status_changed | F09.S03.M01 | F09.S03.M02 | internal |
| privacy.deletion.completed | F10.S01.M04 | F09.S03.M02 | external |
