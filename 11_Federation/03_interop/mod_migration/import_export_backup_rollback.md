# PS-090-10 — Import, export, backup and rollback: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-10.R01** A vault export carries the data needed to restart on another relay, namely public records, tombstones and the move history, and never private keys.
- **PS-090-10.R02** Import on a new relay is performed by sending the exported statements through the normal verified inbox path, so no special trust is created.
- **PS-090-10.R03** Schema changes follow expand/contract and v1 stays readable for 180 days.

## Specification

- **export:** Section federation.migrations in classrup-export/v1 (schema classrup.federation.migration/v1) plus the vault's own signed envelopes and tombstones from F11.S01.M02.
- **import:** Own envelopes and tombstones are re-verified and queued to the selected relay; observed moves are re-verified and applied only if still within their redirect period.
- **backup:** Vault export is the primary backup (IOX-6); relay data including redirects is covered by relay SQLite backup (CTR-IOX-001 IOX-3).
- **migration rollback:** Additive fields only in v1; rollback is safe because pending moves can be cancelled and effective ones stay valid as signed statements; the redirect lookup can be disabled with the F11 flag without data loss.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T19 | integration | PS-090-10.R01, PS-090-10.R02, PS-090-10.R03 | export vault, import into fresh vault on R2, restore backup | records round trip; imported records re-verified; move state preserved |

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S03.M01, F07.S02.M01, F10.S01.M04, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
