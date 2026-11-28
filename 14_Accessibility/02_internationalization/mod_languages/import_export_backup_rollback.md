# PS-113-10 — Import, export, backup and rollback: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-10.R01** The only user data involved is LocalSettings.defaultLocale, which F15.S04.M03 owns, exports and imports; this module owns no user data and registers no ExportSectionPort, DeletionPort or RetentionPurgePort (N6).
- **PS-113-10.R02** Importing a locale that is not shipped in this release selects the negotiated fallback and keeps the imported value so a newer release can honour it.
- **PS-113-10.R03** Catalog changes are additive; removing a key needs a deprecation period of one release.

## Specification

- **export:** LocalSettings.defaultLocale is part of the F15.S04.M03 vault export (classrup-export/v1); catalogs are not user data and this module contributes no export section.
- **import:** F15.S04.M03 validates defaultLocale as a BCP 47 tag; an unshipped value is kept and the app uses the negotiated fallback.
- **backup:** Nothing to back up; catalogs ship with the app bundle and the locale preference belongs to F15.S04.M03.
- **migration rollback:** Catalogs are additive; rollback to a previous release restores its catalogs, and keys unknown to it simply do not appear; users on a locale dropped in rollback fall back to en while their stored defaultLocale is kept.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T14 | integration | PS-113-10.R01, PS-113-10.R02, PS-113-10.R03 | add a key and a locale; export and import F15.S04.M03 LocalSettings with defaultLocale de and with pt-BR; roll back a release | new keys fall back to en until translated; de restored after import; pt-BR kept while the browser language or en is used; this module adds no export section; rollback keeps users on a shipped locale |

## Dependencies

Module depends on: F15.S04.M03, F15.S03.M01, F15.S01.M02, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
