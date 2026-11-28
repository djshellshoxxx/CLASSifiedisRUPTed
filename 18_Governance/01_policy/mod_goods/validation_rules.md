# PS-144-02 — Validation rules: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-02.R01** Authoring commands validate names, depth, uniqueness and limits before a change is staged.
- **PS-144-02.R02** Applying a pack validates the entire pack atomically: one structurally invalid category rejects the whole pack, while a change whose required decision does not verify keeps that record at its previous state, held with GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED.
- **PS-144-02.R03** Every violation maps to one stable error code.
- **PS-144-02.R04** Receiving vaults verify through F18.S02.M01 every restricted-flag change and retirement that differs from their applied snapshot, at the anchored activation time, so a publisher cannot skip the proposal requirement.
- **PS-144-02.R05** Category ids are unique across publishers in a vault, and a category may be retired only after it was deprecated for at least 30 days.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | key matches [a-z0-9_]{2,40} and is unique for the publisher | VALIDATION_FAILED |
| V02 | names include en and every name is 1..60 code points without control characters | VALIDATION_FAILED |
| V03 | depth <= 4, parent exists in the pack and the parent chain has no cycle | GOVERNANCE_CATEGORY_TREE_INVALID |
| V04 | parent has fewer than 50 non-retired children; pack has at most 2000 categories | GOVERNANCE_CATEGORY_TREE_INVALID |
| V05 | retire requires mergedInto to a non-retired category in the pack | GOVERNANCE_CATEGORY_TREE_INVALID |
| V06 | a restricted change or retirement requires proposalId; in the publisher vault, and in receiving vaults for every such change against the applied snapshot, governance.policy_proposal.verify returns valid for (publisherId, targetType category, [categoryId], changeDigest = sha256-JCS({categoryId: {restricted, restrictedReasonKey, status, mergedInto}}), asOf = anchored activation time of the pack version that made the change) | GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED |
| V07 | pack signature verifies, the signing key is active (F07 key status through the F11 intake path) and the publisher is trusted for scope taxonomy and not paused (F18.S02.M01 trusted_publisher.check) | GOVERNANCE_CATEGORY_PACK_UNTRUSTED |
| V08 | pack version is greater than the applied version and the pack is a full snapshot | GOVERNANCE_CATEGORY_PACK_STALE |
| V09 | ids present in the applied pack keep their key and publisher in the new pack (no id reuse) | GOVERNANCE_CATEGORY_TREE_INVALID |
| V10 | pack schema major version is supported | UNSUPPORTED_SCHEMA_VERSION |
| V11 | no category id in the pack already exists in the vault under a different publisherId | GOVERNANCE_CATEGORY_TREE_INVALID |
| V12 | pack size <= 1 MiB, checked before parsing into storage | PAYLOAD_TOO_LARGE |
| V13 | a category becomes retired only from deprecated, and its deprecation is anchored at least 30 days before the retiring pack's anchored time | GOVERNANCE_CATEGORY_TREE_INVALID |
| V14 | approvals list every changed record that needs one, with the decision envelope and receipt or a decisionCid fetchable from the publisher's relay; a decision already recorded for an earlier version of the same category cannot approve a later one | GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T01 | unit | PS-144-01.R01, PS-144-01.R02, PS-144-02.R01, PS-144-02.R02 | create category with names and key | stable id, key unique for publisher, en name required |
| TEST-PS-144-09.T02 | unit | PS-144-02.R03 | violate each rule V01-V14 | documented error code returned and nothing staged or applied |
| TEST-PS-144-09.T03 | property | PS-144-02.R02 | random trees and moves | depth <= 4, no cycles, child limit holds, restricted implies reason key |
| TEST-PS-144-09.T17 | abuse | PS-144-02.R04, PS-144-01.R04, PS-144-07.R03 | PK1 flips restricted on C1 without a proposal and releases to U; same flip with D1; owner refuses; owner applies | first held with GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED and C1 unchanged; second held for owner review; refuse leaves C1 unchanged; apply sets the flag |
| TEST-PS-144-09.T18 | abuse | PS-144-02.R05 | PK2 pack reuses a PK1 category id; pack retires a category deprecated 10 days earlier; pack retires an active category | all rejected with GOVERNANCE_CATEGORY_TREE_INVALID |
| TEST-PS-144-09.T19 | integration | PS-144-04.R04, PS-144-02.R04 | F applies the bundled seed pack offline; U offline 45 days applies the next pack; F applies a snapshot whose restricted change was approved a year ago | seed applied with provenance bundled; both packs apply because asOf comes from anchors or the claimed release time, not the vault clock |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
