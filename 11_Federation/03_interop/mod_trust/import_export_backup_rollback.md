# PS-091-10 — Import, export, backup and rollback: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-10.R01** A vault export contains the user's selected relays without secrets; an operator export contains peers with keys and quotas.
- **PS-091-10.R02** Imported peers never become active automatically; they import as proposed or suspended and need fresh opt-in confirmation.
- **PS-091-10.R03** Schema changes follow expand/contract and v1 stays readable for 180 days.

## Specification

- **export:** Section federation.peers in classrup-export/v1, one line per Peer (schema classrup.federation.peer/v1), without health history.
- **import:** Active and suspended peers import as suspended with reason operator until a human reinstates them after re-checking the fingerprint; proposed peers import as proposed.
- **backup:** Vault export is the primary backup (IOX-6); relay peers are covered by relay SQLite backup (CTR-IOX-001 IOX-3).
- **migration rollback:** Additive fields only in v1; rollback is safe because unknown optional fields are ignored and pinned keys are unchanged.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T17 | integration | PS-091-10.R01, PS-091-10.R02, PS-091-10.R03 | export peers, import into fresh relay, restore backup | peers import as proposed or suspended and require re-confirmation; no active peer is created by import |

## Dependencies

Module depends on: F11.S01.M03, F15.S04.M02, F07.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
