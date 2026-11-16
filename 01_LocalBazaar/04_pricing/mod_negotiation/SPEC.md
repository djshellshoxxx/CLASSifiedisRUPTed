# F01.S04.M02 — Price negotiation

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S04](../SPEC.md). **Process IDs:** PS-010-01…PS-010-10. **Code:** `packages/bazaar/src/pricing/negotiation`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Counteroffer chains between a buyer and a seller, up to 10 rounds, each round an immutable signed statement (classrup.bazaar.negotiation_round/v1) sent end to end encrypted to the counterparty. Round zero is the buyer's Offer (F01.S04.M01). The chain closes on acceptance, rejection, withdrawal or expiry. Consent is always given on the exact round and the exact listing revision: an acceptance statement binds the round digest. Because there is no shared server, each party's vault keeps its own copy and agreement exists only when the seller's vault has taken the inventory hold and signed a confirmation. Forked or conflicting signed rounds freeze the negotiation for explicit renegotiation; the app never picks a winner by timestamp.

## Responsibilities

- Own Negotiation (the chain) and NegotiationRound (immutable signed round) records in each party's vault.
- Create, verify and store counter, accept, reject, withdraw and close statements; quarantine statements with bad signatures, wrong roles or unknown negotiations.
- Enforce 10 rounds, a convergence rule (each counter moves toward the other side), per-round expiry (default 48 h, range 1 h to 7 days) and an overall 14-day limit.
- On acceptance, have the seller's vault take the inventory hold (bazaar.inventory.hold), open the Deal handoff to F09.S01.M01, and send the signed confirmation.
- React to listing changes, depletion and blocks by closing or freezing the chain.

## Not responsible for

- The first offer, its expiry and its direct accept/reject path (F01.S04.M01).
- Inventory quantities and holds (F01.S03.M01) and Deal, payment claims and receipts (F09).
- Messaging threads (F08); rounds are referenced from threads as structured cards, not copied.
- Multi-party barter revisions (F02.S01.M04).
- Future: automated counter rules such as auto-accept above a threshold, and bundle negotiations over several listings.

## User stories

- As a seller, I answer a buyer's offer with a counter price and a note, and see whether the buyer has received and accepted it.
- As a buyer, I accept a seller's counter and see clearly that the deal is agreed only after the seller's confirmation arrives.
- As either party, I can walk away, and I can see the full list of rounds with who proposed what.

## Edge cases

- Both parties counter at the same time (each on round n+1); the second statement to arrive fails the turn check, both vaults freeze the chain on detecting two signed rounds with the same number, and both are asked to restart from the last agreed round.
- Buyer accepts a seller round after the round expiry according to the seller's clock; the seller's vault refuses with EXPIRED and sends a signed close; the buyer's clock is only a claim.
- Seller edits the price materially after sending a counter; the buyer's accept is refused with BAZAAR_NEGOTIATION_LISTING_CHANGED and the buyer must review the new revision.
- The last unit is held for another buyer while the first buyer's acceptance is in transit; the seller vault returns a signed close with outcome superseded and no hold is taken.
- A counter moves away from the other side (seller raises above the buyer, or buyer lowers below their earlier amount); BAZAAR_NEGOTIATION_NOT_CONVERGING is returned.
- The 11th round is attempted; BAZAAR_NEGOTIATION_ROUND_LIMIT is returned and only accept, reject or withdraw remain.
- Statement arrives with a valid signature from a key that is not the stated buyer or seller; it is quarantined with reason role_mismatch.
- Either vault is offline for days; the other side sees prepared or transport_acknowledged, never accepted, and the round expiry keeps running.

## UX and accessibility

- Negotiation thread card (also embedded in F08 conversation): round list with proposer, amount, note, expiry, listing revision, and sync state chips (prepared, relay received, peer accepted).
- Counter sheet: amount input with currency, optional note (up to 280 characters), expiry selector, convergence hint, summary of the exact listing revision.
- Accept confirmation dialog: states exactly which round and amount is accepted and that the deal is agreed only after the seller's confirmation.

**States:** loading; awaiting-me; awaiting-them; pending-offline; accept-sent; accepted; rejected; withdrawn; expired; frozen-conflict

**Accessibility:** Round list is an ordered list; each round has a text summary readable by screen readers.; Status and sync-state changes are announced in an aria-live polite region.; Accept and Reject buttons are at least 44x44 px and have names that include the amount and round number.

## Owned data

- `Negotiation` (classrup.bazaar.negotiation/v1, P2, RET-EVIDENCE)
- `NegotiationRound` (classrup.bazaar.negotiation_round/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `bazaar.negotiation.counter`, `bazaar.negotiation.accept`, `bazaar.negotiation.reject`, `bazaar.negotiation.withdraw`, `bazaar.negotiation.discard_frozen`, `bazaar.negotiation.receive`
- Queries: `bazaar.negotiation.get`, `bazaar.negotiation.list_mine`
- Emits: `bazaar.negotiation.countered`, `bazaar.negotiation.closed`
- Consumes: `bazaar.listing.edited`, `bazaar.listing.unpublished`, `bazaar.listing.expired`, `bazaar.inventory.depleted`, `identity.block.added`, `bazaar.offer.rejected`, `bazaar.offer.expired`

## Dependencies

F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-010-01 | [Domain schema](domain_schema.md) | 3 |
| PS-010-02 | [Validation rules](validation_rules.md) | 3 |
| PS-010-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-010-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-010-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-010-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-010-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-010-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-010-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-010-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/pricing/negotiation/index.ts`.

## Acceptance criteria

- All tests T01-T19 pass in CI.
- An acceptance is never shown as agreed until the seller's signed confirmation with hold and Deal reference is verified.
- Conflicting signed rounds freeze the chain and never resolve by timestamp or last writer; amounts and notes never leave the two parties' encrypted channel.
