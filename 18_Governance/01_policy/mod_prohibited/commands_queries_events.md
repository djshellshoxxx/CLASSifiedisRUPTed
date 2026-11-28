# PS-146-04 — Commands, queries and events: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-04.R01** draft, retire and release_pack run in the publisher's vault; retire only stages a retirement, and release_pack signs the full rule set with its taxonomyRef, salted hashes for sensitive rules and the cited decisions as classrup.governance.rule_pack/v1 and queues it to the publisher's relays.
- **PS-146-04.R02** apply_pack runs in every vault: it verifies the pack, the publisher's trust, decisions for new or changed versions and emergency limits, applies it atomically and emits one governance.prohibited_rule.changed event per changed rule key; packs from untrusted or paused publishers wait in the F18.S02.M01 pending inbox.
- **PS-146-04.R03** evaluate is a pure query run locally and by relays against their own packs; its result contains rule keys with their publisherId, reason keys, notices and the list of evaluated packs, never matched text.
- **PS-146-04.R04** Relays apply their operator's pack through the relay command relay_upload, which verifies the operator key, applies the pack as the relay's hosting policy and emits governance.prohibited_rule.changed relay-locally, serve it unchanged through relay_latest, and evaluate index submissions against it.
- **PS-146-04.R05** governance.prohibited_rule.changed carries ruleId (the version id) besides publisherId, ruleKey and version; cross-module references use (publisherId, ruleKey), and ruleId names an exact version.
- **PS-146-04.R06** Statement types of this module are registered in the F11.S01.M01 registry with audience, signer role, role resolution and maxAge (N2).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `governance.prohibited_rule.draft` | governance.prohibited_rule.author | [vault-local, publisher] { ruleId?, expectedRevision?, ruleKey, categoryIds, keywords, matchMode, action, kinds, jurisdictionScope: ProfileRef[], noticeId?, reasonKey, sensitive?, emergencyUntil?, proposalId? } | { ruleId, revision, version, status: draft } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_RULE_SCOPE_INVALID, GOVERNANCE_RULE_EMERGENCY_INVALID |  | yes (Idempotency-Key) |
| `governance.prohibited_rule.retire` | governance.prohibited_rule.author | [vault-local, publisher] { ruleKey, expectedRevision } | { ruleKey, stagedRetirement: true } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `governance.prohibited_rule.release_pack` | governance.prohibited_rule.release | [vault-local, publisher + statement classrup.governance.rule_pack/v1] { expectedPackVersion, changelogEntry, relayIds[] } | { packVersion, packCid, activeRuleCount, embeddedDecisions, syncState: prepared } | CONFLICT_REVISION, GOVERNANCE_RULE_PROPOSAL_REQUIRED, GOVERNANCE_RULE_EMERGENCY_INVALID, GOVERNANCE_RULE_PACK_REJECTED, GOVERNANCE_RULE_SCOPE_INVALID | governance.prohibited_rule.changed | yes (Idempotency-Key) |
| `governance.prohibited_rule.apply_pack` | governance.prohibited_rule.apply | [vault-local, inbound statement or PendingApplyPort] { envelope, receipt?, provenance } | { applied: boolean, packVersion, changedRuleKeys[], heldRuleKeys[], scopeUnresolvedRuleKeys[], pendingId?, pendingReason?: untrusted_publisher\|paused_publisher\|decision_unavailable } | VALIDATION_FAILED, GOVERNANCE_RULE_PACK_REJECTED, GOVERNANCE_RULE_PROPOSAL_REQUIRED, GOVERNANCE_RULE_EMERGENCY_INVALID, UNSUPPORTED_SCHEMA_VERSION, PAYLOAD_TOO_LARGE | governance.prohibited_rule.changed | yes (Idempotency-Key) |
| `governance.prohibited_rule.relay_upload` | governance.prohibited_rule.relay_publish | [relay command] { envelope } | { packVersion, packCid, relayReceipt: classrup.platform.relay_receipt/v1 } | VALIDATION_FAILED, FORBIDDEN, PAYLOAD_TOO_LARGE, RATE_LIMITED, GOVERNANCE_RULE_PACK_REJECTED, GOVERNANCE_RULE_PROPOSAL_REQUIRED, GOVERNANCE_RULE_EMERGENCY_INVALID | governance.prohibited_rule.changed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `governance.prohibited_rule.evaluate` | governance.prohibited_rule.evaluate | { kind, categoryId, title, description?, tags?, profileRefs?: ProfileRef[] } | { verdict: allow\|allow_with_notice\|review\|block, matches: [{ publisherId, ruleKey, ruleId, action, reasonKey, noticeId?, viaFallback: boolean }] (<= 10), packs: [{ publisherId, packVersion, packCid }], packsDigest: sha256-JCS(packs) } | VALIDATION_FAILED, NOT_FOUND |
| `governance.prohibited_rule.get` | governance.prohibited_rule.read | { publisherId, ruleKey, version? } or { ruleId } | { rule: ProhibitedRule } | NOT_FOUND |
| `governance.prohibited_rule.list_active` | governance.prohibited_rule.read | { publisherId?, cursor?, limit <= 200 } | { packs: [{ publisherId, packVersion, packCid }], items: ProhibitedRule[], nextCursor? } | VALIDATION_FAILED |
| `governance.prohibited_rule.relay_latest` | governance.prohibited_rule.relay_read | [relay query] { sinceVersion? } | { envelope, receipt } of the relay's current pack, byte-identical to the signed statement, or notModified | NOT_FOUND, RATE_LIMITED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `governance.prohibited_rule.changed` | P0 | { ruleId, publisherId, ruleKey, version, change: activated\|retired\|emergency_expired, action, rulesetVersion, packCid, scope: vault\|relay } — vault-local, or relay-local after relay_upload (scope relay) for relay consumers such as F12.S02.M01 case review |

### Events consumed

| Type | Effect |
|---|---|
| `governance.category.changed` | revalidate category scopes of stored rules; retired categories follow mergedInto and the rule keeps its scope; scope_unresolved rules whose ids now resolve in the declared taxonomy become resolved |
| `governance.policy_proposal.decided` | for outcome approved, retry rule versions held because their cited decision was unavailable; outcome conflicted keeps them held |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| GOVERNANCE_RULE_SCOPE_INVALID | 422 | no | a category scope does not resolve in the declared taxonomy in the publisher vault |
| GOVERNANCE_RULE_PROPOSAL_REQUIRED | 412 | no | activation needs a verified approved policy decision for this publisher, rule key and content |
| GOVERNANCE_RULE_EMERGENCY_INVALID | 422 | no | emergency rule is not review-level, exceeds 7 days or exceeds the 30-day emergency limit |
| GOVERNANCE_RULE_PACK_REJECTED | 422 | no | pack signature, trust, size, sensitive-hash format or version check failed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles (N2, registered in F11.S01.M01): classrup.governance.rule_pack/v1 - audience public; signer role publisher (principal: author = payload.publisherId, ext.signerKey active per F07.S02.M01 key_status at first sight; revoked keys quarantined); maxAge none (versioned configuration, superseded by version). The bundled rule pack ships signed by the release-pinned project key, is approved by the release review (F17 release gates) and is applied without decisions with provenance bundled; later changes follow the proposal path. The vault acts only on packs its receiving path accepted. This module registers apply for classrup.governance.rule_pack/v1 in the F18.S02.M01 PendingApplyPort.
Sensitive keyword evaluation: the text is normalized and tokenized once, every whole-word n-gram of 1 to 5 tokens is hashed with each sensitive rule's keywordSalt and compared with keywordHashes. Hashing hides the terms from casual reading of the public pack only; anyone holding the pack can test text against it and short terms can be recovered by dictionary search.


### Example

```
query governance.prohibited_rule.evaluate { "kind": "sell", "categoryId": "0192f3a4-1111-7000-8000-0000000000c1", "title": "Used road bike", "description": "Good shape" }
=> { "verdict": "allow", "matches": [], "packs": [{ "publisherId": "did:key:z6MkP...", "packVersion": 41, "packCid": "sha256-Zm9v..." }], "packsDigest": "sha256-UGFj..." }
query ... title "Fake designer bag replica" => { "verdict": "block", "matches": [ { "publisherId": "did:key:z6MkP...", "ruleKey": "counterfeit_goods", "ruleId": "0192f3b6-...", "action": "block", "reasonKey": "policy.counterfeit", "viaFallback": false } ], "packs": [...], "packsDigest": "sha256-UGFj..." }
publisher vault: dispatch("governance.prohibited_rule.release_pack", { "expectedPackVersion": 41, "changelogEntry": "Add counterfeit goods rule", "relayIds": ["relay:berlin.example"] })
=> { "packVersion": 42, "packCid": "sha256-Zm9v...", "activeRuleCount": 87, "embeddedDecisions": 1, "syncState": "prepared" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T06 | contract | PS-146-04.R01, PS-146-04.R02, PS-146-04.R03, PS-146-09.R02 | release, apply, evaluate | pack validates against classrup.governance.rule_pack/v1, signature verifies, result has no matched text and lists packs with publisherId and packsDigest, event valid |
| TEST-PS-146-09.T23 | integration | PS-146-04.R04 | relay_upload by the operator key and by another key; index submission evaluated on the relay | operator pack applied as hosting policy with relay-local changed events consumed by an F12.S02.M01 case fixture; other key FORBIDDEN; intake evaluates against the operator pack; relay_latest byte-identical |
| TEST-PS-146-09.T24 | contract | PS-146-04.R05, PS-146-04.R06 | changed event payload; F11.S01.M01 registry row for rule_pack/v1 | payload has ruleId, publisherId, ruleKey and version; registry row has audience, signer role, resolution and maxAge |

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, F11.S01.M01, F07.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
