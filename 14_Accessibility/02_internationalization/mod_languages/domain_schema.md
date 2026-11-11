# PS-113-01 — Domain schema: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-01.R01** The module owns no stored entity; catalogs are static files and the chosen locale is the defaultLocale field of F15.S04.M03 LocalSettings (P1, device only), which the locale bootstrap reads at runtime through the vault-local query platform.local_settings.get.
- **PS-113-01.R02** A catalog is a flat JSON object from key to string or plural object, with keys named area.screen.name and plural objects holding the CLDR categories.
- **PS-113-01.R03** Placeholders use {name} syntax only, with no code execution or nested formatting, and every locale must have the same parameter set for a key.

## Specification

**Note:** Static catalogs and a library; the only persisted value it uses is F15.S04.M03 LocalSettings.defaultLocale (P1, device only), so no catalog entity is owned here.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T01 | unit | PS-113-01.R02, PS-113-01.R03, PS-113-02.R01 | validate the shipped catalogs, the broken fixtures and a parser fixture set with {name}, nested braces, ICU plural and select syntax and HTML markup | shipped pass; each broken fixture fails with V01, V02, V03, V04 or V08; only {name} placeholders accepted |
| TEST-PS-113-09.T02 | unit | PS-113-01.R01, PS-113-02.R02, PS-113-06.R01 | negotiate with LocalSettings.defaultLocale de-AT; with pt-BR stored and browser en-GB; with xx-YY, malformed and empty lists; before unlock; with a selected relay whose Tenant.defaultLocale is fr | de, en via the browser, en, en, en; navigator.languages only before unlock; LocalSettings read only through platform.local_settings.get; Tenant.defaultLocale never consulted; no exception |

## Dependencies

Module depends on: F15.S04.M03, F15.S03.M01, F15.S01.M02, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
