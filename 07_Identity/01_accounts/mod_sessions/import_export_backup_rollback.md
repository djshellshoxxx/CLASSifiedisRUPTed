# PS-054-10 — Import, export, backup and rollback: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-10.R01** Sessions are never exported or imported; after an import the user unlocks and re-authenticates to relays.
- **PS-054-10.R02** A relay backup restores token hashes and expiry only; tokens remain valid until their original expiry, and an operator can revoke all with one command.
- **PS-054-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Not exported: sessions and challenges are ephemeral; the vault export (IOX-6) excludes them.
- **import:** Nothing imported; the user signs in again to each relay with their device key.
- **backup:** Relay SQLite backup (IOX-3, IOX-7) includes token hashes; the operator can revoke all sessions of a relay with the operator tool after a restore.
- **migration rollback:** Additive fields only in v1; rollback is redeploying the previous release, and sessions stay valid because hashes and expiries keep the same format.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T15 | integration | PS-054-10.R01, PS-054-10.R02, PS-054-10.R03 | vault export and relay backup restore | no tokens or vault key in exports; restored relay has hashes only and sessions expire naturally |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
