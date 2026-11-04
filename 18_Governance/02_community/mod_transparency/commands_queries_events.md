# PS-148-04 — Commands, queries and events: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-04.R01** record_legal_request, compute and publish are vault commands in the operator's vault; publish produces the signed statement classrup.governance.transparency_report/v1 and queues it to the operator's relay.
- **PS-148-04.R02** Counter events are consumed from the relay's moderation modules and from governance.policy_proposal.decided; consumers are idempotent by event id.
- **PS-148-04.R03** receive is a vault command in any user vault that verifies and stores reports from trusted publishers; get_published and list_published are public reads on the relay and local reads in vaults.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `governance.transparency.record_legal_request` | governance.transparency.record | [vault-local, operator] { periodKey, type, outcome, count? (default 1) } | { periodKey, metric: legal_requests, dimension, count } | VALIDATION_FAILED, CONFLICT_STATE, GOVERNANCE_TRANSPARENCY_PERIOD_INVALID, RATE_LIMITED |  | yes (Idempotency-Key) |
| `governance.transparency.compute` | governance.transparency.compile | [vault-local, operator] { periodKey, coveragePercent?, correctionOf?: reportId, correctionNote? } | { reportId, version, contentCid, suppressedCellCount, totalsVisible } | VALIDATION_FAILED, CONFLICT_STATE, GOVERNANCE_TRANSPARENCY_PERIOD_INVALID, GOVERNANCE_TRANSPARENCY_SUPPRESSION |  | yes (Idempotency-Key) |
| `governance.transparency.publish` | governance.transparency.review | [vault-local, reviewer + statement classrup.governance.transparency_report/v1] { reportId, expectedRevision, contentCid, relayIds[] } | { reportId, version, statementCid, syncState: prepared } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_TRANSPARENCY_SELF_REVIEW, GOVERNANCE_TRANSPARENCY_SUPPRESSION | governance.transparency.published | yes (Idempotency-Key) |
| `governance.transparency.discard` | governance.transparency.compile | [vault-local, operator] { reportId, expectedRevision } | { reportId, status: discarded } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `governance.transparency.receive` | governance.transparency.apply | [vault-local, inbound statement] { envelope, provenance } | { reportId?, stored: boolean, quarantineReason? } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION, GOVERNANCE_TRANSPARENCY_SUPPRESSION |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `governance.transparency.get_published` | governance.transparency.read_public | { publisherId?, periodKey, version? } | { report: TransparencyReport, signatureValid: boolean } | NOT_FOUND |
| `governance.transparency.list_published` | governance.transparency.read_public | { publisherId?, cursor?, limit <= 50 } | { items: TransparencyReport[], nextCursor? } | VALIDATION_FAILED |
| `governance.transparency.preview` | governance.transparency.compile | { periodKey } | { counters (operator view), suppressionPreview, coveragePercent, daysSincePeriodEnd } | GOVERNANCE_TRANSPARENCY_PERIOD_INVALID |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `governance.transparency.published` | P0 | { reportId, publisherId, periodKey, version, contentCid, statementCid, supersedes? } |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.report.filed` | increment reports_filed for the closed-vocabulary reason in the payload |
| `moderation.action.applied` | increment actions_applied for the action type in the payload |
| `moderation.appeal.filed` | increment appeals_filed |
| `moderation.appeal.decided` | increment appeals_decided for the outcome upheld or overturned |
| `moderation.spam.detected` | increment spam_detected |
| `governance.policy_proposal.decided` | increment policy_decisions for the outcome |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| GOVERNANCE_TRANSPARENCY_PERIOD_INVALID | 422 | no | period key is malformed, not ended, or already published and frozen |
| GOVERNANCE_TRANSPARENCY_SUPPRESSION | 422 | no | a table cell between 1 and 9 would be disclosed or complementary suppression is missing |
| GOVERNANCE_TRANSPARENCY_SELF_REVIEW | 403 | no | reviewer key equals the compiler key or is not a registered operator key |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
operator vault: dispatch("governance.transparency.compute", { "periodKey": "2026-Q3", "coveragePercent": 98 })
=> { "reportId": "0192f3b5-...", "version": 1, "contentCid": "sha256-Zm9v...", "suppressedCellCount": 6, "totalsVisible": true }
reviewer vault: dispatch("governance.transparency.publish", { "reportId": "0192f3b5-...", "expectedRevision": 1, "contentCid": "sha256-Zm9v...", "relayIds": ["relay:berlin.example"] })
=> { "reportId": "0192f3b5-...", "version": 1, "statementCid": "sha256-Yg1b...", "syncState": "prepared" }
published table excerpt: { "actions_applied": { "hide": 41, "remove": "under_10", "restrict": "under_10" } }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T06 | contract | PS-148-04.R01, PS-148-04.R03, PS-148-09.R02 | compute, publish, receive | statement validates against classrup.governance.transparency_report/v1, signature verifies, published event valid |
| TEST-PS-148-09.T07 | integration | PS-148-04.R02, PS-148-06.R01 | deliver the same moderation events twice and out of order | counts equal unique events; consumer idempotent |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
