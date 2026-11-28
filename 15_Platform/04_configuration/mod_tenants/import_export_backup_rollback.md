# PS-125-10 — Import, export, backup and rollback: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-10.R01** The vault export includes LocalSettings as the section platform.local_settings (CTR-IOX-001 IOX-1, IOX-6); tenants are relay data and are not part of any user export.
- **PS-125-10.R02** Relay tenant records and their signed configuration statements are covered by relay backups (IOX-3, IOX-7) and by an operator configuration export.
- **PS-125-10.R03** Import of LocalSettings validates the schema, clamps limits to platform maximums, replaces an invalid a11yMotion or moneyDisplay with its default and keeps the importing vault's own vaultId; operator import of tenants rejects conflicting slugs.

## Specification

- **export:** Vault: section platform.local_settings in classrup-export/v1 (schema classrup.platform.local_settings/v1, P3). Relay: relay tenant export --tenant <id> as JSON Lines of Tenant and its configuration statements (operator configuration export, not a user export); role assignments are exported by F16.S01.M01.
- **import:** Vault: LocalSettings preferences replace the current ones after dry-run confirmation; an a11yMotion other than system or reduced becomes system and a moneyDisplay other than symbol, code or name becomes symbol; vaultId is never imported. Relay: relay tenant import creates tenants with their IDs, rejects conflicting slugs or IDs, always imports as suspended until an operator resumes, and requires the operator assignments to exist in F16 first.
- **backup:** Relay tenants: relay SQLite backup (CTR-IOX-001 IOX-3). Vault settings: the vault export is the backup.
- **migration rollback:** Expand/contract: the former operatorKeys column is migrated into F16.S01.M01 RoleAssignments with scope tenant:<id> and expiry 365 days by a one-time data migration, then ignored; the former provisioning status and the requestRatePerMinutePerKey and maxRegisteredDevices limits are dropped (rate policy is F12.S03.M03); the former string jurisdictionProfile becomes ProfileRef { code: <former string> } in two steps (expand: one release reads both forms and still writes the string; contract: the next release writes only ProfileRef and re-issues each tenant's signed configuration), so a rollback by one release still reads every stored and signed configuration. Rollback to the previous release is safe because new optional fields are ignored by older readers and the expand release reads the ProfileRef form. Restore always creates a new instance (IOX-4) with tenants intact.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T17 | integration | PS-125-10.R01, PS-125-10.R02, PS-125-10.R03, PS-125-01.R03 | export vault with LocalSettings, import into fresh vault; restore relay from backup; roll back one release | LocalSettings round-trip while the fresh vault keeps its own vaultId; tenants and statements restored with same IDs; old reader ignores new optional fields |
| TEST-PS-125-09.T29 | unit | PS-125-01.R06, PS-125-02.R05, PS-125-10.R03 | get on a new vault; update with a11yMotion reduced and moneyDisplay code; update with a11yMotion fast; import a record with moneyDisplay emoji and a11yMotion reduced | defaults system and symbol; the values stored and returned; VALIDATION_FAILED for fast; the import keeps reduced and replaces emoji with symbol |

## Dependencies

Module depends on: F15.S02.M03, F15.S02.M01, F15.S04.M01, F16.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
