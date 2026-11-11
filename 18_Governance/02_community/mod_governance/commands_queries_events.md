# PS-147-04 — Commands, queries and events: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-04.R01** Publisher commands (draft, request_cosign, open, withdraw, authority_list draft and release) run in the publisher's vault, decide runs in the decider's own vault and cosign in the co-signer's vault; every command that signs a statement takes relayIds[] and returns syncState prepared.
- **PS-147-04.R02** post_comment and withdraw_comment are vault commands in the member's vault producing classrup.governance.policy_comment/v1 and an author-signed classrup.federation.tombstone/v1; accept, relay_withdraw and hide are relay commands and relay_list is a relay query on the publisher's relay; vaults ingest comments only through governance.policy_comment.receive.
- **PS-147-04.R03** receive is a vault command in any vault that verifies and stores proposal, decision, withdrawal and co-sign statements from trusted publishers; verify is a pure query used by F18.S01.* and F18.S02.M02 that checks publisher, content digest, anchored period and validity at the activation time asOf.
- **PS-147-04.R04** governance.policy_proposal.decided carries the approved proposedChange (or its cid when larger than 16 KiB), proposalStatementCid, decisionCid and changeDigest, so consumers such as F12.S02.M03 need no second lookup; targetType platform_policy maps to an F12 PolicyRule.
- **PS-147-04.R05** Trusted publishers and pending statements change only through explicit owner commands (trusted_publisher add, remove, pause and resume; pending_statement apply and refuse); sync ingestion can never add trust, and other F18 modules hold untrusted statements through pending_statement.hold.
- **PS-147-04.R06** Every statement type of this module is registered in the F11.S01.M01 statement registry with audience, signer role, role resolution and maxAge (N2), and the vault acts only on statements its receiving path accepted.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `governance.policy_proposal.draft` | governance.policy_proposal.author | [vault-local, publisher] { proposalId?, expectedRevision?, title, summary, targetType, targetRefs, proposedChange, changelogEntry, commentPeriodHours?, expedited?, expeditedReason?, coSignerId? } | { proposalId, revision, changeDigest, status: draft } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_PROPOSAL_PERIOD_INVALID, GOVERNANCE_PROPOSAL_LIMIT |  | yes (Idempotency-Key) |
| `governance.policy_proposal.request_cosign` | governance.policy_proposal.publish | [vault-local, publisher + statement classrup.governance.policy_proposal/v1 sealed to the co-signer's mailbox] { proposalId, expectedRevision } | { proposalId, revision, proposalCid, status: draft, syncState: prepared } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_PROPOSAL_PERIOD_INVALID |  | yes (Idempotency-Key) |
| `governance.policy_proposal.cosign` | governance.policy_proposal.cosign | [vault-local, co-signer + statement classrup.governance.policy_cosign/v1] { proposalCid, relayIds[] } | { proposalCid, cosignCid, syncState: prepared } | NOT_FOUND, VALIDATION_FAILED, GOVERNANCE_PROPOSAL_SELF_DECISION, GOVERNANCE_PROPOSAL_PERIOD_INVALID |  | yes (Idempotency-Key) |
| `governance.policy_proposal.open` | governance.policy_proposal.publish | [vault-local, publisher + statement classrup.governance.policy_proposal/v1] { proposalId, expectedRevision, relayIds[] } | { proposalId, revision, proposalCid, plannedCommentEndsAt (claim), statementCid, syncState: prepared } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, GOVERNANCE_PROPOSAL_PERIOD_INVALID | governance.policy_proposal.opened | yes (Idempotency-Key) |
| `governance.policy_proposal.decide` | governance.policy_proposal.decide | [vault-local, decider + statement classrup.governance.policy_decision/v1 { proposalId, proposalCid, publisherId, outcome, rationale, targetType, targetRefs, changeDigest, proposalReceipt, acknowledgedCommentCids, decidedAt }] { proposalCid, outcome: approved\|rejected, rationale, acknowledgedCommentCids? (<= 500), relayIds[] } | { proposalId, status, decisionCid, statementCid, validUntil (claim until the decision receipt exists), syncState: prepared } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED, GOVERNANCE_PROPOSAL_SELF_DECISION | governance.policy_proposal.decided | yes (Idempotency-Key) |
| `governance.policy_proposal.withdraw` | governance.policy_proposal.publish | [vault-local, publisher + statement classrup.governance.policy_withdrawal/v1 { proposalId, proposalCid, reason }] { proposalId, expectedRevision, relayIds[] } | { proposalId, revision, statementCid, syncState: prepared } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `governance.policy_proposal.receive` | governance.policy_proposal.receive | [vault-local, inbound statement] { envelope, receipt?, provenance } for policy_proposal, policy_decision, policy_withdrawal and policy_cosign | { proposalId?, accepted: boolean, status?, quarantineReason?, pendingId?, conflicted?: boolean } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION, GOVERNANCE_PROPOSAL_SELF_DECISION, GOVERNANCE_PROPOSAL_NOT_VALID | governance.policy_proposal.decided | yes (Idempotency-Key) |
| `governance.policy_proposal.relay_upload` | governance.policy_proposal.relay_publish | [relay command] { envelope } for policy_proposal, policy_decision, policy_withdrawal, policy_cosign and authority_list statements | { statementCid, relayReceipt: classrup.platform.relay_receipt/v1 } | VALIDATION_FAILED, FORBIDDEN, PAYLOAD_TOO_LARGE, RATE_LIMITED, GOVERNANCE_PROPOSAL_SELF_DECISION | governance.policy_proposal.decided | yes (Idempotency-Key) |
| `governance.authority_list.draft` | governance.authority_list.author | [vault-local, publisher] { entries: [{ key: did:key, role: decider\|cosigner }] (1..10), expectedVersion } | { version, entries, status: draft } | VALIDATION_FAILED, CONFLICT_REVISION, GOVERNANCE_AUTHORITY_LIST_INVALID |  | yes (Idempotency-Key) |
| `governance.authority_list.release` | governance.authority_list.author | [vault-local, publisher + statement classrup.governance.authority_list/v1] { expectedVersion, relayIds[] } | { version, statementCid, syncState: prepared } | NOT_FOUND, CONFLICT_REVISION, GOVERNANCE_AUTHORITY_LIST_INVALID |  | yes (Idempotency-Key) |
| `governance.authority_list.receive` | governance.authority_list.apply | [vault-local, inbound statement] { envelope, receipt?, provenance } | { publisherId, version?, stored: boolean, pendingId? } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION, GOVERNANCE_AUTHORITY_LIST_INVALID |  | yes (Idempotency-Key) |
| `governance.policy_comment.post` | governance.policy_comment.create | [vault-local + statement classrup.governance.policy_comment/v1] { proposalCid, body, relayId } | { commentId, statementCid, syncState: prepared } | VALIDATION_FAILED, NOT_FOUND, EXPIRED, GOVERNANCE_COMMENT_LIMIT, RATE_LIMITED |  | yes (Idempotency-Key) |
| `governance.policy_comment.withdraw` | governance.policy_comment.withdraw | [vault-local, author + statement classrup.federation.tombstone/v1 { target: comment cid, reason: author_withdrawal }] { commentId, relayIds[] } | { commentId, status: withdrawn, tombstoneCid, syncState: prepared } | NOT_FOUND, CONFLICT_STATE, FORBIDDEN |  | yes (Idempotency-Key) |
| `governance.policy_comment.receive` | governance.policy_comment.receive | [vault-local, inbound statement] { envelope (policy_comment or its tombstone), receipt?, provenance } | { commentId?, stored: boolean, removed?: boolean } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION, EXPIRED |  | yes (Idempotency-Key) |
| `governance.policy_comment.accept` | governance.policy_comment.relay_accept | [relay command] { envelope } | { commentId, relayReceipt: classrup.platform.relay_receipt/v1 meaning accepted for hosting by this relay } | VALIDATION_FAILED, EXPIRED, GOVERNANCE_COMMENT_LIMIT, RATE_LIMITED, FORBIDDEN |  | yes (Idempotency-Key) |
| `governance.policy_comment.relay_withdraw` | governance.policy_comment.relay_tombstone | [relay command] { tombstoneEnvelope } | { commentCid, removed: true, relayReceipt } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN |  | yes (Idempotency-Key) |
| `governance.policy_comment.hide` | governance.policy_comment.relay_hide | [relay command] { commentId, reasonKey } | { commentId, status: hidden } | NOT_FOUND, FORBIDDEN |  | yes (Idempotency-Key) |
| `governance.trusted_publisher.add` | governance.trusted_publisher.manage | [vault-local, owner trust dialog only] { publisherDid, scopes: (taxonomy\|rules\|profiles\|proposals\|transparency)[], fingerprintConfirmed, pinned? } | { publisherDid, scopes, trustedAt, releasedPendingCount } | VALIDATION_FAILED, FORBIDDEN, GOVERNANCE_TRUST_LIMIT |  | yes (Idempotency-Key) |
| `governance.trusted_publisher.remove` | governance.trusted_publisher.manage | [vault-local, owner] { publisherDid, scopes? } | { publisherDid, remainingScopes } | NOT_FOUND, FORBIDDEN |  | yes (Idempotency-Key) |
| `governance.trusted_publisher.pause` | governance.trusted_publisher.manage | [vault-local, owner] { publisherDid } | { publisherDid, paused: true } | NOT_FOUND |  | yes (Idempotency-Key) |
| `governance.trusted_publisher.resume` | governance.trusted_publisher.manage | [vault-local, owner] { publisherDid } | { publisherDid, paused: false, releasedPendingCount } | NOT_FOUND |  | yes (Idempotency-Key) |
| `governance.pending_statement.hold` | governance.pending_statement.hold | [vault-local, internal: F18.S01.M01, F18.S01.M02, F18.S01.M03, F18.S02.M02] { envelope, receipt?, scope, publisherDid, reason, ownerModule } | { pendingId, expiresAt } | VALIDATION_FAILED, RATE_LIMITED |  | yes (Idempotency-Key) |
| `governance.pending_statement.apply` | governance.pending_statement.manage | [vault-local, owner] { pendingId } | { pendingId, status: applied\|pending, ownerModuleResult } | NOT_FOUND, CONFLICT_STATE, EXPIRED |  | yes (Idempotency-Key) |
| `governance.pending_statement.refuse` | governance.pending_statement.manage | [vault-local, owner] { pendingId } | { pendingId, status: refused } | NOT_FOUND, CONFLICT_STATE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `governance.policy_proposal.get` | governance.policy_proposal.read | { proposalId \| proposalCid } | { proposal: PolicyProposal, decision?, withdrawal?, cosign? } | NOT_FOUND |
| `governance.policy_proposal.list` | governance.policy_proposal.read | { publisherId?, status?, cursor?, limit <= 50 } | { items: PolicyProposal[], nextCursor? } | VALIDATION_FAILED |
| `governance.policy_proposal.changelog` | governance.policy_proposal.read | { publisherId?, targetType?, cursor?, limit <= 50 } | { items: [{ kind: decision\|authority_list, proposalId?, changelogEntry?, decidedAt?, targetType?, targetRefs?, authorityListVersion?, addedKeys?, removedKeys? }], nextCursor? } | VALIDATION_FAILED |
| `governance.policy_proposal.verify` | governance.policy_proposal.verify | { proposalId, publisherId, targetType, targetRefs, changeDigest, asOf, asOfSource: relay_receipt\|publisher_claim, priorDecisionCids? } | { valid: boolean, reason?: not_approved\|expired\|target_mismatch\|untrusted_publisher\|conflicted\|publisher_mismatch\|content_mismatch\|period_not_elapsed\|decider_unauthorized\|already_used\|decision_unavailable, decisionCid?, validUntil?, asOfIsClaim: boolean } | NOT_FOUND, GOVERNANCE_PROPOSAL_NOT_VALID |
| `governance.policy_proposal.relay_get` | governance.policy_proposal.relay_read | [relay query] { proposalId? \| statementCid? \| publisherId + kind: authority_list } | { items: [{ envelope, receipt }] } | NOT_FOUND, RATE_LIMITED |
| `governance.policy_comment.list` | governance.policy_proposal.read | { proposalId, cursor?, limit <= 100 } | { items: PolicyComment[] (visible, authors passed through filterBlocked), nextCursor? } | NOT_FOUND |
| `governance.policy_comment.relay_list` | governance.policy_comment.relay_list | [relay query] { proposalCid, since?, cursor?, limit <= 100 } | { items: [{ envelope, receipt, status }], tombstones: [{ commentCid, tombstoneCid }], nextCursor? } | NOT_FOUND, UNAUTHENTICATED, RATE_LIMITED |
| `governance.trusted_publisher.list` | governance.trusted_publisher.read | { scope? } | { items: TrustedPublisher[] } | VALIDATION_FAILED |
| `governance.trusted_publisher.check` | governance.trusted_publisher.read | { publisherDid, scope } | { trusted: boolean, paused: boolean, pinned: boolean, fingerprint } | VALIDATION_FAILED |
| `governance.pending_statement.list` | governance.pending_statement.manage | { scope?, status?, cursor?, limit <= 50 } | { items: PendingStatement[] (with diff summary from the owning module), nextCursor? } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `governance.policy_proposal.decided` | P0 | { proposalId, publisherId, deciderId, outcome: approved\|rejected\|conflicted, targetType, targetRefs, proposedChange? (<= 16 KiB) or proposedChangeCid, changeDigest, proposalStatementCid, decisionCid, changelogEntry, validUntil, scope: vault\|relay } — vault-local in each receiving vault; relay-local (scope relay) when the hosting relay stores a verified decision through relay_upload |
| `governance.policy_proposal.opened` | P0 | { proposalId, publisherId, targetType, proposalStatementCid, plannedCommentEndsAt, commentEndsAt? (anchored, once the receipt is known) } |

### Events consumed

| Type | Effect |
|---|---|
| `privacy.deletion.requested` | reversible only (N6a): pause posting new comments and hide unsent comment drafts of the deleting principal; nothing is signed and no relay is called |
| `privacy.deletion.cancelled` | undo the pause and unhide the drafts paused by privacy.deletion.requested |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| GOVERNANCE_PROPOSAL_PERIOD_INVALID | 422 | no | comment period outside 72 to 720 hours without a valid expedited justification and verified co-signature |
| GOVERNANCE_PROPOSAL_SELF_DECISION | 403 | no | decider or co-signer key equals the proposer key or is not delegated in the publisher's authority list early enough |
| GOVERNANCE_PROPOSAL_LIMIT | 409 | no | publisher already has 20 active proposals |
| GOVERNANCE_PROPOSAL_NOT_VALID | 412 | no | decision is missing, expired at the activation time, for other targets, publisher or content, conflicted, not anchored or from an untrusted publisher |
| GOVERNANCE_COMMENT_LIMIT | 409 | no | member already has 5 visible comments on this proposal |
| GOVERNANCE_AUTHORITY_LIST_INVALID | 422 | no | authority list version, entries or signer invalid |
| GOVERNANCE_TRUST_LIMIT | 409 | no | trust change not confirmed in the owner's trust dialog or the vault already trusts 10 publishers |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles (N2, registered in F11.S01.M01; role resolution "principal" means author is the principal and ext.signerKey is active in its portable document per F07.S02.M01 key_status at first sight):
| Type | Audience | Signer role (resolution) | maxAge |
|---|---|---|---|
| classrup.governance.policy_proposal/v1 | public | publisher (principal, author = payload.publisherId) | none (evidence for active configuration) |
| classrup.governance.policy_decision/v1 | public | delegated decider (roleResolution "delegated by publisher authority_list": author is listed with role decider in the publisher's latest verified authority list anchored no later than decidedAt and first listed >= 14 d before the proposal receipt; author differs from payload.publisherId) | none |
| classrup.governance.policy_withdrawal/v1 | public | publisher (principal) | none |
| classrup.governance.policy_cosign/v1 | public | delegated co-signer (roleResolution "delegated by publisher authority_list", role cosigner or decider, author = proposal coSignerId, differs from publisherId) | 60 d |
| classrup.governance.authority_list/v1 | public | publisher (principal) | none |
| classrup.governance.policy_comment/v1 | community (members of the hosting relay) | comment author (principal) | 45 d |
| classrup.federation.tombstone/v1 (comment withdrawal, format owned by F11.S01.M02) | audience of the target | target author (principal) | none |
Ports provided: PendingApplyPort registry (F18.S01.M01, F18.S01.M02, F18.S01.M03 and F18.S02.M02 register apply(envelope, receipt, { ownerConfirmed }) for their statement types) and TrustPort.check(publisherDid, scope). Ports used: ReceiptPort verification (F15.S02.M01), RateLimitPort.consume (F12.S03.M03), field classification (F10.S02.M02). Injected at the vault or relay composition root and not listed in depends_on because each already reaches this module through F10.S01.M02 -> F18.S01.M01 (FLG-2 acyclic graph): KeyStatusPort of F07.S02.M01 (applied by the F11 intake path), filterBlocked of F07.S02.M02 (N7), the F10.S01.M03 ExportSectionPort, F10.S01.M04 DeletionPort and F10.S01.M02 RetentionPurgePort registries (N6, N6a), and the F12.S03.M04 limits check run by the relay bus (N18).


### Example

```
publisher vault: dispatch("governance.policy_proposal.open", { "proposalId": "0192f3b2-...", "expectedRevision": 3, "relayIds": ["relay:berlin.example"] })
=> { "proposalId": "0192f3b2-...", "revision": 4, "proposalCid": "sha256-Pr0p...", "plannedCommentEndsAt": "2026-11-18T10:00:00.000Z", "statementCid": "sha256-Pr0p...", "syncState": "prepared" }
relay receipt for the proposal: receivedAt 2026-11-04T10:02:11Z, so the anchored commentEndsAt is 2026-11-18T10:02:11Z
member vault: dispatch("governance.policy_comment.post", { "proposalCid": "sha256-Pr0p...", "body": "Please add an appeal path.", "relayId": "relay:berlin.example" })
=> { "commentId": "0192f3b3-...", "statementCid": "sha256-C0mm...", "syncState": "prepared" } then transport_acknowledged ("accepted for hosting by relay:berlin.example")
decider vault: dispatch("governance.policy_proposal.decide", { "proposalCid": "sha256-Pr0p...", "outcome": "approved", "rationale": "Comments addressed in v2.", "acknowledgedCommentCids": ["sha256-C0mm..."], "relayIds": ["relay:berlin.example"] })
=> { "proposalId": "0192f3b2-...", "status": "approved", "decisionCid": "sha256-Yg1b...", "statementCid": "sha256-Yg1b...", "validUntil": "2026-12-19T10:00:00.000Z", "syncState": "prepared" }
query governance.policy_proposal.verify { "proposalId": "0192f3b2-...", "publisherId": "did:key:z6MkP...", "targetType": "prohibited_rule", "targetRefs": ["counterfeit_goods"], "changeDigest": "sha256-Q2hn...", "asOf": "2026-11-20T08:00:00Z", "asOfSource": "relay_receipt" }
=> { "valid": true, "decisionCid": "sha256-Yg1b...", "validUntil": "2026-12-19T10:03:40.000Z", "asOfIsClaim": false }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T05 | contract | PS-147-04.R01, PS-147-04.R02, PS-147-04.R06, PS-147-09.R02 | open, request_cosign, cosign, decide, withdraw, authority_list release, post and withdraw comment, receive | statements validate against their schemas and F11.S01.M01 registry rows (audience, signer role, resolution, maxAge); every signing command returns syncState prepared and takes relayIds |
| TEST-PS-147-09.T06 | integration | PS-147-04.R03, PS-147-02.R03, PS-147-02.R04 | verify with the exact targets, a subset, another target, publisher B citing publisher A's decision, a changed digest, asOf 31 days after the decision anchor, a prior decision cid | valid only for subset with matching publisher and digest inside the window; reasons target_mismatch, publisher_mismatch, content_mismatch, expired and already_used |
| TEST-PS-147-09.T18 | abuse | PS-147-02.R04, PS-147-04.R03, PS-147-03.R02 | proposal with openedAt backdated by 3 days; decision received 1 h after the proposal receipt; decision without a receipt | openedAt rejected (below receipt - 10 min); verify returns period_not_elapsed for both decisions |
| TEST-PS-147-09.T20 | integration | PS-147-07.R04, PS-147-04.R02 | author withdraws a comment; DeletionPort plan and sign step for a deleting principal with 3 comments; privacy.deletion.requested then cancelled | tombstone signed; relay removes the body and returns tombstone stubs in relay_list; mirrors delete it; sign step signs 3 tombstones; posting paused then resumed |
| TEST-PS-147-09.T21 | integration | PS-147-01.R04, PS-147-03.R05, PS-147-04.R05 | untrusted pack held; trust added from the dialog; sync ingestion calls trusted_publisher.add; another pending item expires; owner refuses one; owner pauses a trusted publisher, a new statement arrives, owner resumes | held item applied through PendingApplyPort; ingestion call FORBIDDEN; expired item discarded after 30 days; refused item refused; paused statement held with paused_publisher and applied on resume while applied configuration stayed in force |
| TEST-PS-147-09.T23 | contract | PS-147-04.R04 | decided event delivered to an F12.S02.M03 fixture for targetType platform_policy | payload validates; fixture builds a draft PolicyRule from proposedChange without calling get |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, F15.S02.M01, F12.S03.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
