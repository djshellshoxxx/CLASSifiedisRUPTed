# PS-069-04 — Commands, queries and events: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-04.R01** Commands are vault commands run locally with the unlocked principal as actor; those marked statement also produce a signed envelope for the other parties; no command of this module is a relay command.
- **PS-069-04.R02** Every command emits its events into the vault outbox in the same IndexedDB transaction as the state change (EVT-8).
- **PS-069-04.R03** The module consumes crypto, dispute and deletion events to drive claim and deal status and never accepts a crypto status from user input.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.deal.open` | commerce.deal.open | [vault command, produces signed statement classrup.commerce.deal/v1] { contextRef: {type, id}, contextCid, parties[], obligations[], expiresInDays? (default 30, 1..90) } | { dealId, revision, dealCid, peerSync } | VALIDATION_FAILED, COMMERCE_CONTEXT_UNKNOWN, COMMERCE_DEAL_PARTY_INVALID, COMMERCE_DEAL_CONTEXT_CONFLICT, BLOCKED_PARTY | commerce.deal.opened | yes (Idempotency-Key) |
| `commerce.deal.cancel` | commerce.deal.cancel | [vault command, produces signed statement classrup.commerce.deal_cancel/v1] { dealId, expectedRevision, reason? } | { dealId, revision, status, cancelSigners } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | commerce.deal.cancelled | yes (Idempotency-Key) |
| `commerce.payment.claim` | commerce.payment.claim | [vault command, produces signed statement classrup.commerce.payment_claim/v1] { dealId, obligationId, method, amount: Money, txRef?, note?, cryptoRequestId? } | { claimId, revision: 1, status: claimed, peerSync } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, CONFLICT_STATE, COMMERCE_CLAIM_METHOD_NOT_ALLOWED, COMMERCE_CLAIM_METHOD_RULE, BLOCKED_PARTY | commerce.payment.claimed | yes (Idempotency-Key) |
| `commerce.payment.acknowledge` | commerce.payment.acknowledge | [vault command, produces signed statement classrup.commerce.payment_ack/v1] { claimId, expectedRevision, note? } | { claimId, revision, status: acknowledged, dealStatus } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, COMMERCE_STATEMENT_FORK | commerce.payment.acknowledged, commerce.deal.completed | yes (Idempotency-Key) |
| `commerce.payment.dispute` | commerce.payment.dispute | [vault command, produces signed statement classrup.commerce.payment_dispute/v1] { claimId, expectedRevision, reason: not_received\|amount_wrong\|other, note? } | { claimId, revision, status: disputed } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE | commerce.payment.disputed | yes (Idempotency-Key) |
| `commerce.statement.ingest` | commerce.statement.ingest | [vault command, internal, consumes a signed statement received from a mailbox or direct channel] { envelope } | { outcome: applied\|quarantined\|duplicate, reason? } | VALIDATION_FAILED, COMMERCE_STATEMENT_INVALID, COMMERCE_STATEMENT_FORK, COMMERCE_CONTEXT_UNKNOWN, UNSUPPORTED_SCHEMA_VERSION | commerce.deal.opened, commerce.payment.claimed, commerce.payment.acknowledged, commerce.payment.disputed, commerce.deal.completed, commerce.deal.cancelled | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.deal.get` | commerce.deal.read | { dealId } | { deal: Deal, claims: PaymentClaim[], syncStates } | NOT_FOUND |
| `commerce.deal.list_mine` | commerce.deal.read | { status?: open\|disputed\|completed\|cancelled\|expired\|all, contextType?, cursor?, limit ≤ 50 } | { items: Deal[], nextCursor? } |  |
| `commerce.payment.list_for_deal` | commerce.deal.read | { dealId, status?, cursor?, limit ≤ 50 } | { items: PaymentClaim[], nextCursor? } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `commerce.deal.opened` | P2 | { dealId, contextRef, parties[], obligationCount, expiresAt } |
| `commerce.payment.claimed` | P2 | { claimId, dealId, obligationId, method, amount, payerId, payeeId, txRef?, cryptoRequestId? } |
| `commerce.payment.acknowledged` | P2 | { claimId, dealId, payeeId, method } |
| `commerce.payment.disputed` | P2 | { claimId, dealId, payeeId, reason } |
| `commerce.payment.expired` | P2 | { claimId, dealId, lastStatus } |
| `commerce.deal.completed` | P2 | { dealId, contextRef, completedAt } |
| `commerce.deal.cancelled` | P2 | { dealId, contextRef, reason: mutual\|expired } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.payment.confirming` | claimed or reorged claim moves to pending_confirmation and lastProgressAt is refreshed |
| `commerce.payment.confirmed` | pending_confirmation claim moves to confirmed with chain verification fields |
| `commerce.payment.finalized` | confirmed claim moves to final; Deal completion is re-evaluated |
| `commerce.payment.reorged` | pending_confirmation or confirmed claim moves to reorged and the UI shows the reorg |
| `commerce.payment.failed` | reorged claim moves to failed |
| `commerce.dispute.opened` | Deal referenced by the case moves to disputed |
| `commerce.dispute.resolved` | disputed Deal returns to open; the outcome never changes a claim status or moves money |
| `privacy.deletion.completed` | replace the deleted principal's did in retained Deals and claims with the per-deletion pseudonym; signatures are kept and marked unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_CONTEXT_UNKNOWN | 422 | no | context type or context statement is not known to this vault |
| COMMERCE_DEAL_PARTY_INVALID | 422 | no | payer and payee are equal or are not listed parties |
| COMMERCE_DEAL_CONTEXT_CONFLICT | 409 | no | a Deal with different terms already exists for this contextRef |
| COMMERCE_CLAIM_METHOD_NOT_ALLOWED | 422 | no | method or currency is not allowed by the obligation |
| COMMERCE_CLAIM_METHOD_RULE | 422 | no | the method module rejected the claim input |
| COMMERCE_STATEMENT_INVALID | 422 | no | signature, signer role or envelope is invalid; statement is quarantined |
| COMMERCE_STATEMENT_FORK | 409 | no | two signed statements share the same prev; claim is frozen |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command commerce.deal.open (called by the offers module after the seller accepts)
{ "contextRef": { "type": "offer", "id": "0192f3a5-1111-7000-8000-000000000001" }, "contextCid": "sha256-9f2c…",
  "parties": [ { "did": "did:key:z6MkBuyer…", "role": "payer" }, { "did": "did:key:z6MkSeller…", "role": "payee" } ],
  "obligations": [ { "obligationId": "o1", "payerId": "did:key:z6MkBuyer…", "payeeId": "did:key:z6MkSeller…",
    "amount": { "amount": "4500", "currency": "EUR" }, "purpose": "goods", "allowedMethods": ["cash", "crypto"] } ] }
=> { "dealId": "0192f3a6-…", "revision": 1, "dealCid": "sha256-c41e…", "peerSync": "prepared" }
vault command commerce.payment.claim { "dealId": "0192f3a6-…", "obligationId": "o1", "method": "cash", "amount": { "amount": "4500", "currency": "EUR" } }
=> { "claimId": "0192f3a7-…", "revision": 1, "status": "claimed", "peerSync": "prepared" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T08 | contract | PS-069-04.R01, PS-069-04.R02, PS-069-09.R02 | execute each command in vault A and ingest in vault B | outputs, envelopes and events validate against registry schemas |
| TEST-PS-069-09.T09 | integration | PS-069-04.R03 | deliver crypto and dispute events | claim and Deal statuses follow the machine |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
