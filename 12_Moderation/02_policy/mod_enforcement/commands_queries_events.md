# PS-096-04 — Commands, queries and events: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-04.R01** Every command declares whether it is a relay command or a vault-local intake and which signed statements it produces.
- **PS-096-04.R02** Case opening is driven by consumed events (received reports through moderation.report.received, spam detections, shill suspicions, high risk levels) and by the operator command moderation.case.open, and emits moderation.case.opened in the same transaction as the case.
- **PS-096-04.R03** Apply and revert emit action events in the same transaction, and the statement of reasons is stored before the event is dispatched.
- **PS-096-04.R04** A subject's vault verifies received classrup.moderation.reasons/v1 and reversal/v1 statements and derives local moderation.action.applied and moderation.action.reverted events (EVT-9, actor.kind federated) with the same target fields and without deciderKey.
- **PS-096-04.R05** Action events carry the target, restricted capabilities, rule references, expiry, statement content id and issue time that appeals, limits, signals, index and notification consumers need.
- **PS-096-04.R06** moderation.action.applied and moderation.action.reverted always carry targetRef { type, id, cid? } and caseSource, and the relay-signed reasons/v1 and reversal/v1 statements carry relayId, actionId and targetRef (for a listing, id listingId and cid the projection statementCid), so F06.S01.M01 removes only the targeted document and F01.S01.M03 binds each notice to one delivery.
- **PS-096-04.R07** moderation.action.applied and moderation.action.reverted affect only the acting relay's hosted copy: relay consumers (F06.S01.M01 index, F07.S02.M02 profile hosting, F16.S01.M01 authorization caches) apply them in relay runtime only, and vault-origin copies derived from verified statements are informational and never change vault records.
- **PS-096-04.R08** moderation.action.record_host_policy is the in-process relay command a hosting module calls in its own decision transaction (F04.S02.M03 confirm_void); it opens or reuses the case for the auction with source auction_review, applies the action, optionally closes the case, and returns actionId and caseId, which the hosting module stores to match moderation.appeal.decided.actionId.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.case.open` | moderation.case.open | { subjectKey, targetType, targetId, reason, snapshotIds? } | { caseId, revision, merged: boolean } | VALIDATION_FAILED, FORBIDDEN | moderation.case.opened | yes (Idempotency-Key) |
| `moderation.case.assign` | moderation.case.assign | { caseId, expectedRevision, assigneeKey? } | { caseId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN |  | yes (Idempotency-Key) |
| `moderation.case.close` | moderation.case.close | { caseId, expectedRevision, outcome: actioned\|no_action\|duplicate\|content_removed_by_owner, note? } | { caseId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN | moderation.case.closed | yes (Idempotency-Key) |
| `moderation.action.apply` | moderation.action.apply | { caseId, expectedRevision, kind, subjectKey, targetType, targetId, targetCid?, restrictedCapabilities?, ruleRefs[], factsSummary, expiresInMs?, publishAdvisory?: boolean, closeCase?: boolean } — the action stores targetRef { type: targetType, id: targetId, cid: targetCid } | { actionId, revision, reasonsStatementCid, reasonsIssuedAt, status } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MODERATION_RULE_REQUIRED, MODERATION_ACTION_LIMIT, MODERATION_LAST_ADMIN_PROTECTED, MODERATION_CAPABILITY_PROTECTED, FORBIDDEN, DEPENDENCY_UNAVAILABLE | moderation.action.applied, moderation.case.closed | yes (Idempotency-Key) |
| `moderation.action.record_host_policy` | moderation.action.record_host_policy | { source: auction_review, hostRef: reviewId, kind: remove_from_index, subjectKey: seller did:key, targetRef: { type: auction, id: auctionId, cid?: auction terms cid }, ruleRefs[] (1..5 in force), factsSummary, deciderKey (confirming moderator), proposerKey (proposing moderator), expiresInMs?, closeCase?: boolean (default true) } | { actionId, caseId, revision, reasonsStatementCid, reasonsIssuedAt, status, created: boolean } | VALIDATION_FAILED, MODERATION_RULE_REQUIRED, MODERATION_ACTION_LIMIT, FORBIDDEN, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE | moderation.case.opened, moderation.action.applied, moderation.case.closed | yes (Idempotency-Key) |
| `moderation.action.revert` | moderation.action.revert | { actionId, expectedRevision, reason: moderator_decision\|error_correction } | { actionId, revision, reversalStatementCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN | moderation.action.reverted | yes (Idempotency-Key) |
| `moderation.action.receive` | moderation.action.receive | { statement } | { actionId, status, quarantined: boolean } | FORBIDDEN, VALIDATION_FAILED, CONFLICT_STATE | moderation.action.applied, moderation.action.reverted | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.case.list` | moderation.case.read_queue | { status?, source?, assigneeKey?, sort?: age\|reason, cursor?, limit ≤ 50 } | { items: ModerationCase[], nextCursor? } |  |
| `moderation.action.get_mine` | moderation.action.read_own | { actionId } | { action: EnforcementAction without deciderKey, reasonsStatement, reversal? } | NOT_FOUND |
| `moderation.action.list_active_for_key` | moderation.action.read_restrictions | { subjectKey } | { items: { actionId, kind, targetRef, restrictedCapabilities, expiresAt }[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.case.opened` | P2 | { caseId, targetType, targetId, subjectKey, source (report \| spam_detection \| shill_suspicion \| risk_review \| operator \| auction_review), reportRefs, hostRef? } |
| `moderation.case.closed` | P2 | { caseId, outcome, reportRefs, actionIds } |
| `moderation.action.applied` | P2 | { actionId, caseId, origin: relay\|vault, caseSource, kind, subjectKey, targetType, targetId, targetRef: { type, id, cid? }, restrictedCapabilities?, ruleRefs, expiresAt, reasonsStatementCid, reasonsIssuedAt, deciderKey? and proposerKey? (relay origin only), hostRef? (relay origin only), replacesActionId? } — relay-local on the relay (EVT-8) and affecting only this relay's hosted copy of targetRef; the vault copy is derived from the verified statement (EVT-9, actor.kind federated), never carries deciderKey or proposerKey and never changes vault records |
| `moderation.action.reverted` | P2 | { actionId, caseId, origin: relay\|vault, caseSource, kind, subjectKey, targetType, targetId, targetRef: { type, id, cid? }, restrictedCapabilities?, reason: moderator_decision\|appeal_overturned\|appeal_reduced\|error_correction\|expired, replacedByActionId?, reversalStatementCid } — restores only this relay's hosted copy of targetRef; the vault copy never changes vault records |

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

**Note:** Statement registry (N2, F11.S01.M01), all signed by the relay key pinned when users selected the relay: classrup.moderation.reasons/v1 { relayId, actionId, caseRef, kind, subjectKey, targetRef { type, id, cid? }, ruleRefs, factsSummary, restrictedCapabilities?, expiresAt?, appealDeadlineAt, scope: this_relay_only, replacesActionId?, issuedAt } and classrup.moderation.reversal/v1 { relayId, actionId, reasonsStatementCid, targetRef { type, id, cid? }, reason, replacedByActionId?, issuedAt }, where relayId is the issuing relay DID and, for a listing, targetRef.id is the listingId and targetRef.cid the listing projection statementCid (to the subject, sealed into the subject's mailbox through F08.S01.M01 comms.mailbox.put with a content-free push through notify.notification.dispatch, N17; F01.S01.M03 bazaar.publication.receive_relay_notice binds each notice to one delivery by relayId, actionId and targetRef), classrup.moderation.advisory/v1 { advisoryId, seq, targetCid, ruleRef, advice: label|hide_suggested, issuedAt, expiresAt? } and classrup.moderation.advisoryretraction/v1 { seq, retractsAdvisoryCid, reason } (public feed, opt-in for subscribers in F12.S01.M01). Moderation never produces classrup.federation.tombstone/v1; only authors tombstone their own content. Index effects are applied by F06.S01.M01 from moderation.action.applied to the targetRef document only, profile hosting effects by F07.S02.M02 in relay runtime only; no consumer changes vault records. Host-policy records (moderation.action.record_host_policy) are called by F04.S02.M03, which depends on this module; this module does not depend on F04. Privacy ports (N6): ExportSectionPort (section moderation.actions), DeletionPort (pseudonymize subjectKey on relays, delete or pseudonymize vault copies) and RetentionPurgePort (RET-EVIDENCE, internal notes after 180 days) are registered with F10.S01.M03, F10.S01.M04 and F10.S01.M02.

### Example

```
POST https://relay.example/api/v1/cmd/moderation.action.apply   (relay command, moderator token)
Idempotency-Key: 0192f3b8-0000-7000-8000-000000000d01
{ "caseId": "0192f3b4-5555-7000-8000-000000000005", "expectedRevision": 2, "kind": "remove_from_index", "subjectKey": "did:key:z6MkAuthorExample",
  "targetType": "listing", "targetId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "targetCid": "sha256-aa01…", "ruleRefs": ["POL-FRAUD-001@1"],
  "factsSummary": "Listing asks buyers to pay by gift card before showing the item, which matches rule POL-FRAUD-001.", "expiresInMs": null, "closeCase": false }
-> 201 { "actionId": "0192f3b8-3333-7000-8000-000000000003", "revision": 1, "reasonsStatementCid": "sha256-bb12…", "reasonsIssuedAt": "2026-11-04T10:00:00Z", "status": "pending_notice" }
mailbox acknowledges the reasons statement -> active; emits moderation.action.applied { origin: "relay", caseSource: "report", targetType: "listing", targetRef: { "type": "listing", "id": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "cid": "sha256-aa01…" }, reasonsIssuedAt: "2026-11-04T10:00:00Z", … }
in-process moderation.action.record_host_policy { "source": "auction_review", "hostRef": "0192f3c9-0000-7000-8000-000000000e01", "kind": "remove_from_index", "subjectKey": "did:key:z6MkSellerExample", "targetRef": { "type": "auction", "id": "0192f3c9-1111-7000-8000-000000000e02" }, "ruleRefs": ["POL-FRAUD-002@1"], "factsSummary": "The host voided this auction result because the seller placed bids through a second key linked to the seller account.", "deciderKey": "did:key:z6MkModB", "proposerKey": "did:key:z6MkModA" }
-> { "actionId": "0192f3c9-2222-7000-8000-000000000e03", "caseId": "0192f3c9-3333-7000-8000-000000000e04", "status": "pending_notice", "created": true }
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
| TEST-PS-096-09.T27 | integration | PS-096-01.R06, PS-096-04.R08, PS-096-02.R05, PS-096-05.R06 | F04.S02.M03 contract fixture confirms a void (seller_fraud) for auction A with no open case and for auction B with a report case open; a record whose proposer equals the decider; an HTTP request to record_host_policy | A: case opened with source auction_review and assigned to the confirming moderator, remove_from_index with targetRef { auction, A }, subject the seller, reasons statement queued, actionId returned, case resolved actioned; B: action attached to the open case; VALIDATION_FAILED; no route |
| TEST-PS-096-09.T29 | contract | PS-096-01.R05, PS-096-04.R06 | apply remove_from_index on listing L with targetCid, apply on an account case, then revert both; inspect events and statements with the F06.S01.M01 and F01.S01.M03 contract fixtures | applied and reverted carry targetRef { listing, L, cid } or { account, subjectKey } and caseSource; reasons/v1 and reversal/v1 carry relayId, actionId and targetRef with the listingId and projection statementCid; the index fixture removes only L's document; the publication fixture binds each notice to one delivery |
| TEST-PS-096-09.T30 | contract | PS-096-04.R07 | action.applied and action.reverted delivered to the F07.S02.M02 and F06.S01.M01 relay runtime fixtures and derived in a subject vault | relay copies stop and resume serving only the targetRef item; no vault record changes on either origin |
| TEST-PS-096-09.T31 | integration | PS-096-01.R06, PS-096-04.R08 | the host-policy action is appealed through F12.S01.M03 and overturned | moderation.appeal.decided carries the actionId the hosting module stored; the action is reverted with appeal_overturned and a reversal statement; the reviewer's principal differs from proposer and decider |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M01, F12.S01.M02, F12.S03.M03, F06.S01.M01, F08.S01.M01, F07.S02.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
