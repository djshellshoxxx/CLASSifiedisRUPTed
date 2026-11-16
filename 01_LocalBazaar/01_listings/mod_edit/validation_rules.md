# PS-003-02 — Validation rules: Listing editing

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M02 Listing editing](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/edit` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-003-02.R01** Edit input is a strict patch; fields that never change (kind, ownerId, status) are rejected.
- **PS-003-02.R02** Published listings are re-checked against the active prohibited-item rules before the edit is stored.
- **PS-003-02.R03** Every rule violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | patch contains only title, description, categoryId, condition, mediaRefs, tags, regionCell | VALIDATION_FAILED |
| V02 | patch field limits equal creation limits in F01.S01.M01 (title 3..120, description <= 5000, mediaRefs <= 10) | VALIDATION_FAILED |
| V03 | listing status is draft, published or unpublished | CONFLICT_STATE |
| V04 | expectedRevision equals the current Listing.revision | CONFLICT_REVISION |
| V05 | published or unpublished listing has fewer than 100 revisions | BAZAAR_EDIT_REVISION_LIMIT |
| V06 | prohibited-item evaluation of the edited text and category returns allow or allow_with_notice | BAZAAR_EDIT_POLICY_BLOCKED |
| V07 | patch is not empty after removing unchanged values | VALIDATION_FAILED |
| V08 | regionCell, if present, has length 4 or 5 | BAZAAR_EDIT_POLICY_BLOCKED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-003-09.T02 | property | PS-003-01.R03, PS-003-02.R01 | random patches | material equals intersection of changedFields with price, condition, categoryId; ownerId and kind patches rejected |
| TEST-PS-003-09.T03 | unit | PS-003-02.R02, PS-003-02.R03 | each rule V01-V08 violated | documented error code returned; listing unchanged |
| TEST-PS-003-09.T14 | abuse | PS-003-07.R03, PS-003-02.R03 | 21 edits within an hour on one listing | 21st returns RATE_LIMITED |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M02, F18.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
