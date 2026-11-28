# PS-001-10 — Import, export, backup and rollback: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-10.R01** The user export contains all ArchiveRecords of own listings.
- **PS-001-10.R02** Import keeps restoreUntil and purgeAt as exported and immediately purges records already past purgeAt.
- **PS-001-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section bazaar.archive_records in classrup-export/v1, one line per ArchiveRecord (schema classrup.bazaar.archive_record/v1).
- **import:** Records whose listing is absent are held read-only; records past purgeAt are imported as purged without content (evidence fields kept until evidenceUntil); closed references stay unverified.
- **backup:** Vault export is the primary backup (IOX-6); the app warns after 30 days without export.
- **migration rollback:** Additive optional fields only in v1; rollback is by reinstalling the previous release, which ignores unknown fields and the deferred and superseded statuses as closed records.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T14 | integration | PS-001-10.R01, PS-001-10.R02, PS-001-10.R03 | export, import to fresh vault, import record with restoreUntil in the past | records round-trip; stale archived record imported as purged candidate |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, F01.S04.M01, F01.S04.M02, F09.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
