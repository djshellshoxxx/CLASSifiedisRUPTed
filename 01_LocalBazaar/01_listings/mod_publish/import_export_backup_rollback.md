# PS-004-10 — Import, export, backup and rollback: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-10.R01** The user export contains all PublicationRecords and the signed statements they reference.
- **PS-004-10.R02** Import verifies statement signatures and owner; active publications are imported inactive and must be re-signed and re-sent explicitly.
- **PS-004-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section bazaar.publications in classrup-export/v1, one line per PublicationRecord, followed by the referenced statements as separate lines of schema classrup.bazaar.listing/v1.
- **import:** Signature and cid verified; records with invalid signatures are quarantined; imported active records become status ended with endReason owner and the UI offers Publish again, so stale promises are never revived silently.
- **backup:** Vault export is the primary backup (IOX-6); relays hold only copies of public projections under their own policy (IOX-7).
- **migration rollback:** Additive fields only in v1; rollback is by reinstalling the previous release; statements already sent remain valid because their schema is unchanged.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T18 | integration | PS-004-10.R01, PS-004-10.R02, PS-004-10.R03 | export, import to fresh vault, import with wrong owner | records round-trip; active publications import as unpublished-pending-resign; foreign owner read-only |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F09.S01.M01, F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
