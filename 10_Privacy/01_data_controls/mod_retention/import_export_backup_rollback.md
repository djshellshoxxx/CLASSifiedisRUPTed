# PS-079-10 — Import, export, backup and rollback: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-10.R01** The vault export includes the principal's retention policy rows in the section privacy.retention; legal holds are never exported to users.
- **PS-079-10.R02** Relay backups include holds and policies (IOX-3); after restore, holds are re-evaluated before any sweep runs.
- **PS-079-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section privacy.retention in classrup-export/v1: the vault's RetentionPolicy rows (schema classrup.privacy.retention_policy/v1). Legal holds are operator records and are excluded from user exports.
- **import:** Policies import as user-source rows clamped to bounds, except jurisdiction and default rows, which are re-derived by a jurisdiction refresh from the selection that F18.S01.M01 restores, keeping the imported priorDurationDays and looserFrom when the same ProfileRef and version are restored; foreign hold records are never imported; the high-water clock is not imported, so the first sweep after an import takes the import time as its high-water clock.
- **backup:** Relay SQLite backup (CTR-IOX-001 IOX-3) covers holds and policies; after a restore the relay refuses to sweep until hold records are loaded and verified, and purge jobs missed during downtime are not replayed for held subjects.
- **migration rollback:** Additive fields only in v1; rollback is safe because older readers ignore new optional fields; class bounds are never widened by a migration.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T16 | integration | PS-079-10.R01, PS-079-10.R02, PS-079-10.R03 | export vault policies, import into fresh vault, restore relay from backup, roll back one release | policies round-trip; holds restore with status; unknown hold subjects stay sealed |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
