# F09.S01.M01 — Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S01](../SPEC.md). **Process IDs:** PS-069-01…PS-069-10. **Code:** `packages/commerce/src/payments/noncustodial`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A Deal records what two or more parties owe each other for something agreed elsewhere (an accepted offer, an auction win, a barter compensation leg, a service milestone, a rental deposit, a listing fee). A PaymentClaim records that a payer says they paid and what the payee says back. There is no paid flag and no custody: the platform never holds funds or keys (COM-1). Deal and PaymentClaim are mirrored in every party's vault; claim, acknowledgement and dispute are Ed25519-signed statements that evidence an assertion, not delivery. Only a payee acknowledgement (cash, external) or chain finality (crypto) unlocks completed states, and the UI shows which.

## Responsibilities

- Provide the generic command commerce.deal.open that any context module calls with contextRef {type, id} and obligations; derive a deterministic dealId from the context so both vaults converge.
- Own Deal and PaymentClaim and the COM-3 status machine in each vault, including the 14-day no-progress expiry.
- Produce and verify the signed statements classrup.commerce.deal/v1, classrup.commerce.payment_claim/v1, classrup.commerce.payment_ack/v1, classrup.commerce.payment_dispute/v1 and classrup.commerce.deal_cancel/v1.
- Ingest incoming statements, check signer role against the deal, store with provenance, quarantine invalid ones, and detect forks (two incompatible signed statements with the same prev) and freeze the affected claim.
- Expose the MethodRulePort so cash (F09.S01.M02), crypto (F09.S01.M03) and external methods plug in their rules, and track peer sync state without claiming more certainty than reached.
- Mark a Deal completed only when every obligation is covered by acknowledged or final claims, and emit commerce.deal.completed.

## Not responsible for

- Cash-specific rules and receipts guidance (F09.S01.M02) and on-chain verification (F09.S01.M03).
- Signed receipts (F09.S02.M01), dispute cases (F09.S02.M02) and reconciliation (F09.S02.M03).
- Deciding what is owed; context modules (bazaar offers, auctions, mutiny compensation, services milestones, rentals deposits) own their agreements and call commerce.deal.open.
- Moving, escrowing, converting or refunding money; refunds are new obligations the parties settle themselves.
- Future: multi-currency obligations settled through a pinned FX quote, split payments across more than 10 claims per obligation, and a relay-side fee ledger for relays that charge for promotion (a relay acts as an ordinary payee party using these same statements).

## User stories

- As a buyer, I mark that I paid and the seller sees a claim labelled claimed (unverified) until they acknowledge it.
- As a seller, I acknowledge a payment I received, or dispute a claim that I did not receive, and the buyer sees my signed answer.
- As a participant in a barter cycle with a compensation leg, I see the money obligation as a Deal and know the platform does not hold the money.
- As any party, I can see how far each statement has travelled (saved here, prepared, relay received, peer accepted) and never see more certainty than that.

## Edge cases

- commerce.deal.open is called twice for the same contextRef from two tabs or devices; the deterministic dealId and unique index make the second call return the existing Deal.
- The peer receives a payment claim before the Deal statement; it is held in quarantine for up to 24 h and applied when the Deal arrives, then dropped with reason deal_unknown if it does not.
- A payer signs two different claims for the same obligation with the same prev (a forked vault); both are kept as evidence, the claim is frozen with COMMERCE_STATEMENT_FORK and the parties must renegotiate or open a dispute; nothing is auto-resolved.
- A payee acknowledgement signed before the 14-day expiry arrives after the local vault already expired the claim; it is stored as late evidence, the claim stays expired and the payee is offered to ask for a new claim.
- The payee marks a claim disputed, then acknowledges it after the payer shows proof; disputed to acknowledged is allowed and both signed statements stay in the history.
- [object Object]
- A context module calls open with an obligation in a disabled currency or with payer equal to payee; the call is refused before anything is stored.

## UX and accessibility

- Deal card: parties by pseudonym, context link, obligations with amount and currency, status chip (Open, Disputed, Completed, Cancelled, Expired) and the sentence 'Payments happen directly between you; ClassRup never holds money.'
- Payer sheet: choose method (cash, crypto, external), enter note or txRef, confirm 'I say I paid'; status then reads 'claimed (unverified)'.
- Payee sheet: Acknowledge received or Dispute; acknowledging shows the exact amount and currency being confirmed.
- Sync strip under every statement: saved on this device, prepared, relay received, peer accepted; unknown when a relay is unreachable.

**States:** loading; empty; open; claimed-unverified; acknowledged-by-payee; confirming-on-chain; final; disputed; frozen-conflict; expired; cancelled; pending-offline; quarantined

**Accessibility:** Status chips use text plus icon and are announced through an aria-live polite region when they change.; Acknowledge and Dispute are buttons of at least 44 by 44 px with accessible names that include the amount and currency.; The honest-label sentence is plain text associated with the status chip through aria-describedby.

## Owned data

- `Deal` (classrup.commerce.deal/v1, P2, RET-EVIDENCE)
- `PaymentClaim` (classrup.commerce.payment_claim/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `commerce.deal.open`, `commerce.deal.cancel`, `commerce.payment.claim`, `commerce.payment.acknowledge`, `commerce.payment.dispute`, `commerce.statement.ingest`
- Queries: `commerce.deal.get`, `commerce.deal.list_mine`, `commerce.payment.list_for_deal`
- Emits: `commerce.deal.opened`, `commerce.payment.claimed`, `commerce.payment.acknowledged`, `commerce.payment.disputed`, `commerce.payment.expired`, `commerce.deal.completed`, `commerce.deal.cancelled`
- Consumes: `commerce.payment.confirming`, `commerce.payment.confirmed`, `commerce.payment.finalized`, `commerce.payment.reorged`, `commerce.payment.failed`, `commerce.dispute.opened`, `commerce.dispute.resolved`, `privacy.deletion.completed`

## Dependencies

F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-069-01 | [Domain schema](domain_schema.md) | 3 |
| PS-069-02 | [Validation rules](validation_rules.md) | 3 |
| PS-069-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-069-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-069-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-069-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-069-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-069-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-069-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-069-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/payments/noncustodial/index.ts`.

## Acceptance criteria

- All tests T01 to T18 pass in CI.
- No state or label ever shows a payment as completed on the strength of a payer claim alone.
- Two independent vaults converge on the same Deal and claim statuses after exchanging the same signed statements in any order.
- A forked claim is frozen and never silently resolved.
