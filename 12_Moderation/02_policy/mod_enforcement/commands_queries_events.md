# PS-096-04 — Commands, queries and events: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-04.R01** Every command declares that it is a relay command and which signed statements it produces.
- **PS-096-04.R02** Case opening is driven by consumed events and by the operator command, and emits moderation.case.opened in the same transaction as the case.
- **PS-096-04.R03** Apply and revert emit action events in the same transaction, and the statement of reasons is stored before the event is dispatched.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.case.assign` | moderation.case.assign | { caseId, expectedRevision, assigneeKey? } | { caseId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN |  | yes (Idempotency-Key) |
| `moderation.case.close` | moderation.case.close | { caseId, expectedRevision, outcome: no_action\|duplicate\|content_removed_by_owner, note? } | { caseId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN | moderation.case.closed | yes (Idempotency-Key) |
| `moderation.action.apply` | moderation.action.apply | { caseId, expectedRevision, kind, subjectKey, targetRef?, restrictedCapabilities?, ruleRefs[], factsSummary, expiresInMs?, publishAdvisory?: boolean } | { actionId, revision, reasonsStatementCid, status } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MODERATION_RULE_REQUIRED, MODERATION_ACTION_LIMIT, MODERATION_LAST_ADMIN_PROTECTED, FORBIDDEN | moderation.action.applied, moderation.case.closed | yes (Idempotency-Key) |
| `moderation.action.revert` | moderation.action.revert | { actionId, expectedRevision, reason } | { actionId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FORBIDDEN | moderation.action.reverted | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.case.list` | moderation.case.read_queue | { status?, assigneeKey?, sort?: age\|reason, cursor?, limit ≤ 50 } | { items: ModerationCase[], nextCursor? } |  |
| `moderation.action.get_mine` | moderation.action.read_own | { actionId } | { action: EnforcementAction without deciderKey, reasonsStatement } | NOT_FOUND |
| `moderation.action.list_active_for_key` | moderation.action.read_restrictions | { subjectKey } | { items: { actionId, kind, restrictedCapabilities, expiresAt }[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.case.opened` | P2 | { caseId, targetType, targetId, subjectKey, source, reportRefs } |
| `moderation.case.closed` | P2 | { caseId, outcome, reportRefs } |
| `moderation.action.applied` | P2 | { actionId, caseId, kind, subjectKey, ruleRefs, expiresAt, reasonsStatementCid } |
| `moderation.action.reverted` | P2 | { actionId, caseId, subjectKey, reason } |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.report.filed` | relay side: open a case for the target or attach the report to the existing open case |
| `moderation.spam.detected` | open or extend a case with source spam_detection when score ≥ 80; lower scores only add signals |
| `auctions.shill.suspected` | open or extend a case with source shill_suspicion for the auction hosted on this relay |
| `moderation.appeal.decided` | revert or reduce the contested action when outcome is overturned or reduced |
| `governance.prohibited_rule.changed` | mark open cases that cite the changed prohibited-goods rule for moderator review |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_RULE_REQUIRED | 422 | no | an action needs 1..5 published policy rule references |
| MODERATION_ACTION_LIMIT | 422 | no | expiry or kind exceeds the role's limit |
| MODERATION_LAST_ADMIN_PROTECTED | 409 | no | the relay's last admin or operator key cannot be suspended |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
POST https://relay.example/api/v1/cmd/moderation.action.apply   (relay command, moderator token)
Idempotency-Key: 0192f3b8-0000-7000-8000-000000000d01
{ "caseId": "0192f3b4-5555-7000-8000-000000000005", "expectedRevision": 2, "kind": "remove_from_index", "subjectKey": "did:key:z6MkAuthorExample",
  "targetRef": "sha256-aa01…", "ruleRefs": ["POL-FRAUD-001@1"], "factsSummary": "Listing asks buyers to pay by gift card before showing the item, which matches rule POL-FRAUD-001.", "expiresInMs": null }
-> 201 { "actionId": "0192f3b8-3333-7000-8000-000000000003", "revision": 1, "reasonsStatementCid": "sha256-bb12…", "status": "pending_notice" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T05 | integration | PS-096-03.R03, PS-096-04.R03 | appeal overturn event and expiry | action reverted, reversal statement signed, original statement unchanged |
| TEST-PS-096-09.T06 | contract | PS-096-04.R01, PS-096-04.R02, PS-096-09.R02 | each command, statement and event | validate against registry schemas; statements verify with relay key |
| TEST-PS-096-09.T07 | integration | PS-096-04.R03, PS-096-06.R03 | report.filed delivered twice; spam.detected score 79 and 80 | one case; 79 adds signals only, 80 opens or extends a case |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
