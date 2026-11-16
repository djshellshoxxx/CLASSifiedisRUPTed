# PS-092-04 — Commands, queries and events: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-04.R01** Every command declares whether it is vault-local, a signed statement or a relay command, and the signatures below do so.
- **PS-092-04.R02** File emits moderation.appeal.filed on the relay after it verifies the signed statement and emits moderation.appeal.decided when a decision is issued.
- **PS-092-04.R03** The module consumes action events to open the 30-day window and to close appeals on actions that are reverted first.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.appeal.file` | moderation.appeal.file | { actionId, reasonsStatementCid, statement, attachmentHashes? } | { appealId, deadlineAt, syncState: local_committed, revision: 1 } | VALIDATION_FAILED, NOT_FOUND, MODERATION_APPEAL_WINDOW_CLOSED, MODERATION_APPEAL_DUPLICATE, FORBIDDEN |  | yes (Idempotency-Key) |
| `moderation.appeal.receive` | moderation.appeal.receive | { appealStatement, signature } | { receipt: statement classrup.moderation.appealreceipt/v1 signed by relay, status } | VALIDATION_FAILED, NOT_FOUND, MODERATION_APPEAL_WINDOW_CLOSED, MODERATION_APPEAL_DUPLICATE, RATE_LIMITED, FORBIDDEN | moderation.appeal.filed | yes (Idempotency-Key) |
| `moderation.appeal.decide` | moderation.appeal.decide | { appealId, expectedRevision, outcome: upheld\|overturned\|reduced, reasons, ruleIds[], reducedTo? } | { appealId, revision, decisionStatementCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MODERATION_APPEAL_REVIEWER_CONFLICT, VALIDATION_FAILED, FORBIDDEN | moderation.appeal.decided | yes (Idempotency-Key) |
| `moderation.appeal.withdraw` | moderation.appeal.withdraw | { appealId, expectedRevision } | { appealId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.appeal.get_mine` | moderation.appeal.read_own | { appealId } | { appeal: Appeal without reviewer key, decisionStatement? } | NOT_FOUND |
| `moderation.appeal.list_queue` | moderation.appeal.read_queue | { status?: awaiting_reviewer\|in_review, cursor?, limit ≤ 50 } | { items: Appeal[] sorted by deadline, nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.appeal.filed` | P2 | { appealId, actionId, appellantKey, deadlineAt } |
| `moderation.appeal.decided` | P2 | { appealId, actionId, outcome, reducedTo?, ruleIds, decisionStatementCid } |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.action.applied` | compute and store the appeal deadline for the action from the relay-signed statement of reasons time |
| `moderation.action.reverted` | close an open appeal on the action as moot with outcome overturned and issue the decision notice |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_APPEAL_WINDOW_CLOSED | 409 | no | more than 30 days passed since the signed statement of reasons |
| MODERATION_APPEAL_DUPLICATE | 409 | no | an appeal for this action exists; params.appealId |
| MODERATION_APPEAL_REVIEWER_CONFLICT | 409 | no | the reviewer made the original decision |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command moderation.appeal.file (local, Idempotency-Key 0192f3c0-0000-7000-8000-000000000c01)
{ "actionId": "0192f3b8-3333-7000-8000-000000000003", "reasonsStatementCid": "sha256-bb12…", "statement": "The item is a handmade replica sold as such; see photo 3 caption." }
-> { "appealId": "0192f3c0-4444-7000-8000-000000000004", "deadlineAt": "2026-12-04T10:00:00Z", "syncState": "local_committed", "revision": 1 }
relay POST /api/v1/cmd/moderation.appeal.decide (reviewer key K2 differs from decider key K1)
-> 200 { "appealId": "0192f3c0-4444-7000-8000-000000000004", "revision": 3, "decisionStatementCid": "sha256-cc34…" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T05 | contract | PS-092-04.R01, PS-092-04.R02, PS-092-09.R02 | each command, statement and event | validate against registry schemas; decision statement signature verifies |
| TEST-PS-092-09.T06 | integration | PS-092-04.R03 | action.applied then action.reverted before appeal decision | deadline stored; appeal closed as moot with outcome overturned |
| TEST-PS-092-09.T15 | e2e | PS-092-01.R02, PS-092-04.R01 | mobile appellant files offline and reconnects | appeal reaches the relay, timeline shows honest states, axe zero serious issues |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
