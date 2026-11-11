# PS-092-04 — Commands, queries and events: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-04.R01** Every command declares whether it is vault-local, a signed statement or a relay command, and the signatures below do so.
- **PS-092-04.R02** Receive emits moderation.appeal.filed on the relay after it verifies the signed statement, decide emits moderation.appeal.decided, and the appellant's vault derives its own moderation.appeal.decided from the verified decision statement (EVT-9).
- **PS-092-04.R03** The module consumes action events to open the 30-day window and to close open appeals as moot when the action is reverted by a moderator or expires, and consumes role revocations to reassign reviewers.
- **PS-092-04.R04** Statements are classrup.moderation.appeal/v1 and appealwithdrawal/v1 (signed by the appellant) and appealreceipt/v1, appealstatus/v1, appealdecision/v1 and appealmoot/v1 (signed by the relay key only).
- **PS-092-04.R05** The outcome enum (upheld, overturned, reduced) and the origin enum (relay, vault) of moderation.appeal.decided, and the relay-local moderation.appeal.filed event, are a stable v1 vocabulary bound by the F18.S02.M02 transparency dimensions appeals_filed and appeals_decided and its contract test T22; moot closures never produce moderation.appeal.decided, and adding, renaming or removing a value is a breaking change that needs a new major event schema (CTR-SCH-001 SCH-3) coordinated with F18.S02.M02.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.appeal.file` | moderation.appeal.file | { actionId, relayId, reasonsStatementCid, statement, attachmentHashes? } | { appealId, deadlineAt, syncState: local_committed, revision: 1 } | VALIDATION_FAILED, NOT_FOUND, MODERATION_APPEAL_WINDOW_CLOSED, MODERATION_APPEAL_DUPLICATE, FORBIDDEN |  | yes (Idempotency-Key) |
| `moderation.appeal.receive` | moderation.appeal.receive | { statement: appeal/v1 \| appealwithdrawal/v1, signature } | { receiptId, receipt: classrup.moderation.appealreceipt/v1 { appealId, statementDigest, relaySeq, relayReceivedAt }, status } | VALIDATION_FAILED, NOT_FOUND, MODERATION_APPEAL_WINDOW_CLOSED, MODERATION_APPEAL_DUPLICATE, IDEMPOTENCY_KEY_REUSED, RATE_LIMITED, FORBIDDEN | moderation.appeal.filed | yes (Idempotency-Key) |
| `moderation.appeal.decide` | moderation.appeal.decide | { appealId, expectedRevision, outcome: upheld\|overturned\|reduced, reasons, ruleIds[], reducedTo?: { kind, expiresAt?, restrictedCapabilities? } } | { appealId, revision, decisionStatementCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MODERATION_APPEAL_REVIEWER_CONFLICT, VALIDATION_FAILED, FORBIDDEN | moderation.appeal.decided | yes (Idempotency-Key) |
| `moderation.appeal.reassign` | moderation.appeal.reassign | { appealId, expectedRevision, reason: reviewer_unavailable\|reviewer_role_lost\|escalation, newReviewerKey? } | { appealId, revision, status: awaiting_reviewer\|in_review } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MODERATION_APPEAL_REVIEWER_CONFLICT, FORBIDDEN |  | yes (Idempotency-Key) |
| `moderation.appeal.withdraw` | moderation.appeal.withdraw | { appealId, expectedRevision } | { appealId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `moderation.appeal.receive_relay_statement` | moderation.appeal.receive_relay_statement | { statement: appealreceipt/v1 \| appealstatus/v1 \| appealdecision/v1 \| appealmoot/v1 } | { appealId, status, syncState, outcome?, quarantined: boolean } | FORBIDDEN, NOT_FOUND, CONFLICT_STATE | moderation.appeal.decided | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.appeal.get_mine` | moderation.appeal.read_own | { appealId } | { appeal: Appeal without reviewer key, decisionStatement?, mootNotice? } | NOT_FOUND |
| `moderation.appeal.status_for_appellant` | moderation.appeal.read_status_own | { appealId } | { receipt, status?: appealstatus/v1, decision?: appealdecision/v1, moot?: appealmoot/v1 } — relay-signed statements only, no reviewer identity | NOT_FOUND |
| `moderation.appeal.list_queue` | moderation.appeal.read_queue | { status?: awaiting_reviewer\|in_review, cursor?, limit ≤ 50 } | { items: Appeal[] sorted by deadline, nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.appeal.filed` | P2 | { appealId, actionId, appellantKey, deadlineAt, relayReceivedAt } — relay-local (EVT-8) |
| `moderation.appeal.decided` | P2 | { appealId, actionId, origin: relay\|vault, appellantKey, outcome: upheld\|overturned\|reduced, reducedTo?: { kind, expiresAt?, restrictedCapabilities? }, ruleIds, decisionStatementCid, decidedAt } — never reviewerKey; relay-local on the relay, derived in the appellant's vault from the verified decision statement (EVT-9, actor.kind federated); moot closures never emit it |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.action.applied` | relay origin: store actionId, subjectKey, deciderKey, proposerKey (host-policy records such as auction voids from F04.S02.M03) and deadlineAt = reasonsIssuedAt + 30 days for window and independence checks; vault origin: store the deadline for the appellant's UI |
| `moderation.action.reverted` | relay: reason moderator_decision or error_correction closes an open appeal on the action as moot with mootReason action_reverted, reason expired as moot with mootReason action_expired, and queues a relay-signed appealmoot/v1; reasons appeal_overturned and appeal_reduced come from this module's decision and change nothing; never emits moderation.appeal.decided |
| `security.role.revoked` | relay: when role moderator is revoked for a key that reviews in_review appeals, move them to awaiting_reviewer through moderation.appeal.reassign with reason reviewer_role_lost |
| `privacy.deletion.completed` | vault: appeals are deleted, or kept as evidence with appellantKey replaced by the payload pseudonym when the request kept evidence (DeletionPort); relay copies are pseudonymized by the DeletionPort when the relay applies the signed deletion request and stay for RET-EVIDENCE |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_APPEAL_WINDOW_CLOSED | 409 | no | the relay received the appeal more than 30 days after the signed statement of reasons |
| MODERATION_APPEAL_DUPLICATE | 409 | no | an appeal for this action exists; params.appealId |
| MODERATION_APPEAL_REVIEWER_CONFLICT | 409 | no | the reviewer's principal is the decider, the subject or a reporter of the case |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, F11.S01.M01): classrup.moderation.appeal/v1 and classrup.moderation.appealwithdrawal/v1 (signer role: a registered device key of the action's subject key); classrup.moderation.appealreceipt/v1, classrup.moderation.appealstatus/v1, classrup.moderation.appealdecision/v1 and classrup.moderation.appealmoot/v1 (signer role: the issuing relay key pinned when the user selected the relay; no reviewer signature). Relay statements to the appellant travel through F08.S01.M01 comms.mailbox.put with a content-free push (N17) and are also returned by moderation.appeal.status_for_appellant. Privacy ports (N6): ExportSectionPort (section moderation.appeals), DeletionPort and RetentionPurgePort are registered with F10.S01.M03, F10.S01.M04 and F10.S01.M02.

### Example

```
vault command moderation.appeal.file (local, Idempotency-Key 0192f3c0-0000-7000-8000-000000000c01)
{ "actionId": "0192f3b8-3333-7000-8000-000000000003", "relayId": "did:key:z6MkRelayExample", "reasonsStatementCid": "sha256-bb12…", "statement": "The item is a handmade replica sold as such; see photo 3 caption." }
-> { "appealId": "0192f3c0-4444-7000-8000-000000000004", "deadlineAt": "2026-12-04T10:00:00Z", "syncState": "local_committed", "revision": 1 }
relay POST /api/v1/cmd/moderation.appeal.receive -> 201 { "receiptId": "0192f3c0-4445-7000-8000-000000000005", "receipt": { "appealId": "0192f3c0-4444-7000-8000-000000000004", "relayReceivedAt": "2026-11-10T08:00:00Z", "sig": "…" } }
relay POST /api/v1/cmd/moderation.appeal.decide (reviewer M2, principal unrelated to decider M1, subject and reporters)
{ "appealId": "0192f3c0-4444-7000-8000-000000000004", "expectedRevision": 3, "outcome": "reduced", "reasons": "The listing is a replica but says so in photo 3; a warning fits better than removal under rule POL-COUNTERFEIT-001.", "ruleIds": ["POL-COUNTERFEIT-001@1"], "reducedTo": { "kind": "warn" } }
-> 200 { "appealId": "0192f3c0-4444-7000-8000-000000000004", "revision": 4, "decisionStatementCid": "sha256-cc34…" }   (statement signed by the relay key only)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T05 | contract | PS-092-04.R01, PS-092-04.R02, PS-092-04.R04, PS-092-09.R02 | each command, statement and event | validate against registry schemas; relay statements verify with the relay key and carry no reviewer signature or key |
| TEST-PS-092-09.T06 | integration | PS-092-04.R03, PS-092-03.R04 | action.applied then action.reverted by moderator_decision before the decision; another action reaches expiry with an appeal in_review | deadline stored; first appeal moot with action_reverted, second moot with action_expired; appealmoot statements issued; no moderation.appeal.decided and no second revert; vault shows Closed as moot, never overturned |
| TEST-PS-092-09.T15 | e2e | PS-092-01.R02, PS-092-04.R01 | mobile appellant files offline and reconnects | appeal reaches the relay, timeline shows honest states, axe zero serious issues |
| TEST-PS-092-09.T23 | integration | PS-092-04.R02 | vault receives a verified appealdecision/v1 and one with a forged signature | local moderation.appeal.decided derived with origin vault and actor.kind federated; forged one quarantined; F12.S02.M01 ignores the vault-origin event |
| TEST-PS-092-09.T24 | contract | PS-092-04.R05 | compare the outcome and origin enums of the moderation.appeal.decided schema and the relay-local moderation.appeal.filed schema with the F18.S02.M02 dimension fixture; a moot closure; a schema fixture that adds an outcome within v1 | identical values (upheld, overturned, reduced; relay, vault); no decided event for moot; the added outcome fails the contract check |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M01, F12.S01.M02, F12.S02.M03, F07.S02.M01, F08.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
