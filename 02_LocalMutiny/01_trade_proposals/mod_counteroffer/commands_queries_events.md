# PS-012-04 — Commands, queries and events: Barter counteroffers

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M04 Barter counteroffers](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/counteroffer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-012-04.R01** create is a vault command that produces the signed statement classrup.mutiny.proposal_revision/v1; ingest is a vault command that verifies a statement from another party; queries are local.
- **PS-012-04.R02** Revision events are emitted in the same IndexedDB transaction as the state change and the statement goes to the sync outbox with states prepared, transport_acknowledged and peer_accepted.
- **PS-012-04.R03** Consumers of mutiny.proposal.revised treat it as voiding all earlier consents for the subject.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.revision.create` | mutiny.revision.create | { subjectType, subjectId, expectedHeadRevisionNo (0 for initial), reason, legIds[], compensationLegIds[]?, normalizationId?, consentDeadline?, executionWindowMs? } — vault command; produces statement classrup.mutiny.proposal_revision/v1 signed by the author | { revisionId, revisionNo, contentHash, syncState: local_committed \| prepared } | VALIDATION_FAILED, CONFLICT_STATE, CONFLICT_REVISION, MUTINY_REVISION_LIMIT, MUTINY_REVISION_AUTHOR_INVALID, MUTINY_REVISION_TURN, MUTINY_REVISION_MATERIAL_FORBIDDEN, MUTINY_REVISION_REFERENCE_INVALID, MUTINY_DEADLINE_INVALID, MUTINY_REVISION_FORK, MUTINY_REVISION_HASH_MISMATCH | mutiny.proposal.revised | yes (Idempotency-Key) |
| `mutiny.revision.ingest` | mutiny.revision.ingest | { envelope: classrup.mutiny.proposal_revision/v1 signed by its author, provenance } — vault command; produces no statement | { revisionId?, accepted: boolean, quarantineReason? } | MUTINY_STATEMENT_SIGNATURE_INVALID, MUTINY_REVISION_HASH_MISMATCH, MUTINY_REVISION_AUTHOR_INVALID, MUTINY_REVISION_TURN, MUTINY_REVISION_LIMIT, MUTINY_REVISION_FORK, MUTINY_STATEMENT_FROM_FUTURE, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED | mutiny.proposal.revised, mutiny.revision.forked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.revision.get` | mutiny.revision.read | { revisionId } | { revision: ProposalRevision, signatureVerified: boolean, syncState } | NOT_FOUND |
| `mutiny.revision.list_for_subject` | mutiny.revision.read | { subjectType, subjectId } | { items: ProposalRevision[], headRevisionNo, forked: boolean } | NOT_FOUND |
| `mutiny.revision.diff` | mutiny.revision.read | { subjectId, fromRevisionNo, toRevisionNo } | { changes: { path, kind: added\|removed\|changed, before?, after? }[] } | NOT_FOUND, VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.proposal.revised` | P2 | { subjectType, subjectId, revisionId, revisionNo, contentHash, authorId, reason, legIds, origin } |
| `mutiny.revision.forked` | P2 | { subjectType, subjectId, revisionNo, contentHashes[2], detectedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.proposal.accepted` | mark the trade_proposal subject closed; later revisions return CONFLICT_STATE |
| `mutiny.proposal.rejected` | mark the trade_proposal subject closed |
| `mutiny.proposal.expired` | mark the trade_proposal subject closed |
| `mutiny.cycle.committed` | mark the cycle subject closed for revisions |
| `mutiny.cycle.declined` | mark the cycle subject closed for revisions |
| `mutiny.cycle.cancelled` | mark the cycle subject closed for revisions |
| `mutiny.normalization.expired` | notify the coordinator that a quote_refresh revision is required before consent can complete |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_REVISION_LIMIT | 409 | no | a subject allows at most 20 revisions or the chain number is not the next |
| MUTINY_REVISION_AUTHOR_INVALID | 403 | no | the author is not a party of the subject |
| MUTINY_REVISION_TURN | 409 | no | it is not this author's turn to revise or the author is not the coordinator |
| MUTINY_REVISION_HASH_MISMATCH | 422 | no | contentHash does not equal the hash of the snapshot or the snapshot exceeds 64 KiB |
| MUTINY_REVISION_MATERIAL_FORBIDDEN | 422 | no | a cycle revision may not change participants or items |
| MUTINY_REVISION_REFERENCE_INVALID | 422 | no | a referenced leg, compensation leg or normalization does not belong to the subject |
| MUTINY_REVISION_FORK | 409 | no | conflicting revisions with the same number exist and the subject is frozen |
| MUTINY_DEADLINE_INVALID | 422 | no | consent deadline or execution window out of range |
| MUTINY_STATEMENT_SIGNATURE_INVALID | 422 | no | the Ed25519 signature does not verify |
| MUTINY_STATEMENT_FROM_FUTURE | 422 | no | the statement's claimed time is more than 5 minutes ahead of the local clock |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# 3-party cycle, revision 2 by coordinator Alice adds a compensation leg (reason compensation_added); vault command on Alice's device
mutiny.revision.create  Idempotency-Key: 0192f3e0-0000-7000-8000-000000000001
{ "subjectType": "cycle", "subjectId": "0192f3b0-…", "expectedHeadRevisionNo": 1, "reason": "compensation_added",
  "legIds": ["0192f3b2-…", "0192f3b3-…", "0192f3b4-…"], "compensationLegIds": ["0192f3b5-…"], "consentDeadline": "2026-11-07T10:00:00.000Z" }
-> { "revisionId": "0192f3e1-…", "revisionNo": 2, "contentHash": "sha256-8vQ2kZ…", "syncState": "prepared" }
statement to Bob and Carol (E2E encrypted, via their mailbox relays):
{ "v":1, "type":"classrup.mutiny.proposal_revision/v1", "author":"did:key:z6MkAlice", "seq":2, "prev":"sha256-Qm3…",
  "payload": { "subjectType":"cycle", "subjectId":"0192f3b0-…", "reason":"compensation_added", "snapshot": { "parties":3, "legs":3, "compensation":1 } }, "sig":"…" }
# 2-party: subjectType trade_proposal, 2 legs; 4-party and N-party cycles use the same call with 4 or N legs (N ≤ 8).
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-012-09.T05 | integration | PS-012-03.R03, PS-012-04.R03 | revise after accepted and after cancelled | CONFLICT_STATE; all earlier consents voided on an accepted revision of a different open subject |
| TEST-PS-012-09.T06 | contract | PS-012-04.R01, PS-012-04.R02, PS-012-09.R02 | create and ingest | statement validates against classrup.mutiny.proposal_revision/v1 and events against registry |
| TEST-PS-012-09.T15 | unit | PS-012-04.R03, PS-012-01.R01 | diff between revision 1 and 2 of 3-party cycle | exactly the compensation line added; all earlier consents void |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S02.M05, F02.S04.M01, F02.S04.M02, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
