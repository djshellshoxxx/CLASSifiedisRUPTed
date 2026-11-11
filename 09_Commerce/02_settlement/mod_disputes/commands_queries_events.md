# PS-070-04 — Commands, queries and events: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-04.R01** Open, add_evidence, respond, select_mediator, accept_mediator, propose_outcome, accept_outcome, reject_outcome and withdraw are vault commands that each produce a signed statement; ingest is an internal vault command; no command is a relay command.
- **PS-070-04.R02** Mediator actions run in the mediator's own vault as the same commands under role-in-statement authorization; a relay only publishes relay-signed mediator directory entries under its hosting policy.
- **PS-070-04.R03** The module consumes payment, services-dispute and deletion events to prefill drafts and pseudonymize retained records, and never opens a case automatically.
- **PS-070-04.R04** Event payloads carry contextRef, openerId, respondentIds and parties [{did, role}] (N3, N4) - commerce.dispute.opened, evidence_added, outcome_proposed, resolved and withdrawn - and resolved and withdrawn also carry caseCid for reputation (F07.S03.M01).
- **PS-070-04.R05** dispute_outcome/v1 and commerce.dispute.resolved carry an advisory, non-executable disposition {kind continue|settled|cancelled|waived, favouredDid?, agreedAmount?}; when it is absent each consumer applies the outcome-type mapping in its own spec, and for deal and payment_claim contexts the default mapping in the note is normative.
- **PS-070-04.R06** Every dispute statement type is registered with its signer role in F11.S01.M01 and reaches commerce.dispute.ingest through the F09.S01.M01 ingest dispatcher (StatementHandlerPort), with cid deduplication, quarantine reasons and the block exception for open cases.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.dispute.open` | commerce.dispute.open | [vault command, produces signed statement classrup.commerce.dispute/v1] { contextRef: {type, id}, reason, description, respondentIds? (default: the other parties from DisputeContextPort.resolve), evidence? } | { caseId, revision: 1, caseCid, parties, deadlines, peerSync } | VALIDATION_FAILED, COMMERCE_DISPUTE_CONTEXT_INVALID, COMMERCE_DISPUTE_DUPLICATE, COMMERCE_DISPUTE_EVIDENCE_LIMIT | commerce.dispute.opened | yes (Idempotency-Key) |
| `commerce.dispute.add_evidence` | commerce.dispute.add_evidence | [vault command, produces signed statement classrup.commerce.dispute_evidence/v1; attachments are stripped by F10.S02.M03, stored as F15.S02.M03 MediaBlobs and sent as encrypted attachments through the AttachmentTransportPort] { caseId, expectedRevision, kind, refCid, sha256?, sizeBytes? (≤ 5242880), caption? } | { caseId, revision, evidenceId, peerSync } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, COMMERCE_DISPUTE_EVIDENCE_LIMIT, VALIDATION_FAILED | commerce.dispute.evidence_added | yes (Idempotency-Key) |
| `commerce.dispute.respond` | commerce.dispute.respond | [vault command, produces signed statement classrup.commerce.dispute_response/v1] { caseId, expectedRevision, response: accept_facts\|contest\|partial, description } | { caseId, revision, status } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `commerce.dispute.select_mediator` | commerce.dispute.select_mediator | [vault command, produces signed statement classrup.commerce.dispute_mediator/v1; the selection counts as the selector's acceptance] { caseId, expectedRevision, mediatorDid, relayId, directoryEntry? } | { caseId, revision, mediatorStatus, trust: relay_verified\|self_declared, acceptedBy } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, COMMERCE_DISPUTE_MEDIATOR_UNAVAILABLE |  | yes (Idempotency-Key) |
| `commerce.dispute.accept_mediator` | commerce.dispute.accept_mediator | [vault command, produces signed statement classrup.commerce.dispute_mediator_accept/v1] { caseId, expectedRevision } | { caseId, revision, status, acceptedBy, mediatorStatus } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `commerce.dispute.propose_outcome` | commerce.dispute.propose_outcome | [vault command, produces signed statement classrup.commerce.dispute_outcome/v1] { caseId, expectedRevision, type, advisoryRefund?: Money, disposition?: {kind, favouredDid?, agreedAmount?}, note? } | { caseId, revision, status, round, proposalBy, requiresAcceptanceBy[] } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, COMMERCE_DISPUTE_OUTCOME_INVALID, COMMERCE_DISPUTE_MEDIATOR_UNVERIFIED | commerce.dispute.outcome_proposed, commerce.dispute.resolved | yes (Idempotency-Key) |
| `commerce.dispute.accept_outcome` | commerce.dispute.accept_outcome | [vault command, produces signed statement classrup.commerce.dispute_outcome_accept/v1] { caseId, expectedRevision, accept: boolean } | { caseId, revision, status, resolution? } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, COMMERCE_DISPUTE_FORK | commerce.dispute.resolved | yes (Idempotency-Key) |
| `commerce.dispute.withdraw` | commerce.dispute.withdraw | [vault command, produces signed statement classrup.commerce.dispute_withdraw/v1] { caseId, expectedRevision } | { caseId, revision, status: withdrawn } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE | commerce.dispute.withdrawn | yes (Idempotency-Key) |
| `commerce.dispute.ingest` | commerce.dispute.ingest | [vault command, internal; dispatched by F09.S01.M01 commerce.statement.ingest] { envelope: any commerce.dispute statement } | { outcome: applied\|stored_blocked\|buffered\|quarantined\|duplicate\|dropped, reason? } | VALIDATION_FAILED, COMMERCE_DISPUTE_STATEMENT_INVALID, COMMERCE_DISPUTE_FORK, COMMERCE_DISPUTE_CONTEXT_INVALID, COMMERCE_DISPUTE_MEDIATOR_UNVERIFIED, UNSUPPORTED_SCHEMA_VERSION | commerce.dispute.opened, commerce.dispute.evidence_added, commerce.dispute.outcome_proposed, commerce.dispute.resolved, commerce.dispute.withdrawn | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.dispute.get` | commerce.dispute.read | { caseId } | { case: DisputeCase, statements: [{cid, type, signer, receivedAt, syncState, fromBlockedParty}] } | NOT_FOUND |
| `commerce.dispute.list_mine` | commerce.dispute.read | { status?: open\|resolved\|withdrawn\|all, cursor?, limit ≤ 50 } | { items: DisputeCase[], nextCursor? } |  |
| `commerce.dispute.list_mediators` | commerce.dispute.mediator_list | { relayId } | { items: [{mediatorDid, relayId, displayName, languages[], policyUrl, validUntil, relaySig}] } relay-signed directory entries published by the relay under its hosting policy | DEPENDENCY_UNAVAILABLE |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `commerce.dispute.opened` | P2 | { caseId, caseCid, contextRef, contextCid, openerId, respondentIds, parties[{did, role}], reason } |
| `commerce.dispute.evidence_added` | P2 | { caseId, contextRef, evidenceId, authorId, kind, openerId, respondentIds, parties[{did, role}] } |
| `commerce.dispute.resolved` | P2 | { caseId, caseCid, contextRef, openerId, respondentIds, parties[{did, role}], resolution, outcomeType?, advisoryRefund?, disposition?: {kind, favouredDid?, agreedAmount?}, acceptedBy[], outcomeCid? } |
| `commerce.dispute.outcome_proposed` | P2 | { caseId, contextRef, openerId, respondentIds, parties[{did, role}], outcomeType, disposition?, proposedBy, round, proposalBy } |
| `commerce.dispute.withdrawn` | P2 | { caseId, caseCid, contextRef, openerId, respondentIds, parties[{did, role}] } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.payment.disputed` | create a prefilled draft case for the claim's payer and prompt them; never opens a case automatically |
| `services.dispute.opened` | link the service dispute intake to the case it creates through commerce.dispute.open and prefill milestones as evidence references |
| `privacy.deletion.completed` | through the DeletionPort plan, replace the deleted principal's did in retained cases with the per-deletion pseudonym; signatures kept and flagged unverifiable-after-pseudonymization; the deleted user's own evidence blobs crypto-shredded |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_DISPUTE_CONTEXT_INVALID | 422 | no | context type is not registered, the context does not resolve, or the actor is not a party |
| COMMERCE_DISPUTE_DUPLICATE | 409 | no | an open case already exists for this context and opener |
| COMMERCE_DISPUTE_EVIDENCE_LIMIT | 413 | no | evidence count or size exceeds the limits |
| COMMERCE_DISPUTE_MEDIATOR_UNAVAILABLE | 409 | no | mediator is not yet accepted by every party of the case or is unreachable |
| COMMERCE_DISPUTE_OUTCOME_INVALID | 422 | no | outcome type, acceptance rule, disposition or advisory refund is invalid |
| COMMERCE_DISPUTE_FORK | 409 | no | conflicting accepted outcomes; case is frozen for renegotiation |
| COMMERCE_DISPUTE_STATEMENT_INVALID | 422 | no | signature, signer role or envelope is invalid; statement is quarantined |
| COMMERCE_DISPUTE_MEDIATOR_UNVERIFIED | 409 | no | mediator has no valid relay-signed directory entry; mediator-only outcomes are not allowed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, registered in F11.S01.M01): classrup.commerce.dispute/v1 - opener, a party returned by DisputeContextPort.resolve; classrup.commerce.dispute_evidence/v1 - the authoring party (or the active mediator for a mediator note); classrup.commerce.dispute_response/v1 - a respondent; classrup.commerce.dispute_mediator/v1 - a party; classrup.commerce.dispute_mediator_accept/v1 - each party; classrup.commerce.dispute_outcome/v1 - a party or the active mediator; classrup.commerce.dispute_outcome_accept/v1 - each party; classrup.commerce.dispute_withdraw/v1 - the opener. All reach commerce.dispute.ingest through the F09.S01.M01 dispatcher (StatementHandlerPort). Ports - DisputeContextPort {types[], resolve(contextRef) -> {parties[{did, role}], contextCid} | unknown}, registered by F09.S01.M01 (deal, payment_claim), F02.S03.M04 (cycle), F03.S02.M03 (booking), F05.S01.M02 (rental_deposit) and F05.S02.M03 (rental_damage); AttachmentTransportPort {send(blobRef, recipients[], perObjectKey)} bound by the vault composition to the F08.S01.M01 mailbox adapter, so this module has no static dependency on the messaging feature. Mediator directory entry - {mediatorDid, relayId, policyUrl, validUntil} signed by the relay key (FED-2, F11.S01.M03) and verified by each vault against the key of that relay. Default disposition mapping for deal and payment_claim contexts, used when an outcome carries no disposition - no_fault_close -> continue; refund_claimed -> settled with agreedAmount = advisoryRefund (refund through a new Deal); return_agreed -> cancelled (parties sign a mutual deal_cancel); enforcement_referral -> continue; lapsed -> continue. Every disposition is advisory and non-executable; consumers of other context types apply the mapping in their own specs.

### Example

```
vault command commerce.dispute.open
{ "contextRef": { "type": "deal", "id": "5b1d0c7e-3a2f-8e41-9c0d-…" }, "reason": "not_received",
  "description": "Paid cash at the agreed spot but the bike was never handed over." }
=> { "caseId": "0192f3ab-…", "revision": 1, "caseCid": "sha256-5a10…", "parties": [ { "did": "did:key:z6MkBuyer…", "role": "payer" },
     { "did": "did:key:z6MkSeller…", "role": "payee" } ], "deadlines": { "responseBy": "2026-11-11T10:00:00.000Z" }, "peerSync": "prepared" }
later: commerce.dispute.propose_outcome { "type": "refund_claimed", "advisoryRefund": { "amount": "4500", "currency": "EUR" },
  "disposition": { "kind": "settled", "favouredDid": "did:key:z6MkBuyer…", "agreedAmount": { "amount": "4500", "currency": "EUR" } } }
=> every party accepts; resolution refund_claimed; no payment is created, the respondent opens a new Deal if they agree to refund
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T07 | contract | PS-070-04.R01, PS-070-04.R02, PS-070-09.R02 | execute each command and ingest in the other vaults | outputs, envelopes and events validate against registry schemas |
| TEST-PS-070-09.T08 | integration | PS-070-04.R03, PS-070-02.R01 | commerce.payment.disputed delivered | draft prefilled, no case opened automatically |
| TEST-PS-070-09.T09 | integration | PS-070-04.R02, PS-070-05.R01, PS-070-07.R02 | every party selects and accepts relay-verified mediator M; A shares two of five evidence items; M proposes no_fault_close | M receives only the two shared items; case resolved without acceptance |
| TEST-PS-070-09.T22 | contract | PS-070-04.R04 | assert every produced event against the expectations of F07.S03.M01, F13.S01.M03, F09.S01.M01, F02.S03.M04, F03.S02.M03, F05.S01.M02 and F05.S02.M03 | each event carries contextRef, openerId, respondentIds and parties; resolved and withdrawn carry caseCid |
| TEST-PS-070-09.T23 | contract | PS-070-04.R05, PS-070-01.R03 | resolve one case per consumer context type with and without a disposition | resolved payload carries the advisory disposition when present; for deal and payment_claim the default mapping applies when absent; no consumer command that moves money is invoked |
| TEST-PS-070-09.T27 | integration | PS-070-04.R06 | dispute, evidence and outcome statements delivered through F09.S01.M01 commerce.statement.ingest, plus duplicates and a statement signed by a non-party | dispatched to commerce.dispute.ingest and applied once; duplicates no-op; non-party quarantined with COMMERCE_DISPUTE_STATEMENT_INVALID |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F15.S02.M03, F10.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
