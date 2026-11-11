# PS-046-10 — Import, export, backup and rollback: Search query

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M02 Search query](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/query` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-046-10.R01** The vault export contains saved searches as section discovery.saved_searches in classrup-export/v1.
- **PS-046-10.R02** Import validates schema version and filters, resets match history so no stale alerts fire, and caps the total at 25.
- **PS-046-10.R03** Schema changes to SavedSearch follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section discovery.saved_searches in classrup-export/v1 through the registered ExportSectionPort, one line per SavedSearch (schema classrup.discovery.saved_search/v1), P3 and included only in the user's own export.
- **import:** Searches import as paused with empty matchedDocIds and watermarkAt set to the import time; searches beyond the 25 cap are reported in the dry-run and skipped; id collisions with different content are rejected; v1 records with centerCell5 are read as centerCell.
- **backup:** The vault export is the primary backup (IOX-6); relays hold no saved searches, so relay backups (IOX-7) contain none.
- **migration rollback:** Additive optional fields only in v1 (watermarkAt defaults to updatedAt for older records); older releases ignore new fields; rollback is safe because the index and queries are derived.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-046-09.T16 | integration | PS-046-10.R01, PS-046-10.R02, PS-046-10.R03 | export then import saved searches into a fresh vault | records round-trip; imported searches paused with matchedDocIds reset and watermarkAt at import; conflicting ids rejected |

## Dependencies

Module depends on: F06.S01.M01, F06.S01.M03, F06.S02.M01, F06.S02.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M02, F11.S01.M03, F12.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
