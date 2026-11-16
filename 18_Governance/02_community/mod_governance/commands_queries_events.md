# PS-147-04 — Commands, queries and events: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-04.R01** Publisher commands (draft, open, decide, withdraw) are vault commands in the publisher's vault; open, decide and withdraw produce signed statements (policy_proposal, policy_decision, policy_withdrawal).
- **PS-147-04.R02** post_comment is a vault command in the commenting member's vault that produces classrup.governance.policy_comment/v1; accept_comment and hide_comment are relay commands on the publisher's relay.
- **PS-147-04.R03** receive is a vault command in any vault that verifies and stores proposal, decision and withdrawal statements from trusted publishers; verify is a pure query used by F18.S01.* before applying changes.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `governance.policy_proposal.draft` | governance.policy_proposal.author | [vault-local, publisher] { proposalId?, expectedRevision?, title, summary, targetType, targetRefs, proposedChange, changelogEntry, commentPeriodHours?, expedited?, expeditedReason?, coSignerId? } | { proposalId, revision, status: draft } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_PROPOSAL_PERIOD_INVALID, GOVERNANCE_PROPOSAL_LIMIT |  | yes (Idempotency-Key) |
| `governance.policy_proposal.open` | governance.policy_proposal.publish | [vault-local, publisher + statement classrup.governance.policy_proposal/v1] { proposalId, expectedRevision, relayIds[] } | { proposalId, revision, commentEndsAt, statementCid, syncState: prepared } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_PROPOSAL_PERIOD_INVALID | governance.policy_proposal.opened | yes (Idempotency-Key) |
| `governance.policy_proposal.decide` | governance.policy_proposal.decide | [vault-local, decider + statement classrup.governance.policy_decision/v1] { proposalId, expectedRevision, outcome: approved\|rejected, rationale } | { proposalId, revision, status, validUntil, statementCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, GOVERNANCE_PROPOSAL_SELF_DECISION | governance.policy_proposal.decided | yes (Idempotency-Key) |
| `governance.policy_proposal.withdraw` | governance.policy_proposal.publish | [vault-local, publisher + statement classrup.governance.policy_withdrawal/v1] { proposalId, expectedRevision } | { proposalId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `governance.policy_proposal.receive` | governance.policy_proposal.receive | [vault-local, inbound statement] { envelope, provenance } | { proposalId?, accepted: boolean, quarantineReason?, conflicted?: boolean } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION | governance.policy_proposal.decided | yes (Idempotency-Key) |
| `governance.policy_comment.post` | governance.policy_comment.create | [vault-local + statement classrup.governance.policy_comment/v1] { proposalId, body } | { commentId, syncState: prepared } | VALIDATION_FAILED, NOT_FOUND, EXPIRED, GOVERNANCE_COMMENT_LIMIT, RATE_LIMITED |  | yes (Idempotency-Key) |
| `governance.policy_comment.accept` | governance.policy_comment.relay_accept | [relay command] { envelope } | { commentId, relayReceipt: signed receipt by relay key } | VALIDATION_FAILED, EXPIRED, GOVERNANCE_COMMENT_LIMIT, RATE_LIMITED, FORBIDDEN |  | yes (Idempotency-Key) |
| `governance.policy_comment.hide` | governance.policy_comment.relay_hide | [relay command] { commentId, reasonKey } | { commentId, status: hidden } | NOT_FOUND, FORBIDDEN |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `governance.policy_proposal.get` | governance.policy_proposal.read | { proposalId } | { proposal: PolicyProposal } | NOT_FOUND |
| `governance.policy_proposal.list` | governance.policy_proposal.read | { publisherId?, status?, cursor?, limit <= 50 } | { items: PolicyProposal[], nextCursor? } | VALIDATION_FAILED |
| `governance.policy_proposal.changelog` | governance.policy_proposal.read | { publisherId?, targetType?, cursor?, limit <= 50 } | { items: [{ proposalId, changelogEntry, decidedAt, targetType, targetRefs }], nextCursor? } | VALIDATION_FAILED |
| `governance.policy_proposal.verify` | governance.policy_proposal.verify | { proposalId, targetType, targetRefs } | { valid: boolean, reason?: not_approved\|expired\|target_mismatch\|untrusted_publisher\|conflicted, validUntil? } | NOT_FOUND, GOVERNANCE_PROPOSAL_NOT_VALID |
| `governance.policy_comment.list` | governance.policy_proposal.read | { proposalId, cursor?, limit <= 100 } | { items: PolicyComment[], nextCursor? } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `governance.policy_proposal.decided` | P0 | { proposalId, publisherId, outcome, targetType, targetRefs, changelogEntry, validUntil, statementCid } |
| `governance.policy_proposal.opened` | P0 | { proposalId, publisherId, targetType, commentEndsAt, statementCid } |

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| GOVERNANCE_PROPOSAL_PERIOD_INVALID | 422 | no | comment period outside 72 to 720 hours without a valid expedited justification |
| GOVERNANCE_PROPOSAL_SELF_DECISION | 403 | no | decider key equals proposer key or is not in the authority list |
| GOVERNANCE_PROPOSAL_LIMIT | 409 | no | publisher already has 20 active proposals |
| GOVERNANCE_PROPOSAL_NOT_VALID | 412 | no | decision is missing, expired, for other targets or from an untrusted publisher |
| GOVERNANCE_COMMENT_LIMIT | 409 | no | member already has 5 visible comments on this proposal |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
publisher vault: dispatch("governance.policy_proposal.open", { "proposalId": "0192f3b2-...", "expectedRevision": 3, "relayIds": ["relay:berlin.example"] })
=> { "proposalId": "0192f3b2-...", "revision": 4, "commentEndsAt": "2026-11-18T10:00:00.000Z", "statementCid": "sha256-Zm9v...", "syncState": "prepared" }
member vault: dispatch("governance.policy_comment.post", { "proposalId": "0192f3b2-...", "body": "Please add an appeal path." })
=> { "commentId": "0192f3b3-...", "syncState": "prepared" }
decider vault: dispatch("governance.policy_proposal.decide", { "proposalId": "0192f3b2-...", "expectedRevision": 5, "outcome": "approved", "rationale": "Comments addressed in v2." })
=> { "proposalId": "0192f3b2-...", "revision": 6, "status": "approved", "validUntil": "2026-12-19T10:00:00.000Z", "statementCid": "sha256-Yg1b..." }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T05 | contract | PS-147-04.R01, PS-147-04.R02, PS-147-09.R02 | open, decide, post comment, receive | statements validate and verify; decided event payload valid |
| TEST-PS-147-09.T06 | integration | PS-147-04.R03, PS-147-02.R03 | verify with exact targets, other targets, after 31 days | valid true only for exact targets within 30 days |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
