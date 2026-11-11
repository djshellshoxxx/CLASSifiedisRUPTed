# PS-089-04 — Commands, queries and events: Federation blocklists

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M02 Federation blocklists](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/blocklists` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-089-04.R01** The module exposes add, import, review, enable, disable, remove and publish commands plus list and evaluate queries.
- **PS-089-04.R02** Each command states whether it is vault-local, produces a signed statement or is a relay command, and emits its events in the same transaction.
- **PS-089-04.R03** The module consumes the personal block event to keep federated content hidden consistently with the user's block list.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `federation.block_rule.add` | federation.block_rule.add | [vault-local command in the vault; relay command under relay policy] { ruleType, value, action, reason, note?, expiresAt? } | { ruleId, revision, status: active } | VALIDATION_FAILED, FEDERATION_BLOCK_DUPLICATE, FEDERATION_BLOCK_SELF, FEDERATION_BLOCK_LIMIT | federation.block_rule.changed | yes (Idempotency-Key) |
| `federation.block_rule.import_list` | federation.block_rule.import | [vault-local or relay command; consumes signed statement classrup.federation.blocklist/v1] { list: Envelope } | { listCid, publisher, imported, duplicates, status: pending_review } | FED_SIGNATURE_INVALID, FEDERATION_BLOCKLIST_TOO_LARGE, FEDERATION_BLOCK_LIMIT, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `federation.block_rule.review` | federation.block_rule.review | [vault-local or relay command] { decisions: [ { ruleId, decision: approve\|reject } ] ≤ 500, expectedRevisions } | { approved, rejected } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN | federation.block_rule.changed | yes (Idempotency-Key) |
| `federation.block_rule.disable` | federation.block_rule.update | [vault-local or relay command] { ruleId, expectedRevision } | { ruleId, revision, status: disabled } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | federation.block_rule.changed | yes (Idempotency-Key) |
| `federation.block_rule.enable` | federation.block_rule.update | [vault-local or relay command] { ruleId, expectedRevision } | { ruleId, revision, status: active } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | federation.block_rule.changed | yes (Idempotency-Key) |
| `federation.block_rule.remove` | federation.block_rule.update | [vault-local or relay command] { ruleId, expectedRevision } | { ruleId, revision, status: removed } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | federation.block_rule.changed | yes (Idempotency-Key) |
| `federation.block_rule.publish_list` | federation.block_rule.publish | [vault-local command; produces signed statement classrup.federation.blocklist/v1] { ruleIds: uuidv7[1..10000], title ≤ 80 } | { listCid, entries } | NOT_FOUND, VALIDATION_FAILED, FEDERATION_BLOCKLIST_TOO_LARGE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `federation.block_rule.list` | federation.block_rule.read | { ruleType?, status?, source?, cursor?, limit ≤ 100 } | { items: BlockRule[], nextCursor? } |  |
| `federation.block_rule.evaluate` | federation.block_rule.evaluate | { peerRelayId, author, cid, contentHash } | { decision: allow\|reject\|hide, matchedRuleIds: uuidv7[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `federation.block_rule.changed` | P3 | { ruleId, ruleType, value, action, change: added\|activated\|disabled\|expired\|removed } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.block.added` | when the blocked party has a did:key, create or keep a local author rule with action hide and reason other so federated content from that author is hidden |
| `identity.block.removed` | remove the matching local hide rule that was created from the personal block |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FEDERATION_BLOCK_DUPLICATE | 409 | no | an active or pending rule with this type and value exists |
| FEDERATION_BLOCK_SELF | 422 | no | a peer rule cannot target this relay |
| FEDERATION_BLOCKLIST_TOO_LARGE | 413 | no | list has more than 10000 entries |
| FEDERATION_BLOCK_LIMIT | 409 | no | 100000 rules per tenant reached |
| FED_SIGNATURE_INVALID | 400 | no | blocklist statement signature check failed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
federation.block_rule.add { ruleType: "author", value: "did:key:z6MkBad...", action: "reject", reason: "scam" }
-> { ruleId: "0192f3e0-...", revision: 1, status: "active" }   emits federation.block_rule.changed
federation.block_rule.evaluate { peerRelayId: "relay:b.example", author: "did:key:z6MkBad...", cid: "sha256-Qm...", contentHash: "sha256-Lk..." }
-> { decision: "reject", matchedRuleIds: ["0192f3e0-..."] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-089-09.T05 | integration | PS-089-04.R01, PS-089-04.R02, PS-089-06.R03 | rule blocks author Bad with 5 mirrors present | mirrors purged within 1 h via federation.block_rule.changed consumer; later tombstone from Bad still applied |
| TEST-PS-089-09.T06 | integration | PS-089-04.R03, PS-089-02.R01 | identity.block.added then removed for a party with a did | local hide rule created then removed; federated content hidden then visible |
| TEST-PS-089-09.T07 | contract | PS-089-04.R01, PS-089-04.R02, PS-089-09.R02 | each command, query and the blocklist statement | validate against registry schemas |
| TEST-PS-089-09.T14 | a11y | PS-089-03.R01, PS-089-04.R01 | operate import review by keyboard and screen reader | all rows labelled, targets ≥ 44 px, announcements present |

## Dependencies

Module depends on: F11.S01.M03, F07.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
