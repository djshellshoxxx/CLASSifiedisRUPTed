# PS-144-04 — Commands, queries and events: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-04.R01** create, update, move and set_status are authoring commands that run in the publisher's vault and stage a change set; release_pack signs the full taxonomy as classrup.governance.taxonomy_pack/v1 with its approvals and queues it to the publisher's relays.
- **PS-144-04.R02** apply_pack is a vault command available in every vault: it verifies the pack, the publisher's trust and every required decision, applies the result atomically and emits one governance.category.changed event per changed category; in a user vault packs from untrusted or paused publishers, and packs that change restricted flags or retire categories, are held in the F18.S02.M01 pending inbox for the owner.
- **PS-144-04.R03** A relay serves the latest pack with its receipt publicly and read-only through relay_latest; relay_upload, accepted only from the relay's operator key, verifies the pack, applies it as the relay's hosting taxonomy and emits governance.category.changed relay-locally.
- **PS-144-04.R04** The bundled seed pack ships signed by the release-pinned project publisher key; it is approved by the release review (F17 release gates), applied without decisions on first start with provenance bundled, and later changes to it follow the normal proposal path.
- **PS-144-04.R05** Statement types of this module are registered in the F11.S01.M01 registry with audience, signer role, role resolution and maxAge (N2).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `governance.category.create` | governance.category.author | [vault-local, publisher] { key, parentId?, names, restricted?, restrictedReasonKey?, proposalId?, sortOrder? } | { categoryId, revision: 1, stagedInPack } | VALIDATION_FAILED, NOT_FOUND, GOVERNANCE_CATEGORY_TREE_INVALID, GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED |  | yes (Idempotency-Key) |
| `governance.category.update` | governance.category.author | [vault-local, publisher] { categoryId, expectedRevision, names?, restricted?, restrictedReasonKey?, proposalId?, sortOrder? } | { categoryId, revision } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED |  | yes (Idempotency-Key) |
| `governance.category.move` | governance.category.author | [vault-local, publisher] { categoryId, expectedRevision, newParentId?, sortOrder? } | { categoryId, revision, depth } | NOT_FOUND, CONFLICT_REVISION, GOVERNANCE_CATEGORY_TREE_INVALID |  | yes (Idempotency-Key) |
| `governance.category.set_status` | governance.category.author | [vault-local, publisher] { categoryId, expectedRevision, to: deprecated\|active\|retired, mergedInto?, proposalId? (required for retired) } | { categoryId, revision, status } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_CATEGORY_TREE_INVALID, GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED |  | yes (Idempotency-Key) |
| `governance.category.release_pack` | governance.category.release | [vault-local, publisher + statement classrup.governance.taxonomy_pack/v1] { expectedPackVersion, changelogEntry, relayIds[] } | { packVersion, packCid, categoryCount, approvalsCount, syncState: prepared } | CONFLICT_REVISION, GOVERNANCE_CATEGORY_TREE_INVALID, GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED, PAYLOAD_TOO_LARGE, PRECONDITION_FAILED | governance.category.changed | yes (Idempotency-Key) |
| `governance.category.apply_pack` | governance.category.apply | [vault-local, inbound statement or PendingApplyPort] { envelope, receipt?, provenance, ownerConfirmed?: boolean (only from the pending inbox Apply action) } | { applied: boolean, packVersion, changedCategoryIds[], heldCategoryIds[], pendingId?, pendingReason?: untrusted_publisher\|paused_publisher\|owner_review\|decision_unavailable } | VALIDATION_FAILED, GOVERNANCE_CATEGORY_PACK_UNTRUSTED, GOVERNANCE_CATEGORY_PACK_STALE, GOVERNANCE_CATEGORY_TREE_INVALID, GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED, UNSUPPORTED_SCHEMA_VERSION, PAYLOAD_TOO_LARGE | governance.category.changed | yes (Idempotency-Key) |
| `governance.category.relay_upload` | governance.category.relay_publish | [relay command] { envelope } | { packVersion, packCid, relayReceipt: classrup.platform.relay_receipt/v1 } | VALIDATION_FAILED, FORBIDDEN, PAYLOAD_TOO_LARGE, RATE_LIMITED, GOVERNANCE_CATEGORY_PACK_STALE, GOVERNANCE_CATEGORY_TREE_INVALID, GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED | governance.category.changed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `governance.category.get` | governance.category.read | { categoryId } | { category: Category } | NOT_FOUND |
| `governance.category.list_children` | governance.category.read | { parentId?, includeDeprecated?: boolean, locale? } | { items: Category[] } | NOT_FOUND |
| `governance.category.tree` | governance.category.read | { publisherId? (default: pinned taxonomy publisher), locale?, includeDeprecated? } | { publisherId, packVersion, packCid, items: Category[] } | VALIDATION_FAILED |
| `governance.category.resolve` | governance.category.read | { categoryId } | { categoryId, publisherId, resolvedId, path: uuidv7[], restricted } | NOT_FOUND |
| `governance.category.relay_latest` | governance.category.relay_read | [relay query] { sinceVersion? } | { envelope, receipt } of the relay's current pack, served unchanged, or notModified | NOT_FOUND, RATE_LIMITED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `governance.category.changed` | P0 | { categoryId, publisherId, change: created\|renamed\|moved\|restricted_changed\|deprecated\|reactivated\|retired, restricted, mergedInto?, proposalId?, packVersion, packCid, scope: vault\|relay } — vault-local, or relay-local after relay_upload (scope relay) |

### Events consumed

| Type | Effect |
|---|---|
| `governance.policy_proposal.decided` | for outcome approved, retry held category changes whose approvals cite this proposal; outcome conflicted keeps them held with reason decision_unavailable |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| GOVERNANCE_CATEGORY_TREE_INVALID | 422 | no | depth over 4, cycle, child limit, merge target, id reuse, cross-publisher id collision or premature retirement |
| GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED | 412 | no | restricted-flag change or retirement needs a verified approved policy decision |
| GOVERNANCE_CATEGORY_PACK_UNTRUSTED | 403 | no | pack publisher is not trusted for scope taxonomy, trust is paused or the signing key is not active |
| GOVERNANCE_CATEGORY_PACK_STALE | 409 | no | pack version is not newer than the applied version or is not a full snapshot |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles (N2, registered in F11.S01.M01): classrup.governance.taxonomy_pack/v1 - audience public; signer role publisher (principal: author = payload.publisherId, ext.signerKey active in the publisher's portable document per F07.S02.M01 key_status at first sight; revoked keys are quarantined); maxAge none (versioned configuration, superseded by version). The bundled seed pack is accepted against the project publisher key pinned in the release instead of a trust entry. The vault acts only on packs its receiving path accepted. F07.S02.M01 is not listed in depends_on because it already reaches this module through F10.S01.M02 -> F18.S01.M01 (FLG-2); its key status is applied by the F11 intake path and injected at the composition root. This module registers apply for classrup.governance.taxonomy_pack/v1 in the F18.S02.M01 PendingApplyPort.


### Example

```
publisher vault: dispatch("governance.category.create", { "key": "road_bikes", "parentId": "0192f3a4-1111-7000-8000-0000000000c1",
  "names": { "en": "Road bikes", "de": "Rennraeder" } }, idempotencyKey: "0192f3a4-0000-7000-8000-000000000091")
=> { "categoryId": "0192f3b1-...", "revision": 1, "stagedInPack": 12 }
dispatch("governance.category.release_pack", { "expectedPackVersion": 11, "changelogEntry": "Add road bikes", "relayIds": ["relay:berlin.example"] })
=> { "packVersion": 12, "packCid": "sha256-Zm9v...", "categoryCount": 301, "approvalsCount": 0, "syncState": "prepared" }
user vault: apply_pack => { "applied": true, "packVersion": 12, "changedCategoryIds": ["0192f3b1-..."], "heldCategoryIds": [] } and event governance.category.changed (created)
user vault, pack 13 flips a restricted flag: apply_pack => { "applied": false, "pendingId": "0192f3c0-...", "pendingReason": "owner_review" } until the owner applies it
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T06 | contract | PS-144-04.R01, PS-144-04.R02, PS-144-04.R05, PS-144-09.R02 | release and apply | pack validates against classrup.governance.taxonomy_pack/v1 and its F11.S01.M01 registry row, signature verifies, changed events validate |
| TEST-PS-144-09.T07 | integration | PS-144-04.R03, PS-144-05.R03 | relay_latest by anonymous client; relay_upload by operator key and by another key | read served unchanged with receipt; upload by operator applied as hosting taxonomy with relay-local changed events; other key FORBIDDEN; relay cannot alter user mirror |
| TEST-PS-144-09.T19 | integration | PS-144-04.R04, PS-144-02.R04 | F applies the bundled seed pack offline; U offline 45 days applies the next pack; F applies a snapshot whose restricted change was approved a year ago | seed applied with provenance bundled; both packs apply because asOf comes from anchors or the claimed release time, not the vault clock |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
