# PS-094-10 — Import, export, backup and rollback: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-10.R01** The vault export contains the user's reports and advisory subscriptions, and the export is the primary backup (IOX-6).
- **PS-094-10.R02** Import validates IDs, schema version and signatures of stored receipts; open reports are not re-sent automatically.
- **PS-094-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section moderation.reports in classrup-export/v1 through ExportSectionPort: one line per report (reportId, relayId, targetType, reasonCode, disclosure, syncState, status, outcome, receipts, link and outcome statements); details included because it is the user's own data, message keys never included; section moderation.advisory lists subscriptions; section moderation.hides lists LocalHide rows.
- **import:** LocalHide rows import as-is for the importing principal (duplicates by target or author skipped). Reports import as read-only history with status withdrawn unless a verified relay link statement shows an open case, in which case they import as linked history; no statements are re-sent; conflicting IDs are rejected.
- **backup:** Vault export is the backup; relay SQLite backups (CTR-IOX-001 IOX-3) hold only report headers, sealed bodies and receipts, and losing a relay loses no vault data.
- **migration rollback:** Additive fields only in v1; rollback is safe because older readers ignore new optional fields; target type additions are tolerated as other by older readers; the 12 reason codes are frozen within v1 because F18.S02.M02 binds them, so a new code needs a v2 report schema, and older readers show a v2 code they cannot read as other.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T15 | integration | PS-094-10.R01, PS-094-10.R02, PS-094-10.R03 | export, restore into fresh vault, import an open report and a receipt with a broken signature; read a v1 record carrying an unknown reason code with the previous reader | own reports round-trip; imported open reports become withdrawn and nothing is re-sent; the broken receipt is rejected; the unknown reason displays as other |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F12.S03.M03, F07.S02.M02, F08.S01.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
