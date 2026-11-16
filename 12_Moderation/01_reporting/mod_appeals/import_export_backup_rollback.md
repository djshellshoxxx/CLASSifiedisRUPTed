# PS-092-10 — Import, export, backup and rollback: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-10.R01** The vault export contains the user's appeals and signed decisions, and the export is the primary backup.
- **PS-092-10.R02** Import verifies signatures of decisions and receipts; unsent or pending appeals are not re-sent automatically.
- **PS-092-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section moderation.appeals in classrup-export/v1: appeal, attachments hashes, receipts and decision statements; relay appeal packets for the appellant include the evidence snapshot the decision relied on.
- **import:** Decided appeals import as read-only history after signature verification; pending appeals import as withdrawn history to avoid duplicates; conflicting IDs are rejected.
- **backup:** Vault export is the backup; relay SQLite backup (CTR-IOX-001 IOX-3) holds relay-side appeal records, which are not user-owned private data.
- **migration rollback:** Additive fields only in v1; rollback is safe because older readers ignore new optional fields and unknown outcomes display as 'decided'.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T14 | integration | PS-092-10.R01, PS-092-10.R02, PS-092-10.R03 | export appeal packet, import into fresh vault, restore relay backup | signed decision verifies after round trip; imported pending appeals are not re-sent |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
