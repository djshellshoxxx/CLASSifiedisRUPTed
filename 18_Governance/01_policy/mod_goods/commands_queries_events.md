# PS-144-04 — Commands, queries and events: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-04.R01** create, update, move and set_status are authoring commands that run in the publisher's vault and stage a change set; release_pack signs the full taxonomy as classrup.governance.taxonomy_pack/v1 and queues it to the publisher's relays.
- **PS-144-04.R02** apply_pack is a vault command available in every vault: it verifies and applies a pack and emits one governance.category.changed event per changed category.
- **PS-144-04.R03** A relay serves the latest pack publicly and read-only; relay commands do not mutate categories.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `governance.category.create` | governance.category.author | [vault-local, publisher] { key, parentId?, names, restricted?, restrictedReasonKey?, proposalId?, sortOrder? } | { categoryId, revision: 1, stagedInPack } | VALIDATION_FAILED, NOT_FOUND, GOVERNANCE_CATEGORY_TREE_INVALID, GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED |  | yes (Idempotency-Key) |
| `governance.category.update` | governance.category.author | [vault-local, publisher] { categoryId, expectedRevision, names?, restricted?, restrictedReasonKey?, proposalId?, sortOrder? } | { categoryId, revision } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED |  | yes (Idempotency-Key) |
| `governance.category.move` | governance.category.author | [vault-local, publisher] { categoryId, expectedRevision, newParentId?, sortOrder? } | { categoryId, revision, depth } | NOT_FOUND, CONFLICT_REVISION, GOVERNANCE_CATEGORY_TREE_INVALID |  | yes (Idempotency-Key) |
| `governance.category.set_status` | governance.category.author | [vault-local, publisher] { categoryId, expectedRevision, to: deprecated\|active\|retired, mergedInto? } | { categoryId, revision, status } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_CATEGORY_TREE_INVALID |  | yes (Idempotency-Key) |
| `governance.category.release_pack` | governance.category.release | [vault-local, publisher + statement classrup.governance.taxonomy_pack/v1] { expectedPackVersion, changelogEntry, relayIds[] } | { packVersion, packCid, categoryCount, syncState: prepared } | CONFLICT_REVISION, GOVERNANCE_CATEGORY_TREE_INVALID, PRECONDITION_FAILED | governance.category.changed | yes (Idempotency-Key) |
| `governance.category.apply_pack` | governance.category.apply | [vault-local, inbound statement] { envelope, provenance, trustPublisher?: boolean } | { applied: boolean, packVersion, changedCategoryIds[], pendingReason? } | VALIDATION_FAILED, GOVERNANCE_CATEGORY_PACK_UNTRUSTED, GOVERNANCE_CATEGORY_PACK_STALE, GOVERNANCE_CATEGORY_TREE_INVALID, UNSUPPORTED_SCHEMA_VERSION | governance.category.changed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `governance.category.get` | governance.category.read | { categoryId } | { category: Category } | NOT_FOUND |
| `governance.category.list_children` | governance.category.read | { parentId?, includeDeprecated?: boolean, locale? } | { items: Category[] } | NOT_FOUND |
| `governance.category.tree` | governance.category.read | { locale?, includeDeprecated? } | { packVersion, packCid, items: Category[] } | VALIDATION_FAILED |
| `governance.category.resolve` | governance.category.read | { categoryId } | { categoryId, resolvedId, path: uuidv7[], restricted } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `governance.category.changed` | P0 | { categoryId, change: created\|renamed\|moved\|restricted_changed\|deprecated\|reactivated\|retired, restricted, mergedInto?, packVersion, publisherId } |

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| GOVERNANCE_CATEGORY_TREE_INVALID | 422 | no | depth over 4, cycle, child limit, merge target or id reuse violation |
| GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED | 412 | no | restricted-flag change needs an approved policy proposal reference |
| GOVERNANCE_CATEGORY_PACK_UNTRUSTED | 403 | no | pack publisher is not among the vault's trusted publishers |
| GOVERNANCE_CATEGORY_PACK_STALE | 409 | no | pack version is not newer than the applied version or is not a full snapshot |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
publisher vault: dispatch("governance.category.create", { "key": "road_bikes", "parentId": "0192f3a4-1111-7000-8000-0000000000c1",
  "names": { "en": "Road bikes", "de": "Rennraeder" } }, idempotencyKey: "0192f3a4-0000-7000-8000-000000000091")
=> { "categoryId": "0192f3b1-...", "revision": 1, "stagedInPack": 12 }
dispatch("governance.category.release_pack", { "expectedPackVersion": 11, "changelogEntry": "Add road bikes", "relayIds": ["relay:berlin.example"] })
=> { "packVersion": 12, "packCid": "sha256-Zm9v...", "categoryCount": 301, "syncState": "prepared" }
user vault: apply_pack => { "applied": true, "packVersion": 12, "changedCategoryIds": ["0192f3b1-..."] } and event governance.category.changed (created)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T06 | contract | PS-144-04.R01, PS-144-04.R02, PS-144-09.R02 | release and apply | pack validates against classrup.governance.taxonomy_pack/v1, signature verifies, changed events validate |
| TEST-PS-144-09.T07 | integration | PS-144-04.R03, PS-144-05.R03 | relay serves and accepts pack | anonymous read allowed; upload only with operator device key; relay cannot alter user mirror |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
