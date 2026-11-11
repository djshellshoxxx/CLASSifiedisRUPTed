# PS-094-10 — Import, export, backup and rollback: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-10.R01** The vault export contains the user's reports and advisory subscriptions, and the export is the primary backup (IOX-6).
- **PS-094-10.R02** Import validates IDs, schema version and signatures of stored receipts; open reports are not re-sent automatically.
- **PS-094-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section moderation.reports in classrup-export/v1: one line per report (reportId, relayId, targetType, reasonCode, syncState, status, outcome, receipts); details included because it is the user's own data; section moderation.advisory lists subscriptions.
- **import:** Reports import as read-only history with status withdrawn unless a verified relay receipt shows an open case, in which case they import as linked history; no statements are re-sent; conflicting IDs are rejected.
- **backup:** Vault export is the backup; relay SQLite backups (CTR-IOX-001 IOX-3) hold only sealed report envelopes and receipts and losing a relay loses no vault data.
- **migration rollback:** Additive fields only in v1; rollback is safe because older readers ignore new optional fields; reason code additions are tolerated as other by older readers.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T15 | integration | PS-094-07.R01, PS-094-07.R02, PS-094-10.R01, PS-094-10.R02, PS-094-10.R03 | export, restore into fresh vault, import imported open report | own reports round-trip; imported open reports become withdrawn; details stay sealed |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
