# PS-045-10 — Import, export, backup and rollback: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-10.R01** The index is derived data; it is neither exported as its own section nor imported and is regenerated from retained signed projections.
- **PS-045-10.R02** Restoring a vault from export or a relay from backup is followed by a rebuild so the index matches restored sources.
- **PS-045-10.R03** Schema changes to the FTS tokenizer or columns are applied by building a new shadow index and swapping, never in place.
- **PS-045-10.R04** Rebuild copies firstSeenAt and authorFirstSeenAt from the live table keyed by source key and authorDid, and restore takes them from the kernel provenance receivedAt (FED-6), so neither makes an author look new again.

## Specification

- **export:** No export section: SearchDocument is derived from signed projections that already travel in the user's listings and retained-records sections (CTR-IOX-001 IOX-5, IOX-6); the P3 view table is not exported.
- **import:** Nothing is imported directly; imported signed projections are verified by F11.S01.M02 and indexed through federation.record.accepted with origin imported and firstSeenAt from their provenance receivedAt.
- **backup:** Vault export is the primary backup (IOX-6); a relay backup follows IOX-3 and IOX-7 and includes stubs and author anchors; after restore the index is rebuilt with scope all.
- **migration rollback:** Tokenizer or column changes (such as geo_cell replacing geo_cell5) use a shadow FTS table and swap; rollback is redeploying the previous release and running rebuild (at most 30 s in a vault, 10 min per 100 000 documents on a relay).

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T16 | integration | PS-045-10.R01, PS-045-10.R02, PS-045-10.R03 | restore of vault from export then rebuild; relay backup restore then rebuild | index equals expectation derived from retained signed projections |
| TEST-PS-045-09.T25 | integration | PS-045-10.R04 | rebuild after 40 days and restore from export with kernel provenance | firstSeenAt and authorFirstSeenAt identical to the live table after rebuild and equal to provenance receivedAt after restore; no author counts as new |

## Dependencies

Module depends on: F06.S02.M01, F01.S01.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F09.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
