# PS-112-10 — Import, export, backup and rollback: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-10.R01** The module stores no user data; amounts in exports remain minor-unit strings as defined by CTR-MNY-001 and are never formatted text.
- **PS-112-10.R02** The display preference (symbol, code or name) lives in F15.S04.M03 LocalSettings as the optional field moneyDisplay and travels with that module's vault export; the PWA shell reads it and passes it to formatMoney as the display option.
- **PS-112-10.R03** Upgrades of locale data change only display strings, never stored values, so rollback needs no data migration.

## Specification

- **export:** No module data is exported; moneyDisplay is part of the F15.S04.M03 LocalSettings vault export, and exported amounts stay minor-unit strings.
- **import:** F15.S04.M03 validates moneyDisplay against symbol, code or name; any other value is dropped and the default symbol is used.
- **backup:** Nothing to back up; the library ships with the app bundle and uses the browser's Intl data.
- **migration rollback:** Golden files are versioned with the Node ICU pin; rollback restores the previous goldens and library with no data migration because stored amounts are independent of display.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T14 | unit | PS-112-10.R01, PS-112-10.R03 | upgrade ICU data and golden file; roll back | changed goldens require review; stored amounts unaffected; rollback restores previous goldens |
| TEST-PS-112-09.T17 | integration | PS-112-10.R02 | export and import F15.S04.M03 LocalSettings with moneyDisplay symbol, code and name, then with the invalid value emoji | each valid value survives and the shell passes it to formatMoney; the invalid value falls back to symbol |

## Dependencies

Module depends on: F14.S02.M01, F09.S03.M01, F09.S03.M02, F09.S03.M03, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
