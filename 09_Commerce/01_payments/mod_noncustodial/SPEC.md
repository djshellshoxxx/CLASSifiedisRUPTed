# F09.S01.M01 — Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S01](../SPEC.md). **Process IDs:** PS-069-01…PS-069-10. **Code:** `packages/commerce/src/payments/noncustodial`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A Deal records what two or more parties owe each other for something agreed elsewhere (an accepted offer, an auction win, a barter compensation leg, a service milestone, a rental deposit or damage amount, a listing fee). A PaymentClaim records that a payer says they paid and what the payee says back. There is no paid flag and no custody: the platform never holds funds or keys (COM-1). Deal and PaymentClaim are mirrored by every party; deal, claim, acknowledgement, dispute, cancellation and completion are Ed25519-signed statements that evidence an assertion, not delivery, and a receiving vault mirrors a Deal only after checking it against the signed context through the context module's ContextTermsPort. Only a payee acknowledgement unlocks completed states: signed directly for cash and external payments, and signed by the payee's vault from its own chain verifier for crypto. Crypto observation status is per vault and labelled according to that vault's verifier.

## Responsibilities

- Provide the generic command commerce.deal.open and the in-process DealPort {open, cancel, unfreeze} that context modules call with contextRef {type, id}, contextCid, parties and obligations; derive dealId as a UUIDv8 from contextRef and contextCid so every vault converges.
- Own Deal and PaymentClaim and the COM-3 status machine in each vault, including the 14-day no-progress expiry, open dispute case tracking and partial-coverage expiry.
- Produce and verify the signed statements classrup.commerce.deal/v1, classrup.commerce.payment_claim/v1, classrup.commerce.payment_ack/v1, classrup.commerce.payment_dispute/v1, classrup.commerce.deal_cancel/v1 and classrup.commerce.deal_completion/v1, each with the signer role registered in F11.S01.M01.
- Ingest incoming statements, check signer role and context terms, order them by the per-author seq and prev chain (FED-3), store with provenance, quarantine invalid ones within a bounded quarantine, dispatch the method modules' statement types to their StatementHandlerPort handlers, and freeze a claim only on a true fork.
- Expose the MethodRulePort so cash (F09.S01.M02), crypto (F09.S01.M03) and external methods plug in their rules, hold claims the method rule has not cleared, and track peer sync state without claiming more certainty than reached.
- Mark a Deal completed only when every obligation is covered by payee-acknowledged claims, sign the completion body and emit commerce.deal.completed with its completionCid.
- Support MVP listing_fee Deals whose payee is a relay operator named in that relay's signed policy document, acknowledged through a relay command under relay policy.
- Freeze a Deal named in bazaar.inventory.conflict_detected linkedDealIds until the context owner resolves the inventory fork, and apply the rentals block exception (N7a) that ContextTermsPort.blockExempt reports.
- Let a party export the all-party signed deal_completion/v1 proof without amounts or obligations for voluntary submission to a relay (F12.S03.M04 moderation.accountlimit.submit_completion).

## Not responsible for

- Cash-specific rules and the cash receipt prompt (F09.S01.M02) and on-chain verification (F09.S01.M03).
- Signed receipts (F09.S02.M01), dispute cases (F09.S02.M02) and reconciliation (F09.S02.M03).
- Deciding what is owed; context modules (bazaar offers, auctions, mutiny compensation, services milestones, rental reservations, cancellation fees, deposits, deposit releases, late fees and damage, listing publication) own their agreements, implement ContextTermsPort and call commerce.deal.open.
- Issuing or requiring reputation review tickets (F07.S03.M01 signs them on commerce.deal.opened and commerce.deal.completed).
- Moving, escrowing, converting or refunding money; refunds are new obligations the parties settle themselves.
- Future: multi-currency obligations settled through a pinned FX quote and split payments across more than 10 claims per obligation.

## User stories

- As a buyer, I mark that I paid and the seller sees a claim labelled claimed (unverified) until they acknowledge it.
- As a seller, I acknowledge a payment I received, or dispute a claim that I did not receive, and the buyer sees my signed answer.
- As a participant in a barter cycle with a compensation leg, I see the money obligation as a Deal and know the platform does not hold the money.
- As any party, I can see how far each statement has travelled (saved here, prepared, relay received, peer accepted) and never see more certainty than that.
- As a seller whose buyer withdrew before my acceptance arrived, my offer module voids the Deal on its own and the buyer's vault shows the cancellation as one-sided.
- As a seller promoting a listing on a relay, I pay the relay operator through a listing_fee Deal and see the operator's signed acknowledgement, never a paid flag.

## Edge cases

- commerce.deal.open is called twice for the same contextRef and contextCid from two tabs or devices; the UUIDv8 dealId and unique index make the second call return the existing Deal.
- An auction second-chance offer opens a Deal for the same auction result; its new contextCid yields a different dealId, so it never collides with the original winner's Deal.
- The peer receives a payment claim before the Deal statement; it is buffered for up to 24 h and applied when the Deal arrives, then dropped with reason deal_unknown if it does not.
- A payer signs two different claims with the same prev or seq (a forked vault); both are kept as evidence, the claim is frozen with COMMERCE_STATEMENT_FORK and the parties must renegotiate or open a dispute; nothing is auto-resolved. A second partial claim whose prev is the first claim is not a fork.
- A payee acknowledgement arrives before the dispute it follows; its prev is unknown, so it is buffered and applied after the dispute, never reported as a fork.
- A payee acknowledgement signed before the 14-day expiry arrives after the local vault already expired the claim; it is stored as late evidence, the claim stays expired and the payee is offered to ask for a new claim.
- The payee marks a cash claim disputed, then acknowledges it after the payer shows proof; disputed to acknowledged is allowed and both signed statements stay in the history.
- Clock skew - the payer's claimedAt is ahead of the payee's clock by more than 10 minutes; the statement is accepted but displayed as the payer's claimed time with a skew note, and expiry is computed from local receivedAt.
- A context module calls open with an obligation in a disabled currency or with payer equal to payee; the call is refused before anything is stored.
- A counterparty signs a Deal statement whose obligation is larger than the accepted offer; ContextTermsPort recomputes the terms from the offer statement and the Deal is quarantined with COMMERCE_DEAL_CONTEXT_CONFLICT.
- Only the payer configured a chain verifier; the payer's vault shows 'final per your verifier; payee has not confirmed' and neither vault completes the Deal until the payee's vault signs its chain acknowledgement.
- 10 000 freshly generated dids each send one statement; the bounded quarantine evicts the oldest entries and then drops statements from dids that are party to no known Deal or context.
- Two devices of the seller accepted different offers for the last unit while offline; on sync the inventory module emits bazaar.inventory.conflict_detected with both dealIds, both Deals are frozen in the seller vault, the buyer's claim is stored but cannot be acknowledged, and the owner keeps one Deal (DealPort.unfreeze) and cancels the other with reason conflict_resolved.
- The renter blocks the owner after the reservation was confirmed; the deposit release claim and its acknowledgement are still verified and stored with notifications suppressed because ContextTermsPort.blockExempt reports the rental Deal exempt, while a new rental request from the blocked owner is dropped.
- An auction seller opens a second-chance Deal whose contextRef id is derived from the second_chance_offer cid and whose contextCid is the candidate's second_chance_response cid; V01 accepts it as an auction_result context and the Deal does not collide with the original winner's Deal.

## UX and accessibility

- Deal card: parties by pseudonym, context link, obligations with amount and currency, status chip (Open, Disputed, Completed, Cancelled, Cancelled by one party, Expired, Partly paid and expired, Frozen - stock conflict being resolved) and the sentence 'Payments happen directly between you; ClassRup never holds money.'
- Payer sheet: choose method (cash, crypto, external), enter note or txRef, confirm 'I say I paid'; status then reads 'claimed (unverified)'. For crypto without a verifier the sheet asks to confirm 'this is a public transaction ID, never a key'; a txid the verifier has not found yet shows 'kept on this device until the transaction is found'.
- Payee sheet: Acknowledge received or Dispute for cash and external claims; acknowledging shows the exact amount and currency being confirmed. Crypto claims show the payee's own verifier status and 'confirmed for you when your verifier reports final'.
- Crypto status line: 'confirmed N of M per your verifier', 'awaiting finalized checkpoint' on EVM chains, 'final per your verifier; payee has not confirmed' in the payer vault, 'final - confirmed by the payee's verifier (signed)' once the payee's chain acknowledgement arrives.
- Sync strip under every statement: saved on this device, prepared, relay received, peer accepted; unknown when a relay is unreachable.
- Completion proof export on a completed Deal: preview of exactly what is sent (dealId, dealCid, completionCid, outcome and every party's signature; no amounts, obligations or context), the sentence 'The relay will learn that these keys completed a deal', Export and Cancel.

**States:** loading; empty; open; claimed-unverified; held-on-device; acknowledged-by-payee; confirming-on-chain; final-per-your-verifier; final-confirmed-by-payee; disputed; frozen-conflict; frozen-inventory-conflict; expired; expired-partial; cancelled; cancelled-one-sided; pending-offline; quarantined

**Accessibility:** Status chips use text plus icon and are announced through an aria-live polite region when they change.; Acknowledge and Dispute are buttons of at least 44 by 44 px with accessible names that include the amount and currency.; The honest-label sentence is plain text associated with the status chip through aria-describedby.

## Owned data

- `Deal` (classrup.commerce.deal/v1, P2, RET-EVIDENCE)
- `PaymentClaim` (classrup.commerce.payment_claim/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `commerce.deal.open`, `commerce.deal.cancel`, `commerce.payment.claim`, `commerce.payment.acknowledge`, `commerce.payment.dispute`, `commerce.statement.ingest`
- Queries: `commerce.deal.get`, `commerce.deal.list_mine`, `commerce.payment.list_for_deal`, `commerce.statement.diagnostics`, `commerce.deal.export_completion`
- Emits: `commerce.deal.opened`, `commerce.payment.claimed`, `commerce.payment.acknowledged`, `commerce.payment.disputed`, `commerce.payment.expired`, `commerce.deal.completed`, `commerce.deal.cancelled`
- Consumes: `commerce.payment.confirming`, `commerce.payment.confirmed`, `commerce.payment.finalized`, `commerce.payment.reorged`, `commerce.payment.failed`, `commerce.dispute.opened`, `commerce.dispute.resolved`, `commerce.dispute.withdrawn`, `privacy.deletion.completed`, `bazaar.inventory.conflict_detected`

## Dependencies

F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-069-01 | [Domain schema](domain_schema.md) | 5 |
| PS-069-02 | [Validation rules](validation_rules.md) | 7 |
| PS-069-03 | [Workflow state machine](workflow_state_machine.md) | 10 |
| PS-069-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-069-05 | [Authorization and capabilities](authorization_capabilities.md) | 4 |
| PS-069-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-069-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 6 |
| PS-069-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-069-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-069-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 4 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/payments/noncustodial/index.ts`.

## Acceptance criteria

- All tests T01 to T38 pass in CI.
- No state or label ever shows a payment as completed on the strength of a payer claim alone.
- Two independent vaults converge on the same Deal status and on the statement-driven claim statuses (cash and external claims and the claim, acknowledgement and dispute chain) after exchanging the same signed statements in any order; crypto observation statuses are per vault and labelled according to your verifier, and crypto-driven completion converges through the payee's signed chain acknowledgement.
- A forked claim is frozen and never silently resolved.
- A Deal statement whose parties or obligations differ from the signed context is never mirrored.
