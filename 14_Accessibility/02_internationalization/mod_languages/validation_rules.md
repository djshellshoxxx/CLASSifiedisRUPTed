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
| V07 | every t() and tp() call site passes every parameter that the en message declares for the key (static check of call sites) | I18N_CATALOG_PARAM_MISSING |
| V08 | message text uses only {name} placeholders with names matching ^[a-z][a-zA-Z0-9]*$; nested braces, ICU select or plural syntax and markup are rejected | I18N_CATALOG_SYNTAX_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T01 | unit | PS-113-01.R02, PS-113-01.R03, PS-113-02.R01 | validate the shipped catalogs, the broken fixtures and a parser fixture set with {name}, nested braces, ICU plural and select syntax and HTML markup | shipped pass; each broken fixture fails with V01, V02, V03, V04 or V08; only {name} placeholders accepted |
| TEST-PS-113-09.T02 | unit | PS-113-01.R01, PS-113-02.R02, PS-113-06.R01 | negotiate with LocalSettings.defaultLocale de-AT; with pt-BR stored and browser en-GB; with xx-YY, malformed and empty lists; before unlock; with a selected relay whose Tenant.defaultLocale is fr | de, en via the browser, en, en, en; navigator.languages only before unlock; LocalSettings read only through platform.local_settings.get; Tenant.defaultLocale never consulted; no exception |
| TEST-PS-113-09.T09 | unit | PS-113-02.R03, PS-113-06.R03 | lint fixtures with margin-left, padding-right and text-align right; a call site t('offer.price', {}) where en declares {price} | I18N_CSS_PHYSICAL_PROPERTY and I18N_CATALOG_PARAM_MISSING raised with stable codes; logical equivalents and complete call sites pass |

## Dependencies

Module depends on: F15.S04.M03, F15.S03.M01, F15.S01.M02, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
