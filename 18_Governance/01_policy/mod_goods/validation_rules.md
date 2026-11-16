# PS-144-02 — Validation rules: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-02.R01** Authoring commands validate names, depth, uniqueness and limits before a change is staged.
- **PS-144-02.R02** Applying a pack validates the entire pack atomically; one invalid category rejects the whole pack.
- **PS-144-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | key matches [a-z0-9_]{2,40} and is unique for the publisher | VALIDATION_FAILED |
| V02 | names include en and every name is 1..60 code points without control characters | VALIDATION_FAILED |
| V03 | depth <= 4, parent exists in the pack and the parent chain has no cycle | GOVERNANCE_CATEGORY_TREE_INVALID |
| V04 | parent has fewer than 50 non-retired children; pack has at most 2000 categories | GOVERNANCE_CATEGORY_TREE_INVALID |
| V05 | retire requires mergedInto to a non-retired category in the pack | GOVERNANCE_CATEGORY_TREE_INVALID |
| V06 | changing restricted requires proposalId verified as approved for this category by F18.S02.M01 | GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED |
| V07 | pack signature verifies and publisher is in the vault's trusted publishers | GOVERNANCE_CATEGORY_PACK_UNTRUSTED |
| V08 | pack version is greater than the applied version and the pack is a full snapshot | GOVERNANCE_CATEGORY_PACK_STALE |
| V09 | ids present in the applied pack keep their key and publisher in the new pack (no id reuse) | GOVERNANCE_CATEGORY_TREE_INVALID |
| V10 | pack size <= 1 MiB and schema version supported | UNSUPPORTED_SCHEMA_VERSION |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T01 | unit | PS-144-01.R01, PS-144-01.R02, PS-144-02.R01, PS-144-02.R02 | create category with names and key | stable id, key unique for publisher, en name required |
| TEST-PS-144-09.T02 | unit | PS-144-02.R03 | violate each rule V01-V10 | documented error code returned and nothing staged or applied |
| TEST-PS-144-09.T03 | property | PS-144-01.R03, PS-144-02.R02 | random trees and moves | depth <= 4, no cycles, child limit holds, restricted implies reason key |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
