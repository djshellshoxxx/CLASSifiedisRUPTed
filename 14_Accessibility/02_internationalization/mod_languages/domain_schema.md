# PS-113-01 — Domain schema: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-01.R01** The module owns no stored entity; catalogs are static files and the chosen locale is a vault setting key i18n.locale stored by F10 settings.
- **PS-113-01.R02** A catalog is a flat JSON object from key to string or plural object, with keys named area.screen.name and plural objects holding the CLDR categories.
- **PS-113-01.R03** Placeholders use {name} syntax only, with no code execution or nested formatting, and every locale must have the same parameter set for a key.

## Specification

**Note:** Static catalogs and a library; the only persisted value is the vault setting i18n.locale owned by F10 settings, so no catalog entity is owned here.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T01 | unit | PS-113-01.R01, PS-113-01.R02, PS-113-02.R01 | validate the shipped catalogs and the broken fixtures | shipped pass; each broken fixture fails with V01, V02, V03 or V04 |
| TEST-PS-113-09.T02 | unit | PS-113-01.R03, PS-113-02.R02, PS-113-06.R01 | negotiateLocale for de-AT, pt-BR, xx-YY, malformed, empty list | de, en, en, en, en with no exception |
| TEST-PS-113-09.T03 | property | PS-113-01.R03, PS-113-03.R01, PS-113-04.R02 | for each shipped locale and counts 0..1000000, compare tp() category to Intl.PluralRules | category matches; every category has a string |
| TEST-PS-113-09.T08 | e2e | PS-113-01.R03, PS-113-02.R03, PS-113-07.R01 | run all routes in en-XA (40 percent expansion) and ar-XB at 320 px | no clipping, overlap or horizontal scroll; layout mirrored; V06 passes |
| TEST-PS-113-09.T09 | unit | PS-113-02.R03, PS-113-01.R03 | lint fixtures with margin-left, padding-right and text-align right | I18N_CSS_PHYSICAL_PROPERTY raised; logical equivalents pass |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
