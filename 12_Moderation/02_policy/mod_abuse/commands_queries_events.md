# PS-095-04 — Commands, queries and events: Abuse policy

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M03 Abuse policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/abuse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-095-04.R01** Every command is a relay command; publish also produces a signed policy statement that vaults can fetch.
- **PS-095-04.R02** Publish emits moderation.policy.published in the same transaction as the version row and the statement.
- **PS-095-04.R03** The module consumes relay-scope governance events to create drafts and flag rules for operator review, and never publishes, retires or changes a published version by itself.
- **PS-095-04.R04** moderation.policyrule.check_citable answers in-process whether ruleId@version was in force at a given decision time, and F12.S02.M01 and F12.S01.M03 cite only versions it confirms.
- **PS-095-04.R05** governance.policy_proposal.decided is consumed in relay runtime only with scope relay (a decision this relay stored through F18.S02.M01 relay_upload) and targetType platform_policy: outcome approved creates one draft version per targetRef from proposedChange[targetRef], the canonical platform_policy change record { family, severity, allowedActions, changeType, texts, prohibitedRuleRef?, changelog?, effectiveAt }, with governanceRef { proposalId, publisherId, proposalStatementCid, decisionCid, changeDigest } and without a second lookup (only a payload carrying proposedChangeCid instead reads the proposal statement proposalStatementCid stored on this relay); rejected creates nothing; conflicted discards the proposal's unpublished drafts and flags versions already published from it; vault-scope events are ignored.
- **PS-095-04.R06** governance.prohibited_rule.changed is consumed in relay runtime only with scope relay (the relay's applied pack, emitted by F18.S01.M02 relay_upload): versions whose prohibitedRuleRef has the event's (publisherId, ruleKey) get prohibitedRefStatus retired on change retired or emergency_expired and a review flag, a version pinned to a ruleId that is no longer the active version is flagged, check_citable reports citable false for a version whose reference is retired, and vault-scope events are ignored.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.policyrule.draft` | moderation.policyrule.draft | { ruleId?, family, severity, allowedActions, changeType, texts, prohibitedRuleRef?: { publisherId, ruleKey, ruleId? }, changelog, effectiveAt } | { policyRuleId, ruleId, version, revision: 1 } | VALIDATION_FAILED, CONFLICT_REVISION, MODERATION_POLICY_RETIRED |  | yes (Idempotency-Key) |
| `moderation.policyrule.publish` | moderation.policyrule.publish | { policyRuleId, expectedRevision } | { policyRuleId, ruleId, version, changeType, effectiveAt, inForce, statementCid, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MODERATION_POLICY_NOTICE_TOO_SHORT, VALIDATION_FAILED | moderation.policy.published | yes (Idempotency-Key) |
| `moderation.policyrule.retire` | moderation.policyrule.retire | { policyRuleId, expectedRevision, reason } | { policyRuleId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.policyrule.list_public` | moderation.policyrule.read_public | { family?, asOf?, locale?, cursor?, limit ≤ 100 } | { items: PolicyRule[] in force at asOf, nextCursor? } |  |
| `moderation.policyrule.get_version` | moderation.policyrule.read_public | { ruleId, version } | { rule: PolicyRule, statementCid } | NOT_FOUND |
| `moderation.policyrule.check_citable` | moderation.policyrule.check_citable | { refs: ruleId@version[] (1..5), decisionAt } | { items: { ref, citable: boolean, inForce: scheduled\|in_force\|superseded\|retired\|unknown, allowedActions, prohibitedRefStatus?: active\|retired }[] } — citable is false when prohibitedRefStatus is retired | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.policy.published` | P0 | { ruleId, version, family, severity, changeType, effectiveAt, statementCid, changelog } |

### Events consumed

| Type | Effect |
|---|---|
| `governance.policy_proposal.decided` | relay runtime, scope relay and targetType platform_policy only (vault-scope copies and other target types are ignored): reads outcome approved\|rejected\|conflicted, proposalId, publisherId, targetRefs, proposedChange (or proposedChangeCid), changeDigest, proposalStatementCid, decisionCid and changelogEntry; approved after V11 creates one draft per targetRef with governanceRef, deduped on (decisionCid, ruleId), changelog defaulting to changelogEntry; rejected creates nothing; conflicted discards that proposal's unpublished drafts (reason governance_conflicted) and flags versions already published from it; never publishes |
| `governance.prohibited_rule.changed` | relay runtime, scope relay only (vault-scope copies are ignored): match versions whose prohibitedRuleRef has the payload's (publisherId, ruleKey); change retired or emergency_expired sets prohibitedRefStatus retired and flag prohibited_rule_changed; change activated with a ruleId other than a pinned prohibitedRuleRef.ruleId flags the version; dedupe on (consumer, eventId); never changes a version row |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_POLICY_NOTICE_TOO_SHORT | 422 | no | restrictive rule changes need an effective date at least 14 days after publication |
| MODERATION_POLICY_RETIRED | 409 | no | a retired rule ID cannot be reused |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, F11.S01.M01): classrup.moderation.policy/v1 (signer role: the relay key registered in F16.S02.M02). check_citable is an in-process relay call and is not routable over HTTP. For F18.S02.M01 targetType platform_policy, a targetRef is an F12 ruleId (POL-<FAMILY>-<NNN>) and proposedChange[ruleId] is the canonical change record { family, severity, allowedActions, changeType, texts, prohibitedRuleRef?, changelog?, effectiveAt }, the moderation.policyrule.draft input without ruleId; a new ruleId starts at version 1. Prohibited-goods references use the F18.S01.M02 identity (publisherId, ruleKey) with optional ruleId.

### Example

```
POST https://relay.example/api/v1/cmd/moderation.policyrule.publish   (relay command, operator token)
Idempotency-Key: 0192f3d0-0000-7000-8000-000000000e01
{ "policyRuleId": "0192f3d0-6666-7000-8000-000000000006", "expectedRevision": 1 }
-> 200 { "policyRuleId": "0192f3d0-6666-7000-8000-000000000006", "ruleId": "POL-FRAUD-001", "version": 2, "changeType": "restrictive", "effectiveAt": "2026-11-18T10:00:00Z", "inForce": "scheduled", "statementCid": "sha256-dd56…", "revision": 2 }
in-process moderation.policyrule.check_citable { "refs": ["POL-FRAUD-001@2"], "decisionAt": "2026-11-05T09:00:00Z" } -> { "items": [ { "ref": "POL-FRAUD-001@2", "citable": false, "inForce": "scheduled" } ] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-095-09.T05 | contract | PS-095-04.R01, PS-095-04.R02, PS-095-09.R02 | each command and query | outputs, statement and event validate against registry schemas; signature verifies with the F16.S02.M02 key |
| TEST-PS-095-09.T06 | integration | PS-095-04.R03 | policy_proposal.decided and prohibited_rule.changed delivered twice | one draft created; dependent rules flagged; nothing auto-published |
| TEST-PS-095-09.T14 | e2e | PS-095-01.R02, PS-095-04.R01 | mobile visitor reads policy offline after first visit | cached policy shown with fetch date; axe zero serious issues |
| TEST-PS-095-09.T16 | integration | PS-095-03.R04, PS-095-04.R04 | v2 scheduled for next week; check_citable for v2 now and after effectiveAt, and for v1 after v2 takes effect | scheduled and not citable; in_force and citable; v1 superseded and not citable for later decisions while still readable |
| TEST-PS-095-09.T17 | integration | PS-095-04.R05, PS-095-02.R05, PS-095-03.R05 | relay-scope decided events for platform_policy: approved with proposedChange for POL-FRAUD-001 and new POL-SCAM-001 delivered twice, a vault-scope copy, a prohibited_rule target, a digest mismatch, a publisher that is not an operator key of the relay, then conflicted for the approved proposal | one draft per (decisionCid, ruleId) with governanceRef built without a get call; the copy, the other target, the mismatch and the foreign publisher create nothing; conflicted discards the unpublished drafts with reason governance_conflicted; nothing is published |
| TEST-PS-095-09.T18 | integration | PS-095-04.R06, PS-095-01.R05, PS-095-02.R02 | draft with prohibitedRuleRef { publisherId P, ruleKey counterfeit_goods }, with an unknown ruleKey and with a ruleId of another key; relay-scope prohibited_rule.changed retired for (P, counterfeit_goods) and a vault-scope copy; check_citable for the dependent version | stored; VALIDATION_FAILED twice; prohibitedRefStatus retired and flag set in the review table while the version row is unchanged; copy ignored; citable false |
| TEST-PS-095-09.T19 | contract | PS-095-04.R05, PS-095-04.R06, PS-095-10.R04 | F18.S02.M01 decided-event fixture (outcomes approved, rejected and conflicted, scope relay and vault) and F18.S01.M02 changed-event fixture against this module's consumer schema; v1 rows with a string prohibitedRuleRef through the expand step | every documented payload field is read as specified; string refs resolve to { publisherId, ruleKey, ruleId } or are flagged for review |

## Dependencies

Module depends on: F18.S01.M02, F18.S02.M01, F16.S02.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
