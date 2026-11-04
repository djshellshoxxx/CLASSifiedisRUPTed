# PS-095-04 — Commands, queries and events: Abuse policy

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M03 Abuse policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/abuse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-095-04.R01** Every command is a relay command; publish also produces a signed policy statement that vaults can fetch.
- **PS-095-04.R02** Publish emits moderation.policy.published in the same transaction as the version row and the statement.
- **PS-095-04.R03** The module consumes governance events to flag rules for review and does not change rules by itself.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.policyrule.draft` | moderation.policyrule.draft | { ruleId?, family, severity, allowedActions, texts, prohibitedRuleRef?, changelog, effectiveAt } | { policyRuleId, ruleId, version, revision: 1 } | VALIDATION_FAILED, CONFLICT_REVISION, MODERATION_POLICY_RETIRED |  | yes (Idempotency-Key) |
| `moderation.policyrule.publish` | moderation.policyrule.publish | { policyRuleId, expectedRevision } | { policyRuleId, ruleId, version, statementCid, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MODERATION_POLICY_NOTICE_TOO_SHORT, VALIDATION_FAILED | moderation.policy.published | yes (Idempotency-Key) |
| `moderation.policyrule.retire` | moderation.policyrule.retire | { policyRuleId, expectedRevision, reason } | { policyRuleId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.policyrule.list_public` | moderation.policyrule.read_public | { family?, asOf?, locale?, cursor?, limit ≤ 100 } | { items: PolicyRule[] in force at asOf, nextCursor? } |  |
| `moderation.policyrule.get_version` | moderation.policyrule.read_public | { ruleId, version } | { rule: PolicyRule, statementCid } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.policy.published` | P0 | { ruleId, version, family, severity, effectiveAt, statementCid, changelog } |

### Events consumed

| Type | Effect |
|---|---|
| `governance.policy_proposal.decided` | create a draft rule version from an accepted proposal for operator review; never publishes by itself |
| `governance.prohibited_rule.changed` | refresh prohibitedRuleRef status and flag dependent rules for review |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_POLICY_NOTICE_TOO_SHORT | 422 | no | restrictive rule changes need an effective date at least 14 days after publication |
| MODERATION_POLICY_RETIRED | 409 | no | a retired rule ID cannot be reused |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
POST https://relay.example/api/v1/cmd/moderation.policyrule.publish   (relay command, operator token)
Idempotency-Key: 0192f3d0-0000-7000-8000-000000000e01
{ "policyRuleId": "0192f3d0-6666-7000-8000-000000000006", "expectedRevision": 1 }
-> 200 { "policyRuleId": "0192f3d0-6666-7000-8000-000000000006", "ruleId": "POL-FRAUD-001", "version": 2, "statementCid": "sha256-dd56…", "revision": 2 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-095-09.T05 | contract | PS-095-04.R01, PS-095-04.R02, PS-095-09.R02 | each command and query | outputs, statement and event validate against registry schemas; signature verifies |
| TEST-PS-095-09.T06 | integration | PS-095-04.R03 | policy_proposal.decided and prohibited_rule.changed delivered twice | one draft created; dependent rules flagged; nothing auto-published |
| TEST-PS-095-09.T14 | e2e | PS-095-01.R02, PS-095-04.R01 | mobile visitor reads policy offline after first visit | cached policy shown with fetch date; axe zero serious issues |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
