# PS-069-04 — Commands, queries and events: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-04.R01** Commands are vault commands run locally with the unlocked principal as actor; those marked statement also produce a signed envelope for the other parties; the only relay command is commerce.payment.acknowledge run by a relay operator for a listing_fee Deal whose payee is that operator.
- **PS-069-04.R02** Every command emits its events into the vault outbox in the same IndexedDB transaction as the state change (EVT-8).
- **PS-069-04.R03** The module consumes crypto, dispute (opened, resolved, withdrawn) and deletion events to drive claim and deal status and never accepts a crypto status from user input.
- **PS-069-04.R04** Event payloads carry contextRef and the party DIDs consumers route on (N3, N4, N5) - payment events contextRef, payerId, payeeId and parties, commerce.deal.opened and commerce.deal.cancelled parties, and commerce.deal.completed { dealId, contextRef, contextId, completionCid, parties, completedAt }.
- **PS-069-04.R05** commerce.statement.ingest dispatches every commerce envelope type to the handler registered through StatementHandlerPort (this module's own types, F09.S01.M02 cash terms, F09.S01.M03 crypto requests, F09.S02.M01 receipts and F09.S02.M02 dispute statements), each with the signer role listed in the note, cid deduplication and quarantine reasons.
- **PS-069-04.R06** Context modules use DealPort {open, cancel} in-process and implement ContextTermsPort {verify, openerRole, ownerRole}; a claim the method rule holds (txid not yet found or not attested) stays local, unsigned and unsent until the method module releases it.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.deal.open` | commerce.deal.open | [vault command, produces signed statement classrup.commerce.deal/v1; reached through DealPort.open] { contextRef: {type, id}, contextCid, parties[{did, role}], obligations[], expiresInDays? (default 30, 1..90) } | { dealId, revision, dealCid, peerSync } | VALIDATION_FAILED, COMMERCE_CONTEXT_UNKNOWN, COMMERCE_DEAL_PARTY_INVALID, COMMERCE_DEAL_CONTEXT_CONFLICT, COMMERCE_CURRENCY_MISMATCH, BLOCKED_PARTY | commerce.deal.opened | yes (Idempotency-Key) |
| `commerce.deal.cancel` | commerce.deal.cancel | [vault command, produces signed statement classrup.commerce.deal_cancel/v1; DealPort.cancel uses mode unilateral] { dealId, expectedRevision, mode?: mutual\|unilateral (default mutual), reason?: mutual\|context_voided\|withdrawn_before_accept\|non_payment } | { dealId, revision, status, mode, cancelSigners } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE | commerce.deal.cancelled | yes (Idempotency-Key) |
| `commerce.payment.claim` | commerce.payment.claim | [vault command, produces signed statement classrup.commerce.payment_claim/v1 unless the method rule holds it] { dealId, obligationId, method, amount: Money, txRef?, note?, cryptoRequestId?, txidAttested?: boolean (crypto without a verifier) } | { claimId, revision: 1, status: claimed, peerSync, sendHold?: txid_lookup_pending } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, CONFLICT_STATE, COMMERCE_CLAIM_METHOD_NOT_ALLOWED, COMMERCE_CLAIM_METHOD_RULE, COMMERCE_CURRENCY_MISMATCH, BLOCKED_PARTY | commerce.payment.claimed | yes (Idempotency-Key) |
| `commerce.payment.acknowledge` | commerce.payment.acknowledge | [vault command; relay command for a listing_fee Deal whose payee is that relay's operator; produces signed statement classrup.commerce.payment_ack/v1 with verification.source counterparty] { claimId, expectedRevision, note? } | { claimId, revision, status: acknowledged, dealStatus } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, COMMERCE_CLAIM_METHOD_NOT_ALLOWED, COMMERCE_STATEMENT_FORK | commerce.payment.acknowledged, commerce.deal.completed | yes (Idempotency-Key) |
| `commerce.payment.dispute` | commerce.payment.dispute | [vault command, produces signed statement classrup.commerce.payment_dispute/v1] { claimId, expectedRevision, reason: not_received\|amount_wrong\|other, note? } | { claimId, revision, status: disputed } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE | commerce.payment.disputed | yes (Idempotency-Key) |
| `commerce.statement.ingest` | commerce.statement.ingest | [vault command, internal, consumes a signed statement received from a mailbox or direct channel; on a relay only for listing_fee Deals whose payee is its operator] { envelope } | { outcome: applied\|dispatched\|buffered\|quarantined\|duplicate\|dropped, handler?, reason? } | VALIDATION_FAILED, COMMERCE_STATEMENT_INVALID, COMMERCE_STATEMENT_FORK, COMMERCE_CONTEXT_UNKNOWN, COMMERCE_DEAL_CONTEXT_CONFLICT, COMMERCE_CURRENCY_MISMATCH, UNSUPPORTED_SCHEMA_VERSION | commerce.deal.opened, commerce.payment.claimed, commerce.payment.acknowledged, commerce.payment.disputed, commerce.deal.completed, commerce.deal.cancelled | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.deal.get` | commerce.deal.read | { dealId } | { deal: Deal, claims: PaymentClaim[], syncStates, labels } | NOT_FOUND |
| `commerce.deal.list_mine` | commerce.deal.read | { status?: open\|disputed\|completed\|cancelled\|expired\|all, contextType?, cursor?, limit ≤ 50 } | { items: Deal[], nextCursor? } |  |
| `commerce.payment.list_for_deal` | commerce.deal.read | { dealId, status?, cursor?, limit ≤ 50 } | { items: PaymentClaim[], nextCursor? } | NOT_FOUND |
| `commerce.statement.diagnostics` | commerce.deal.read | { since? } | { quarantined, buffered, forks, dropped, evicted, byReason: {reason: count} } local diagnostics only |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `commerce.deal.opened` | P2 | { dealId, contextRef, contextCid, dealCid, parties[{did, role}], obligationCount, expiresAt } |
| `commerce.payment.claimed` | P2 | { claimId, dealId, contextRef, obligationId, method, amount, payerId, payeeId, parties[{did, role}], txRef?, cryptoRequestId?, methodRef? } |
| `commerce.payment.acknowledged` | P2 | { claimId, dealId, contextRef, obligationId, method, payerId, payeeId, parties[{did, role}], verificationSource: counterparty\|chain, ackCid } |
| `commerce.payment.disputed` | P2 | { claimId, dealId, contextRef, obligationId, payerId, payeeId, parties[{did, role}], reason } |
| `commerce.payment.expired` | P2 | { claimId, dealId, contextRef, obligationId, payerId, payeeId, parties[{did, role}], lastStatus } |
| `commerce.deal.completed` | P2 | { dealId, contextRef, contextId, completionCid, parties[{did, role}], completedAt } |
| `commerce.deal.cancelled` | P2 | { dealId, contextRef, parties[{did, role}], mode: mutual\|unilateral, reason: mutual\|context_voided\|withdrawn_before_accept\|non_payment\|expired\|expired_partial, byDid? } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.payment.confirming` | claimed, disputed or reorged claim moves to pending_confirmation; for a confirmed claim only confirmations and lastProgressAt are updated; for a terminal claim only verification fields are updated and the event is acknowledged, never dead-lettered |
| `commerce.payment.confirmed` | pending_confirmation claim moves to confirmed with chain verification fields; terminal claims only update verification fields |
| `commerce.payment.finalized` | confirmed claim moves to final; in the payee vault the module signs classrup.commerce.payment_ack/v1 with verification.source chain and emits commerce.payment.acknowledged; Deal completion is re-evaluated, counting only claims with a held payee acknowledgement |
| `commerce.payment.reorged` | pending_confirmation or confirmed claim moves to reorged and the UI shows the reorg |
| `commerce.payment.failed` | claimed, disputed, pending_confirmation, confirmed or reorged claim moves to failed with the reason absent, reverted, underpaid, wrong_address, wrong_asset or before_request |
| `commerce.dispute.opened` | case id added to openCaseIds of the Deal named by the case or, for contextRef payment_claim, of that claim's Deal; an open Deal moves to disputed; on a completed, cancelled or expired Deal only disputeFlag is set |
| `commerce.dispute.resolved` | case id removed from openCaseIds; the Deal returns to open only when none remain; the outcome never changes a claim status or moves money |
| `commerce.dispute.withdrawn` | case id removed from openCaseIds; the Deal returns to open only when none remain |
| `privacy.deletion.completed` | through the DeletionPort plan, replace the deleted principal's did in retained Deals and claims with the per-deletion pseudonym; signatures are kept and marked unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_CONTEXT_UNKNOWN | 422 | no | context type is not registered or the context statement is not known to this vault |
| COMMERCE_DEAL_PARTY_INVALID | 422 | no | payer and payee are equal, are not listed parties, or a listing_fee payee is not the relay operator |
| COMMERCE_DEAL_CONTEXT_CONFLICT | 409 | no | Deal terms differ from the signed context or from an existing Deal for this contextRef and contextCid |
| COMMERCE_CLAIM_METHOD_NOT_ALLOWED | 422 | no | method or currency is not allowed by the obligation, or acknowledge was used on a crypto claim |
| COMMERCE_CLAIM_METHOD_RULE | 422 | no | the method module rejected the claim input |
| COMMERCE_STATEMENT_INVALID | 422 | no | signature, signer role, key status or envelope is invalid; statement is quarantined |
| COMMERCE_STATEMENT_FORK | 409 | no | two different statements by the same author share the same prev or seq; claim is frozen |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, registered in F11.S01.M01): classrup.commerce.deal/v1 - the opener role of the context type (offer: listing author who accepted; auction_result: seller, also for a second-chance offer; cycle_compensation: payer or payee of the compensation leg; service_milestone: client who approved; rental_reservation, rental_cancellation_fee, rental_deposit, rental_deposit_release and rental_late_fee: owner; rental_damage: the party that accepted the amount; listing_fee: listing author); classrup.commerce.deal_cancel/v1 - each party for mode mutual, the context owner role for mode unilateral; classrup.commerce.deal_completion/v1 - each party, all over the same completion body; classrup.commerce.payment_claim/v1 - obligation payer; classrup.commerce.payment_ack/v1 - obligation payee (the relay operator DID for listing_fee; source chain only from the payee's own verifier); classrup.commerce.payment_dispute/v1 - obligation payee. Handlers registered through StatementHandlerPort: classrup.commerce.cash_terms/v1 payee, classrup.commerce.cash_terms_accept/v1 and classrup.commerce.cash_terms_decline/v1 payer (F09.S01.M02); classrup.commerce.crypto_request/v1 and classrup.commerce.crypto_request_cancel/v1 payee (F09.S01.M03); classrup.commerce.receipt/v1 claim payer or payee by statement type (F09.S02.M01 commerce.receipt.ingest); classrup.commerce.dispute*/v1 case parties or the active mediator (F09.S02.M02 commerce.dispute.ingest); an unregistered commerce type is quarantined with reason type_unregistered. classrup.commerce.fx_quote_revocation/v1 is not Deal-scoped and is routed by the vault mailbox router to F09.S03.M02 commerce.fx_quote.ingest_revocation, never to this dispatcher. Ports - DealPort {open(input) -> {dealId, dealCid}, cancel(dealId, reason)}; ContextTermsPort {verify(contextRef, contextCid, parties, obligations) -> ok or conflict, openerRole(type), ownerRole(type)} implemented by every context module; MethodRulePort {check(claimInput) -> pass, fail(code) or hold(reason)} with the callbacks release(claimId) and discard(claimId) this module gives the method module; StatementHandlerPort {types[], signerRole(type), apply(envelope) -> applied, quarantined(reason) or duplicate}. The deal and payment_claim resolvers of the F09.S02.M02 DisputeContextPort read this module through commerce.deal.get. listing_fee - the payee is the operator DID published in the relay's signed policy document; claims are delivered end-to-end encrypted to the operator's mailbox on that relay, and the operator acknowledges with the relay command commerce.payment.acknowledge under relay policy.

### Example

```
vault command commerce.deal.open (called through DealPort by the offers module after the seller accepts)
{ "contextRef": { "type": "offer", "id": "0192f3a5-1111-7000-8000-000000000001" }, "contextCid": "sha256-9f2c…",
  "parties": [ { "did": "did:key:z6MkBuyer…", "role": "payer" }, { "did": "did:key:z6MkSeller…", "role": "payee" } ],
  "obligations": [ { "obligationId": "o1", "payerId": "did:key:z6MkBuyer…", "payeeId": "did:key:z6MkSeller…",
    "amount": { "amount": "4500", "currency": "EUR" }, "purpose": "goods", "allowedMethods": ["cash", "crypto"] } ] }
=> { "dealId": "5b1d0c7e-3a2f-8e41-9c0d-…", "revision": 1, "dealCid": "sha256-c41e…", "peerSync": "prepared" }
vault command commerce.payment.claim { "dealId": "5b1d0c7e-…", "obligationId": "o1", "method": "cash", "amount": { "amount": "4500", "currency": "EUR" } }
=> { "claimId": "0192f3a7-…", "revision": 1, "status": "claimed", "peerSync": "prepared" }
after the payee acknowledges: event commerce.deal.completed { "dealId": "5b1d0c7e-…", "contextRef": { "type": "offer", "id": "0192f3a5-…" },
  "contextId": "0192f3a5-…", "completionCid": "sha256-Qc7…", "parties": [ … ], "completedAt": "2026-11-04T10:30:00.000Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T08 | contract | PS-069-04.R01, PS-069-04.R02, PS-069-09.R02 | execute each command in vault A and ingest in vault B | outputs, envelopes and events validate against registry schemas; commerce.deal.completed carries dealId, contextRef, contextId, completionCid, parties with roles and completedAt |
| TEST-PS-069-09.T09 | integration | PS-069-04.R03 | deliver crypto events and commerce.dispute.opened, resolved and withdrawn | claim and Deal statuses follow the machine |
| TEST-PS-069-09.T19 | contract | PS-069-04.R04 | assert every produced event payload against the consumer expectations of F07.S03.M01, F13.S01.M03, F02.S04.M01, F03.S02.M02, F05.S01.M02 and F01.S01.M03 | payment events carry contextRef, payerId, payeeId and parties; deal.opened and deal.cancelled carry parties; deal.completed carries contextId and completionCid |
| TEST-PS-069-09.T27 | integration | PS-069-04.R05 | ingest cash_terms, crypto_request, receipt and dispute statements, an fx_quote_revocation and an unregistered commerce statement type | the first four dispatched to their registered handlers with signer-role checks; the revocation is not handled here; unregistered type quarantined with reason type_unregistered |
| TEST-PS-069-09.T28 | integration | PS-069-04.R06 | crypto claim whose txid the verifier has not found; crypto claim without a verifier and without txidAttested | first stays local with sendHold txid_lookup_pending, no claimCid and no outbox row until released; second refused with COMMERCE_CLAIM_METHOD_RULE |
| TEST-PS-069-09.T29 | integration | PS-069-05.R03, PS-069-04.R01 | listing_fee Deal on relay R - claim delivered to the operator mailbox, operator acknowledges through the relay command, then a moderator of R and the operator of another relay try | ack signed by the operator DID from R's signed policy document and applied in the seller vault; the other attempts FORBIDDEN |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
