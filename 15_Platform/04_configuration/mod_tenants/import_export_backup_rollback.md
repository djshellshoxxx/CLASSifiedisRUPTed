# PS-125-10 — Import, export, backup and rollback: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-10.R01** The vault export includes LocalSettings as the section platform.local_settings (CTR-IOX-001 IOX-1, IOX-6); tenants are relay data and are not part of any user export.
- **PS-125-10.R02** Relay tenant records are covered by relay backups (IOX-3, IOX-7) and by an operator configuration export.
- **PS-125-10.R03** Import of LocalSettings validates the schema and clamps limits to platform maximums; operator import of tenants rejects conflicting slugs.

## Specification

- **export:** Vault: section platform.local_settings in classrup-export/v1 (schema classrup.platform.local_settings/v1). Relay: relay tenant export --tenant <id> as JSON Lines of Tenant (operator configuration export, not a user export).
- **import:** Vault: LocalSettings replace the current record after dry-run confirmation. Relay: relay tenant import creates tenants with their IDs, rejects conflicting slugs or IDs, and always imports as suspended until an operator resumes.
- **backup:** Relay tenants: relay SQLite backup (CTR-IOX-001 IOX-3). Vault settings: the vault export is the backup.
- **migration rollback:** Additive fields only in v1; rollback to the previous release is safe because new optional fields and limits are ignored by older readers. Restore always creates a new instance (IOX-4) with tenants intact.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T17 | integration | PS-125-10.R01, PS-125-10.R02, PS-125-10.R03 | export vault with LocalSettings, import into fresh vault; restore relay from backup; roll back one release | LocalSettings round-trip; tenants restored with same IDs; old reader ignores new optional fields |

## Dependencies

Module depends on: F15.S02.M03, F15.S04.M01, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
