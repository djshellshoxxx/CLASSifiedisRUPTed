# PS-096-01 — Domain schema: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-01.R01** A ModerationCase stores subject target and key, linked report IDs and snapshot IDs, assignee, status and outcome, with tenant and revision per CTR-ID-001.
- **PS-096-01.R02** An EnforcementAction stores kind, scope, policy rule IDs with versions, facts summary, decider, expiry, statement-of-reasons content id and status; actions are never silent and always carry rule IDs.
- **PS-096-01.R03** Cases and actions are P2 between the relay's moderators and the subject, retained under RET-EVIDENCE, and never federated except as signed advisory or tombstone statements.

## Specification

### ModerationCase

Schema `classrup.moderation.case/v1` · storage **relay** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay hosting scope |
| subjectKey | did:key — author or account key the case concerns |
| targetType | enum — listing \| message \| profile \| review \| bid \| offer \| attachment \| cycle_proposal \| account |
| targetId | uuidv7 — content or account under review |
| reportRefs | string[] — up to 200 report receipt IDs, reporter identities not stored here |
| snapshotIds | uuidv7[] — up to 20 EvidenceSnapshot IDs |
| source | enum — report \| spam_detection \| shill_suspicion \| operator |
| assigneeKey? | did:key — moderator working the case |
| status | enum — open \| assigned \| resolved |
| outcome? | enum — actioned \| no_action \| duplicate \| content_removed_by_owner |
| notes | string[] — internal notes, each ≤ 2000 code points, max 100 |
| revision | int — CTR-ID-001 ID-4 |
| openedAt | timestamp — RFC 3339 UTC, relay clock |
| closedAt? | timestamp — RFC 3339 UTC |

**Invariants**
- At most one non-resolved case exists per (tenantId, targetType, targetId).
- status resolved implies outcome is set; outcome actioned implies at least one EnforcementAction with this case ID.
- Notes and reporter references are never included in any statement sent to the subject.

### EnforcementAction

Schema `classrup.moderation.enforcementaction/v1` · storage **relay** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay hosting scope |
| caseId | uuidv7 — ref ModerationCase |
| kind | enum — warn \| remove_from_index \| restrict_feature \| suspend_relay_access |
| subjectKey | did:key — affected key |
| targetRef? | string — content id removed from the index |
| restrictedCapabilities? | string[] — relay capabilities denied, up to 20 |
| ruleRefs | string[] — policy rule IDs with versions, e.g. POL-SPAM-001@2, 1..5 required |
| factsSummary | string — 50..2000 code points shown to the subject |
| deciderKey | did:key — moderator who decided; recorded for appeal independence |
| automated | boolean — true only for deterministic velocity throttles; others always have a human decider |
| expiresAt? | timestamp — max 365 days for restrict, 90 days for suspend by moderators, absent only for operator-applied permanent suspension |
| reasonsStatementCid | string — content id of the relay-signed statement of reasons |
| status | enum — pending_notice \| active \| reverted \| expired |
| revertReason? | enum — moderator_decision \| appeal_overturned \| appeal_reduced \| error_correction |
| revision | int — CTR-ID-001 ID-4 |
| appliedAt | timestamp — RFC 3339 UTC, relay clock |

**Invariants**
- Every action has ≥ 1 ruleRef that exists and was published in F12.S02.M03, a factsSummary and a reasonsStatementCid.
- kind is never a hidden or shadow restriction; the subject can always retrieve the statement of reasons.
- deciderKey differs from the reviewer of any appeal on the action.

### Storage DDL

```sql
CREATE TABLE moderation_case (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_key TEXT NOT NULL, target_type TEXT NOT NULL,
  target_id TEXT NOT NULL, status TEXT NOT NULL, assignee_key TEXT, revision INTEGER NOT NULL, opened_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_case_open ON moderation_case(tenant_id, target_type, target_id) WHERE status != 'resolved';
CREATE TABLE moderation_action (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, case_id TEXT NOT NULL, kind TEXT NOT NULL, subject_key TEXT NOT NULL,
  status TEXT NOT NULL, expires_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX moderation_action_subject ON moderation_action(tenant_id, subject_key, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T01 | unit | PS-096-01.R01, PS-096-01.R02, PS-096-02.R01 | apply remove_from_index with valid rule and facts | action stored with ruleRefs and statement CID; case resolved actioned |
| TEST-PS-096-09.T12 | integration | PS-096-01.R03, PS-096-07.R01, PS-096-07.R02 | subject deletes own account after action | pseudonymized case kept; legal hold prevents purge |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
