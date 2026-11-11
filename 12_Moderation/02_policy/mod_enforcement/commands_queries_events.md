# PS-096-04 — Commands, queries and events: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-04.R01** Every command declares whether it is a relay command or a vault-local intake and which signed statements it produces.
- **PS-096-04.R02** Case opening is driven by consumed events (received reports through moderation.report.received, spam detections, shill suspicions, high risk levels) and by the operator command moderation.case.open, and emits moderation.case.opened in the same transaction as the case.
- **PS-096-04.R03** Apply and revert emit action events in the same transaction, and the statement of reasons is stored before the event is dispatched.
- **PS-096-04.R04** A subject's vault verifies received classrup.moderation.reasons/v1 and reversal/v1 statements and derives local moderation.action.applied and moderation.action.reverted events (EVT-9, actor.kind federated) with the same target fields and without deciderKey.
- **PS-096-04.R05** Action events carry the target, restricted capabilities, rule references, expiry, statement content id and issue time that appeals, limits, signals, index and notification consumers need.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.case.open` | moderation.case.open | { subjectKey, targetType, targetId, reason, snapshotIds? } | { caseId, revision, merged: boolean } | VALIDATION_FAILED, FORBIDDEN | moderation.case.opened | yes (Idempotency-Key) |
| `moderation.case.assign` | moderation.case.assign | { caseId, expectedRevision, assigneeKey? } | { caseId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN |  | yes (Idempotency-Key) |
| `moderation.case.close` | moderation.case.close | { caseId, expectedRevision, outcome: actioned\|no_action\|duplicate\|content_removed_by_owner, note? } | { caseId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN | moderation.case.closed | yes (Idempotency-Key) |
| `moderation.action.apply` | moderation.action.apply | { caseId, expectedRevision, kind, subjectKey, targetType, targetId, targetRef?, restrictedCapabilities?, ruleRefs[], factsSummary, expiresInMs?, publishAdvisory?: boolean, closeCase?: boolean } | { actionId, revision, reasonsStatementCid, reasonsIssuedAt, status } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MODERATION_RULE_REQUIRED, MODERATION_ACTION_LIMIT, MODERATION_LAST_ADMIN_PROTECTED, MODERATION_CAPABILITY_PROTECTED, FORBIDDEN, DEPENDENCY_UNAVAILABLE | moderation.action.applied, moderation.case.closed | yes (Idempotency-Key) |
| `moderation.action.revert` | moderation.action.revert | { actionId, expectedRevision, reason: moderator_decision\|error_correction } | { actionId, revision, reversalStatementCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN | moderation.action.reverted | yes (Idempotency-Key) |
| `moderation.action.receive` | moderation.action.receive | { statement } | { actionId, status, quarantined: boolean } | FORBIDDEN, VALIDATION_FAILED, CONFLICT_STATE | moderation.action.applied, moderation.action.reverted | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.case.list` | moderation.case.read_queue | { status?, source?, assigneeKey?, sort?: age\|reason, cursor?, limit ≤ 50 } | { items: ModerationCase[], nextCursor? } |  |
| `moderation.action.get_mine` | moderation.action.read_own | { actionId } | { action: EnforcementAction without deciderKey, reasonsStatement, reversal? } | NOT_FOUND |
| `moderation.action.list_active_for_key` | moderation.action.read_restrictions | { subjectKey } | { items: { actionId, kind, targetRef?, restrictedCapabilities, expiresAt }[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.case.opened` | P2 | { caseId, targetType, targetId, subjectKey, source, reportRefs } |
| `moderation.case.closed` | P2 | { caseId, outcome, reportRefs, actionIds } |
| `moderation.action.applied` | P2 | { actionId, caseId, origin: relay\|vault, kind, subjectKey, targetType, targetId, targetRef?, restrictedCapabilities?, ruleRefs, expiresAt, reasonsStatementCid, reasonsIssuedAt, deciderKey? (relay origin only), replacesActionId? } — relay-local on the relay (EVT-8); the vault copy is derived from the verified statement (EVT-9, actor.kind federated) and never carries deciderKey |
| `moderation.action.reverted` | P2 | { actionId, caseId, origin: relay\|vault, kind, subjectKey, targetType, targetId, targetRef?, restrictedCapabilities?, reason: moderator_decision\|appeal_overturned\|appeal_reduced\|error_correction\|expired, replacedByActionId?, reversalStatementCid } |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.report.received` | relay only: open a case for (targetType, targetId) with subjectKey and source report, or attach receiptId and snapshotId to the open case, and in the same transaction call F12.S01.M01 moderation.report.link_case { receiptId, caseRef } so the reporter is told for new and merged cases; dedupe on receiptId |
| `moderation.spam.detected` | relay origin only: open or extend a case for subjectKey and the target with source spam_detection when score ≥ 80; lower scores only add signals (F12.S03.M02) |
| `auctions.shill.suspected` | open or extend a case with source shill_suspicion and subjectKey = subjectId for the auction hosted on this relay |
| `moderation.appeal.decided` | relay origin only (vault-derived copies are ignored): overturned reverts the contested action with reason appeal_overturned; reduced reverts it with appeal_reduced and applies the replacement described by reducedTo { kind, expiresAt?, restrictedCapabilities? } with a new statement of reasons in the same transaction; upheld changes nothing; moot closures never produce this event |
| `governance.prohibited_rule.changed` | mark open cases that cite the changed prohibited-goods rule for moderator review |
| `moderation.risk.elevated` | relay only, level high for subjectType key: open or extend a case with source risk_review and targetType account for human review; the level is never a rule and never an action by itself |
| `privacy.deletion.completed` | vault: delete received statements of reasons and reversals unless the request kept evidence, in which case subjectKey is replaced by the payload pseudonym; relay cases and actions are pseudonymized by the DeletionPort when the relay applies the signed deletion request and stay for RET-EVIDENCE |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_RULE_REQUIRED | 422 | no | an action needs 1..5 policy rule references in force at the decision time |
| MODERATION_ACTION_LIMIT | 422 | no | expiry or kind exceeds the role's limit |
| MODERATION_LAST_ADMIN_PROTECTED | 409 | no | the relay's last admin or operator key cannot be suspended |
| MODERATION_CAPABILITY_PROTECTED | 422 | no | the appeal route, own-action and own-evidence reads, export and deletion can never be restricted |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, F11.S01.M01), all signed by the relay key pinned when users selected the relay: classrup.moderation.reasons/v1 and classrup.moderation.reversal/v1 (to the subject, sealed into the subject's mailbox through F08.S01.M01 comms.mailbox.put with a content-free push through notify.notification.dispatch, N17), classrup.moderation.advisory/v1 { advisoryId, seq, targetCid, ruleRef, advice: label|hide_suggested, issuedAt, expiresAt? } and classrup.moderation.advisoryretraction/v1 { seq, retractsAdvisoryCid, reason } (public feed, opt-in for subscribers in F12.S01.M01). Moderation never produces classrup.federation.tombstone/v1; only authors tombstone their own content. Index effects are applied by F06.S01.M01 from moderation.action.applied. Privacy ports (N6): ExportSectionPort (section moderation.actions), DeletionPort (pseudonymize subjectKey on relays, delete or pseudonymize vault copies) and RetentionPurgePort (RET-EVIDENCE, internal notes after 180 days) are registered with F10.S01.M03, F10.S01.M04 and F10.S01.M02.

### Example

```
POST https://relay.example/api/v1/cmd/moderation.action.apply   (relay command, moderator token)
Idempotency-Key: 0192f3b8-0000-7000-8000-000000000d01
{ "caseId": "0192f3b4-5555-7000-8000-000000000005", "expectedRevision": 2, "kind": "remove_from_index", "subjectKey": "did:key:z6MkAuthorExample",
  "targetType": "listing", "targetId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "targetRef": "sha256-aa01…", "ruleRefs": ["POL-FRAUD-001@1"],
  "factsSummary": "Listing asks buyers to pay by gift card before showing the item, which matches rule POL-FRAUD-001.", "expiresInMs": null, "closeCase": false }
-> 201 { "actionId": "0192f3b8-3333-7000-8000-000000000003", "revision": 1, "reasonsStatementCid": "sha256-bb12…", "reasonsIssuedAt": "2026-11-04T10:00:00Z", "status": "pending_notice" }
mailbox acknowledges the reasons statement -> active; emits moderation.action.applied { origin: "relay", targetType: "listing", targetRef: "sha256-aa01…", reasonsIssuedAt: "2026-11-04T10:00:00Z", … }
subject vault: moderation.action.receive verifies the statement -> local moderation.action.applied { origin: "vault" } without deciderKey
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T05 | integration | PS-096-03.R03, PS-096-04.R03 | operator revert and expiry of actions that published advisories | effect removed, reversal and advisory retraction signed, original statement unchanged, events in the same transaction as the state change |
| TEST-PS-096-09.T06 | contract | PS-096-04.R01, PS-096-04.R05, PS-096-09.R02 | each command, statement and event | validate against registry schemas; action.applied and reverted carry target, restricted capabilities, ruleRefs, expiresAt, reasonsStatementCid and reasonsIssuedAt; statements verify with the relay key |
| TEST-PS-096-09.T07 | integration | PS-096-04.R02, PS-096-06.R03 | moderation.report.received delivered twice; a second report on the same target; spam.detected score 79 and 80; risk.elevated high | one case with source report, both receipts attached and link_case called once per receipt; 79 adds signals only, 80 opens or extends a case for subjectKey; risk case has source risk_review and targetType account |
| TEST-PS-096-09.T17 | integration | PS-096-01.R04, PS-096-04.R02 | operator opens an account case with moderation.case.open; moderator applies remove_from_index then warn on that case; then closes it actioned | case.opened emitted; two actions on one case; case resolved actioned only by the close |
| TEST-PS-096-09.T21 | integration | PS-096-04.R04 | subject vault receives reasons/v1, later reversal/v1, and one statement with a forged signature | local moderation.action.applied and reverted derived with actor.kind federated, same target fields, no deciderKey; forged statement quarantined |
| TEST-PS-096-09.T25 | contract | PS-096-04.R05 | action.applied restrict_feature and action.reverted consumed by F12.S03.M04, F12.S03.M02 and F12.S01.M03 contract fixtures | each consumer resolves subject key, capabilities, expiry and reasonsIssuedAt from the payload without extra lookups |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M01, F12.S01.M02, F12.S03.M03, F06.S01.M01, F08.S01.M01, F07.S02.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
