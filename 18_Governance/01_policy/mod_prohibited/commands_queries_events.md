# PS-146-04 — Commands, queries and events: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-04.R01** draft, retire and release_pack run in the publisher's vault; release_pack signs the full rule set as classrup.governance.rule_pack/v1 and queues it to the publisher's relays.
- **PS-146-04.R02** apply_pack runs in every vault: it verifies the pack, applies it atomically and emits one governance.prohibited_rule.changed event per changed rule key.
- **PS-146-04.R03** evaluate is a pure query run locally and by relays against their own pack; its result contains rule keys, reason keys, notices and the ruleset version, never matched text.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `governance.prohibited_rule.draft` | governance.prohibited_rule.author | [vault-local, publisher] { ruleId?, expectedRevision?, ruleKey, categoryIds, keywords, matchMode, action, kinds, jurisdictionProfileIds, noticeId?, reasonKey, sensitive?, emergencyUntil? } | { ruleId, revision, version, status: draft } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_RULE_SCOPE_INVALID, GOVERNANCE_RULE_EMERGENCY_INVALID |  | yes (Idempotency-Key) |
| `governance.prohibited_rule.retire` | governance.prohibited_rule.author | [vault-local, publisher] { ruleKey, expectedRevision } | { ruleKey, stagedRetirement: true } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `governance.prohibited_rule.release_pack` | governance.prohibited_rule.release | [vault-local, publisher + statement classrup.governance.rule_pack/v1] { expectedPackVersion, proposalId?, changelogEntry, relayIds[] } | { packVersion, packCid, activeRuleCount, syncState: prepared } | CONFLICT_REVISION, GOVERNANCE_RULE_PROPOSAL_REQUIRED, GOVERNANCE_RULE_EMERGENCY_INVALID, GOVERNANCE_RULE_PACK_REJECTED | governance.prohibited_rule.changed | yes (Idempotency-Key) |
| `governance.prohibited_rule.apply_pack` | governance.prohibited_rule.apply | [vault-local, inbound statement] { envelope, provenance, trustPublisher?: boolean } | { applied: boolean, packVersion, changedRuleKeys[], pendingReason? } | VALIDATION_FAILED, GOVERNANCE_RULE_PACK_REJECTED, GOVERNANCE_RULE_PROPOSAL_REQUIRED, UNSUPPORTED_SCHEMA_VERSION | governance.prohibited_rule.changed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `governance.prohibited_rule.evaluate` | governance.prohibited_rule.evaluate | { kind, categoryId, title, description?, tags?, jurisdictionProfileIds? } | { verdict: allow\|allow_with_notice\|review\|block, matches: [{ ruleKey, action, reasonKey, noticeId? }] (<= 10), rulesetVersion } | VALIDATION_FAILED, NOT_FOUND |
| `governance.prohibited_rule.get` | governance.prohibited_rule.read | { ruleKey } | { rule: ProhibitedRule } | NOT_FOUND |
| `governance.prohibited_rule.list_active` | governance.prohibited_rule.read | { cursor?, limit <= 200 } | { rulesetVersion, items: ProhibitedRule[], nextCursor? } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `governance.prohibited_rule.changed` | P0 | { ruleKey, version, change: activated\|retired\|emergency_expired, action, rulesetVersion, publisherId } |

### Events consumed

| Type | Effect |
|---|---|
| `governance.category.changed` | revalidate category scopes of stored rules; retired categories follow mergedInto and the rule keeps its scope |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| GOVERNANCE_RULE_SCOPE_INVALID | 422 | no | a category scope does not resolve in the active taxonomy |
| GOVERNANCE_RULE_PROPOSAL_REQUIRED | 412 | no | activation needs a verified approved policy decision |
| GOVERNANCE_RULE_EMERGENCY_INVALID | 422 | no | emergency rule is not review-level or exceeds 7 days |
| GOVERNANCE_RULE_PACK_REJECTED | 422 | no | pack signature, trust, size or version check failed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
query governance.prohibited_rule.evaluate { "kind": "sell", "categoryId": "0192f3a4-1111-7000-8000-0000000000c1", "title": "Used road bike", "description": "Good shape" }
=> { "verdict": "allow", "matches": [], "rulesetVersion": 41 }
query ... title "Fake designer bag replica" => { "verdict": "block", "matches": [ { "ruleKey": "counterfeit_goods", "action": "block", "reasonKey": "policy.counterfeit" } ], "rulesetVersion": 41 }
publisher vault: dispatch("governance.prohibited_rule.release_pack", { "expectedPackVersion": 41, "proposalId": "0192f3b2-...", "changelogEntry": "Add counterfeit goods rule", "relayIds": ["relay:berlin.example"] })
=> { "packVersion": 42, "packCid": "sha256-Zm9v...", "activeRuleCount": 87, "syncState": "prepared" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T06 | contract | PS-146-04.R01, PS-146-04.R02, PS-146-09.R02 | release, apply, evaluate | pack validates against classrup.governance.rule_pack/v1, signature verifies, result has no matched text, event valid |
| TEST-PS-146-09.T07 | integration | PS-146-04.R03, PS-146-06.R03 | apply pack while publications are active | changed event emitted; F01.S01.M03 re-evaluation ends a publication that now blocks |

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
