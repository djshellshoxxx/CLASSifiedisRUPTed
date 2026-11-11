# PS-129-10 — Import, export, backup and rollback: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-10.R01** Vault export contains own and counterparty key records with revocation statements, freshness and the revoked-key set, and the relay export contains relay-owned and peer keys, the revoked-key set and the signed revocation list.
- **PS-129-10.R02** Import re-verifies every statement signature, re-derives user-key status from the imported identity documents through F07.S02.M01, and resets freshness of imported counterparty keys to unknown so stale knowledge is never trusted.
- **PS-129-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section security.keys in classrup-export/v1: KeyRecord rows, the revoked-key set and the verified revocation statements; relay export adds the signed revocation list and its head history.
- **import:** Statements are re-verified; revoked stays revoked and the revoked-key set is merged as a union; unknown signers are refused; freshnessCheckedAt of imported counterparty keys is set to import time with class unknown until refreshed.
- **backup:** Vault export is the primary backup (IOX-6); relay SQLite backup (CTR-IOX-001 IOX-3) covers relay records; restore triggers an immediate revocation list refresh from all sources, and the restored list head keeps its listSeq so the next head is greater.
- **migration rollback:** Additive fields only in v1; rollback is safe because older readers ignore new optional fields and treat unknown statuses as revoked (fail closed).

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T15 | integration | PS-129-10.R01, PS-129-10.R02, PS-129-10.R03 | export key records, import into a fresh vault, restore relay backup | statuses, revoked-key set and statements preserved; imported counterparty freshness reset to unknown |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
