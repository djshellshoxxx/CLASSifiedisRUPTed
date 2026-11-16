# PS-099-10 — Import, export, backup and rollback: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-10.R01** Rate buckets are ephemeral and excluded from exports and backups; policies are exported with relay configuration.
- **PS-099-10.R02** Policy import validates all bounds and locked fail modes before applying.
- **PS-099-10.R03** Policy schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section moderation.ratepolicy in the relay configuration export and in the vault export for local throttles; buckets not exported.
- **import:** Policies import after bounds validation; invalid rows are rejected with VALIDATION_FAILED and the rest are applied; local throttle import affects only the importing vault.
- **backup:** Policies covered by relay SQLite backup (CTR-IOX-001 IOX-3); buckets excluded and recreated empty after restore.
- **migration rollback:** Additive fields only in v1; rollback is safe because older readers ignore new optional fields and unknown classes use the default policy.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T14 | integration | PS-099-10.R01, PS-099-10.R02, PS-099-10.R03 | export policy, import, restore backup | policies round-trip; buckets absent and recreated empty |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
