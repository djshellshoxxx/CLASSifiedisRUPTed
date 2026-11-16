# PS-070-04 — Commands, queries and events: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-04.R01** Open, add_evidence, respond, select_mediator, accept_mediator, propose_outcome, accept_outcome, reject_outcome and withdraw are vault commands that each produce a signed statement; ingest is an internal vault command; no command is a relay command.
- **PS-070-04.R02** Mediator actions run in the mediator's own vault as the same commands under role-in-statement authorization; a relay only publishes a mediator directory under its hosting policy.
- **PS-070-04.R03** The module consumes payment, services-dispute and deletion events to prefill drafts and pseudonymize retained records, and never opens a case automatically.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.dispute.open` | commerce.dispute.open | [vault command, produces signed statement classrup.commerce.dispute/v1] { contextRef: {type, id}, reason, description, respondentIds?, evidence? } | { caseId, revision: 1, caseCid, deadlines, peerSync } | VALIDATION_FAILED, COMMERCE_DISPUTE_CONTEXT_INVALID, COMMERCE_DISPUTE_DUPLICATE, COMMERCE_DISPUTE_EVIDENCE_LIMIT, BLOCKED_PARTY | commerce.dispute.opened | yes (Idempotency-Key) |
| `commerce.dispute.add_evidence` | commerce.dispute.add_evidence | [vault command, produces signed statement classrup.commerce.dispute_evidence/v1] { caseId, expectedRevision, kind, refCid, sha256?, sizeBytes?, caption? } | { caseId, revision, evidenceId, peerSync } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, COMMERCE_DISPUTE_EVIDENCE_LIMIT, VALIDATION_FAILED | commerce.dispute.evidence_added | yes (Idempotency-Key) |
| `commerce.dispute.respond` | commerce.dispute.respond | [vault command, produces signed statement classrup.commerce.dispute_response/v1] { caseId, expectedRevision, response: accept_facts\|contest\|partial, description } | { caseId, revision, status } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `commerce.dispute.select_mediator` | commerce.dispute.select_mediator | [vault command, produces signed statement classrup.commerce.dispute_mediator/v1] { caseId, expectedRevision, mediatorDid, relayId } | { caseId, revision, mediatorStatus } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, COMMERCE_DISPUTE_MEDIATOR_UNAVAILABLE |  | yes (Idempotency-Key) |
| `commerce.dispute.accept_mediator` | commerce.dispute.accept_mediator | [vault command, produces signed statement classrup.commerce.dispute_mediator_accept/v1] { caseId, expectedRevision } | { caseId, revision, status } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `commerce.dispute.propose_outcome` | commerce.dispute.propose_outcome | [vault command, produces signed statement classrup.commerce.dispute_outcome/v1] { caseId, expectedRevision, type, advisoryRefund?: Money, note? } | { caseId, revision, status, round, proposalBy } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, COMMERCE_DISPUTE_OUTCOME_INVALID | commerce.dispute.outcome_proposed, commerce.dispute.resolved | yes (Idempotency-Key) |
| `commerce.dispute.accept_outcome` | commerce.dispute.accept_outcome | [vault command, produces signed statement classrup.commerce.dispute_outcome_accept/v1] { caseId, expectedRevision, accept: boolean } | { caseId, revision, status, resolution? } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, COMMERCE_DISPUTE_FORK | commerce.dispute.resolved | yes (Idempotency-Key) |
| `commerce.dispute.withdraw` | commerce.dispute.withdraw | [vault command, produces signed statement classrup.commerce.dispute_withdraw/v1] { caseId, expectedRevision } | { caseId, revision, status: withdrawn } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE | commerce.dispute.withdrawn | yes (Idempotency-Key) |
| `commerce.dispute.ingest` | commerce.dispute.ingest | [vault command, internal] { envelope: any commerce.dispute statement } | { outcome: applied\|quarantined\|duplicate, reason? } | VALIDATION_FAILED, COMMERCE_DISPUTE_STATEMENT_INVALID, COMMERCE_DISPUTE_FORK, COMMERCE_DISPUTE_CONTEXT_INVALID, UNSUPPORTED_SCHEMA_VERSION | commerce.dispute.opened, commerce.dispute.evidence_added, commerce.dispute.outcome_proposed, commerce.dispute.resolved, commerce.dispute.withdrawn | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.dispute.get` | commerce.dispute.read | { caseId } | { case: DisputeCase, statements: [{cid, type, signer, receivedAt, syncState}] } | NOT_FOUND |
| `commerce.dispute.list_mine` | commerce.dispute.read | { status?: open\|resolved\|withdrawn\|all, cursor?, limit ≤ 50 } | { items: DisputeCase[], nextCursor? } |  |
| `commerce.dispute.list_mediators` | commerce.dispute.mediator_list | { relayId } | { items: [{did, displayName, languages[], policyUrl}] } published by the relay under its hosting policy | DEPENDENCY_UNAVAILABLE |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `commerce.dispute.opened` | P2 | { caseId, contextRef, openerId, respondentIds, reason } |
| `commerce.dispute.evidence_added` | P2 | { caseId, evidenceId, authorId, kind } |
| `commerce.dispute.resolved` | P2 | { caseId, contextRef, resolution, outcomeType?, advisoryRefund? } |
| `commerce.dispute.outcome_proposed` | P2 | { caseId, outcomeType, proposedBy, round, proposalBy } |
| `commerce.dispute.withdrawn` | P2 | { caseId, contextRef, openerId } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.payment.disputed` | create a prefilled draft case for the claim's payer and prompt them; never opens a case automatically |
| `services.dispute.opened` | link the service dispute intake to the case it creates through commerce.dispute.open and prefill milestones as evidence references |
| `privacy.deletion.completed` | replace the deleted principal's did in retained cases with the per-deletion pseudonym; signatures kept and flagged unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_DISPUTE_CONTEXT_INVALID | 422 | no | context does not resolve locally or actor is not a party |
| COMMERCE_DISPUTE_DUPLICATE | 409 | no | an open case already exists for this context and opener |
| COMMERCE_DISPUTE_EVIDENCE_LIMIT | 413 | no | evidence count or size exceeds the limits |
| COMMERCE_DISPUTE_MEDIATOR_UNAVAILABLE | 409 | no | mediator or relay is not accepted by both parties or is unreachable |
| COMMERCE_DISPUTE_OUTCOME_INVALID | 422 | no | outcome type, acceptance rule or advisory refund is invalid |
| COMMERCE_DISPUTE_FORK | 409 | no | conflicting accepted outcomes; case is frozen for renegotiation |
| COMMERCE_DISPUTE_STATEMENT_INVALID | 422 | no | signature, signer role or envelope is invalid; statement is quarantined |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command commerce.dispute.open
{ "contextRef": { "type": "deal", "id": "0192f3a6-…" }, "reason": "not_received",
  "description": "Paid cash at the agreed spot but the bike was never handed over." }
=> { "caseId": "0192f3ab-…", "revision": 1, "caseCid": "sha256-5a10…", "deadlines": { "responseBy": "2026-11-11T10:00:00.000Z" }, "peerSync": "prepared" }
later: commerce.dispute.propose_outcome { "type": "refund_claimed", "advisoryRefund": { "amount": "4500", "currency": "EUR" } }
=> both parties accept; resolution refund_claimed; no payment is created, the respondent opens a new Deal if they agree to refund
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T07 | contract | PS-070-04.R01, PS-070-04.R02, PS-070-09.R02 | execute each command and ingest in the other vaults | outputs, envelopes and events validate against registry schemas |
| TEST-PS-070-09.T08 | integration | PS-070-04.R03, PS-070-02.R01 | commerce.payment.disputed delivered | draft prefilled, no case opened automatically |
| TEST-PS-070-09.T09 | integration | PS-070-04.R02, PS-070-05.R01 | both parties select mediator M; M proposes no_fault_close | evidence shared only for items the parties chose; case resolved without acceptance |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
