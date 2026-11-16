# PS-113-02 — Validation rules: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-02.R01** CI validates every catalog against the en catalog and the plural rules of its locale.
- **PS-113-02.R02** Runtime negotiation and lookup never throw; invalid input degrades to English.
- **PS-113-02.R03** Each failure has one stable code printed in CI output.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | every key in en exists in each shipped locale or is listed in missing-allowed.json with an expiry within 30 days | I18N_CATALOG_KEY_MISSING |
| V02 | the set of {params} equals the en set for every key and locale | I18N_CATALOG_PARAM_MISMATCH |
| V03 | every plural message defines all categories required by Intl.PluralRules for the locale | I18N_CATALOG_PLURAL_INCOMPLETE |
| V04 | message length ≤ 500 characters and catalog gzip size ≤ 30 KiB | I18N_CATALOG_TOO_LARGE |
| V05 | locale tag is a valid BCP 47 tag; unsupported tags map to en | I18N_LOCALE_UNSUPPORTED |
| V06 | component styles use logical properties and no physical left, right, margin-left, padding-right or text-align left or right | I18N_CSS_PHYSICAL_PROPERTY |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T01 | unit | PS-113-01.R01, PS-113-01.R02, PS-113-02.R01 | validate the shipped catalogs and the broken fixtures | shipped pass; each broken fixture fails with V01, V02, V03 or V04 |
| TEST-PS-113-09.T02 | unit | PS-113-01.R03, PS-113-02.R02, PS-113-06.R01 | negotiateLocale for de-AT, pt-BR, xx-YY, malformed, empty list | de, en, en, en, en with no exception |
| TEST-PS-113-09.T08 | e2e | PS-113-01.R03, PS-113-02.R03, PS-113-07.R01 | run all routes in en-XA (40 percent expansion) and ar-XB at 320 px | no clipping, overlap or horizontal scroll; layout mirrored; V06 passes |
| TEST-PS-113-09.T09 | unit | PS-113-02.R03, PS-113-01.R03 | lint fixtures with margin-left, padding-right and text-align right | I18N_CSS_PHYSICAL_PROPERTY raised; logical equivalents pass |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
