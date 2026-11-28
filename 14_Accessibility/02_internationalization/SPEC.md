# F14.S02 — 02_internationalization

**Status:** SPECIFIED. **Parent:** [F14](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F14.S02.M01 | [Languages](mod_languages/SPEC.md) | SPECIFIED | Message catalogs, locale negotiation, plural rules, RTL direction, missing-key fallback to en with dev warning. |
| F14.S02.M02 | [Currency display](mod_currencies/SPEC.md) | SPECIFIED | Locale-aware Money formatting from minor units via Intl.NumberFormat, approximate-value labelling with quote source/time. |

## Aggregation

Modules in this subfeature share the feature package `packages/i18n` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

_None._
