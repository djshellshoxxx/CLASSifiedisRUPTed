# PS-096-01 — Domain schema: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-01.R01** A ModerationCase stores subject target and key, source, linked report receipt IDs and snapshot IDs, action IDs, assignee, status and outcome, with tenant and revision per CTR-ID-001.
- **PS-096-01.R02** An EnforcementAction stores kind, target, scope, policy rule IDs with versions, facts summary, decider, expiry, statement-of-reasons content id and issue time, and status; actions are never silent and always carry rule IDs.
- **PS-096-01.R03** Cases and actions are P2 between the relay's moderators and the subject, retained under RET-EVIDENCE, and never federated; the only outward statements are the subject's statement of reasons and reversal and the opt-in advisory with its retraction.
- **PS-096-01.R04** A case can carry several actions (for example removal plus a warning) and stays assigned after an action until a moderator closes it, unless the apply asks to close it.
- **PS-096-01.R05** Every action stores targetRef { type, id, cid? } naming exactly the content it concerns (cid is the signed projection's content id when known, for a listing its statementCid), so index and hosting consumers act only on that item, and type account is the only form that concerns every document of the subject key.
- **PS-096-01.R06** A host-policy action recorded for a hosting module is an ordinary relay action with caseSource auction_review, kind remove_from_index, targetRef { type auction, id auctionId }, the seller as subjectKey, in-force ruleRefs, a factsSummary, the confirming moderator as deciderKey and the proposing moderator as proposerKey, so it has a statement of reasons and an appeal route like any other action.

## Specification

### ModerationCase

Schema `classrup.moderation.case/v1` · storage **relay** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay hosting scope |
| subjectKey | did:key — author or account key the case concerns |
| targetType | enum — listing \| auction \| message \| profile \| review \| bid \| offer \| attachment \| cycle_proposal \| account |
| targetId | string — content uuidv7, or the subject did:key for targetType account |
| reportRefs | string[] — up to 200 report receipt IDs from F12.S01.M01; reporter identities not stored here |
| snapshotIds | uuidv7[] — up to 20 EvidenceSnapshot IDs |
| actionIds | uuidv7[] — up to 10 EnforcementAction IDs applied on this case |
| source | enum — report \| spam_detection \| shill_suspicion \| risk_review \| operator \| auction_review |
| openReason? | string — 10..500 code points, operator-opened cases |
| assigneeKey? | did:key — moderator working the case |
| status | enum — open \| assigned \| resolved |
| outcome? | enum — actioned \| no_action \| duplicate \| content_removed_by_owner |
| notes | string[] — internal notes, each ≤ 2000 code points, max 100 |
| reviewFlags? | object[] — up to 20 { reason: prohibited_rule_changed, publisherId, ruleKey, ruleId, change: activated\|retired\|emergency_expired, citedRuleRef, flaggedAt } set from relay-scope governance.prohibited_rule.changed; shown as a queue badge until the case is resolved; never change an action |
| revision | int — CTR-ID-001 ID-4 |
| openedAt | timestamp — RFC 3339 UTC, relay clock |
| closedAt? | timestamp — RFC 3339 UTC |

**Invariants**
- At most one non-resolved case exists per (tenantId, targetType, targetId).
- status resolved implies outcome is set; outcome actioned implies actionIds is not empty.
- Notes and reporter references are never included in any statement sent to the subject.

### EnforcementAction

Schema `classrup.moderation.enforcementaction/v1` · storage **relay+device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay hosting scope |
| caseId | uuidv7 — ref ModerationCase |
| kind | enum — warn \| remove_from_index \| restrict_feature \| suspend_relay_access |
| subjectKey | did:key — affected key |
| targetType | enum — as ModerationCase.targetType |
| targetId | string — content id or subject key for account actions |
| targetRef | object — { type: targetType, id: targetId, cid?: content id (sha256-…) of the exact signed projection the action concerns, for a listing the projection statementCid }; always set; type account means every document of subjectKey on this relay |
| restrictedCapabilities? | string[] — relay capabilities denied, 1..20, never the protected appeal, own-read, export or deletion capabilities |
| ruleRefs | string[] — policy rule IDs with versions in force at appliedAt, e.g. POL-SPAM-001@2, 1..5 required |
| factsSummary | string — 50..2000 code points shown to the subject |
| deciderKey? | did:key — moderator who decided; relay copy only, recorded for appeal independence; absent in the vault copy |
| proposerKey? | did:key — host-policy records only: the moderator who proposed the decision the decider confirmed (F04.S02.M03 two-moderator rule); relay copy only, checked for appeal independence like deciderKey |
| caseSource | enum — the case source at apply (report \| spam_detection \| shill_suspicion \| risk_review \| operator \| auction_review); auction_review marks a host-policy record |
| hostRef? | string — host-policy records only: id of the hosting module record (auction review id), unique per (tenantId, caseSource) |
| automated | boolean — true only for deterministic velocity throttles; others always have a human decider |
| expiresAt? | timestamp — max 365 days for restrict, 90 days for suspend by moderators, absent only for operator-applied permanent suspension |
| reasonsStatementCid | string — content id of the relay-signed statement of reasons |
| reasonsIssuedAt | timestamp — relay-signed issue time of the statement of reasons (starts the appeal window) |
| noticeState | enum — prepared \| transport_acknowledged (subject mailbox acknowledgement of the statement) |
| advisoryCid? | string — content id of the published advisory, when publishAdvisory was set |
| replacesActionId? | uuidv7 — the contested action this one replaces after an appeal outcome reduced |
| status | enum — pending_notice \| active \| reverted \| expired |
| revertReason? | enum — moderator_decision \| appeal_overturned \| appeal_reduced \| error_correction \| expired |
| revision | int — CTR-ID-001 ID-4 |
| appliedAt | timestamp — RFC 3339 UTC, relay clock |

**Invariants**
- Every action has 1..5 ruleRefs that F12.S02.M03 reported in force at appliedAt, a factsSummary, a reasonsStatementCid and a reasonsIssuedAt.
- kind is never a hidden or shadow restriction; the subject can always retrieve the statement of reasons.
- deciderKey's principal differs from the subject's and from the reviewer of any appeal on the action.
- status expired implies revertReason expired; a replacement action references a contested action whose revertReason is appeal_reduced.
- caseSource auction_review implies kind remove_from_index, targetRef.type auction, hostRef, deciderKey and proposerKey set with different principals, and at most one action per (tenantId, hostRef).

### Storage DDL

```sql
CREATE TABLE moderation_case (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_key TEXT NOT NULL, target_type TEXT NOT NULL,
  target_id TEXT NOT NULL, source TEXT NOT NULL, status TEXT NOT NULL, assignee_key TEXT, revision INTEGER NOT NULL,
  opened_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_case_open ON moderation_case(tenant_id, target_type, target_id) WHERE status != 'resolved';
CREATE TABLE moderation_action (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, case_id TEXT NOT NULL, kind TEXT NOT NULL, subject_key TEXT NOT NULL,
  status TEXT NOT NULL, expires_at TEXT, replaces_action_id TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX moderation_action_subject ON moderation_action(tenant_id, subject_key, status);
CREATE INDEX moderation_action_case ON moderation_action(tenant_id, case_id);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T01 | unit | PS-096-01.R01, PS-096-01.R02, PS-096-02.R01 | apply remove_from_index with a valid in-force rule and facts | action stored with ruleRefs, target fields, statement CID and reasonsIssuedAt; case stays assigned |
| TEST-PS-096-09.T12 | integration | PS-096-01.R03, PS-096-07.R01, PS-096-07.R02 | subject's signed deletion request applied on the relay after an action; legal hold present; outbound traffic captured | pseudonymized case kept; hold prevents purge; only reasons, reversal, advisory and retraction statements ever left the relay |
| TEST-PS-096-09.T17 | integration | PS-096-01.R04, PS-096-04.R02 | operator opens an account case with moderation.case.open; moderator applies remove_from_index then warn on that case; then closes it actioned | case.opened emitted; two actions on one case; case resolved actioned only by the close |
| TEST-PS-096-09.T19 | integration | PS-096-03.R05, PS-096-01.R03 | action with advisory expires; another is overturned on appeal; subscriber vault syncs the feed | advisories carry expiresAt; retraction published with seq and advisory cid; subscriber drops both labels |
| TEST-PS-096-09.T27 | integration | PS-096-01.R06, PS-096-04.R08, PS-096-02.R05, PS-096-05.R06 | F04.S02.M03 contract fixture confirms a void (seller_fraud) for auction A with no open case and for auction B with a report case open; a record whose proposer equals the decider; an HTTP request to record_host_policy | A: case opened with source auction_review and assigned to the confirming moderator, remove_from_index with targetRef { auction, A }, subject the seller, reasons statement queued, actionId returned, case resolved actioned; B: action attached to the open case; VALIDATION_FAILED; no route |
| TEST-PS-096-09.T29 | contract | PS-096-01.R05, PS-096-04.R06 | apply remove_from_index on listing L with targetCid, apply on an account case, then revert both; inspect events and statements with the F06.S01.M01 and F01.S01.M03 contract fixtures | applied and reverted carry targetRef { listing, L, cid } or { account, subjectKey } and caseSource; reasons/v1 and reversal/v1 carry relayId, actionId and targetRef with the listingId and projection statementCid; the index fixture removes only L's document; the publication fixture binds each notice to one delivery |
| TEST-PS-096-09.T31 | integration | PS-096-01.R06, PS-096-04.R08 | the host-policy action is appealed through F12.S01.M03 and overturned | moderation.appeal.decided carries the actionId the hosting module stored; the action is reverted with appeal_overturned and a reversal statement; the reviewer's principal differs from proposer and decider |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M01, F12.S01.M02, F12.S03.M03, F06.S01.M01, F08.S01.M01, F07.S02.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
