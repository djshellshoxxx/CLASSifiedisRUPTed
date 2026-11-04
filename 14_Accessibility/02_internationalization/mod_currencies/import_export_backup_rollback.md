# PS-112-10 — Import, export, backup and rollback: Currency display

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M02 Currency display](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/currencies` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-112-10.R01** The module stores no user data; amounts in exports remain minor-unit strings as defined by CTR-MNY-001 and are never formatted text.
- **PS-112-10.R02** Display preferences such as symbol, code or name live in vault settings (money.display) and travel with the vault export of F10.
- **PS-112-10.R03** Upgrades of locale data change only display strings, never stored values, so rollback needs no data migration.

## Specification

- **export:** No module data is exported; the setting money.display is part of the vault settings export owned by F10, and exported amounts stay minor-unit strings.
- **import:** money.display is validated against symbol, code or name; other values are ignored and the default symbol is used.
- **backup:** Nothing to back up; the library ships with the app bundle and uses the browser's Intl data.
- **migration rollback:** Golden files are versioned with the Node ICU pin; rollback restores the previous goldens and library with no data migration because stored amounts are independent of display.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-112-09.T14 | unit | PS-112-10.R01, PS-112-10.R02, PS-112-10.R03 | upgrade ICU data and golden file; roll back | changed goldens require review; stored amounts unaffected; rollback restores previous goldens |

## Dependencies

Module depends on: F14.S02.M01, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
