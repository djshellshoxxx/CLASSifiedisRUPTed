# PS-124-10 — Import, export, backup and rollback: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-10.R01** The vault export includes vault-scope FlagSetting records as the section platform.flags, so a restored vault keeps its configuration (CTR-IOX-001 IOX-1, IOX-6).
- **PS-124-10.R02** Relay-scope settings are part of the relay database and its backups (IOX-3, IOX-7), and an operator may export them as relay configuration.
- **PS-124-10.R03** Import validates keys against the registry and the dependency rule; violating or unknown entries are skipped and reported in the dry-run.

## Specification

- **export:** Section platform.flags in classrup-export/v1, one line per vault-scope FlagSetting (schema classrup.platform.flag_setting/v1, classified P3); relay operators can run relay flags export --tenant <id> for relay scope.
- **import:** Import applies entries in dependency order with tenantId replaced by the importing vault's vaultId; entries for unknown or FUTURE modules and entries that would violate FLG-2 are skipped and listed in the dry-run report, never partially applied.
- **backup:** Vault scope: the vault export is the backup. Relay scope: relay SQLite backup (CTR-IOX-001 IOX-3).
- **migration rollback:** Additive fields only in v1; rollback is safe because new optional fields are ignored by older readers; unknown keys from a newer registry evaluate off and are preserved. Vault rows written with the former constant tenantId are rewritten to the vaultId by a one-time data migration through F15.S02.M03.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T18 | integration | PS-124-10.R01, PS-124-10.R02, PS-124-10.R03 | export vault, import into fresh vault, restore relay from backup, roll back one release | vault flags round-trip with the new vault's tenantId; relay flags restored; older reader ignores new optional fields |

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
