# F01.S04.M02 — Price negotiation

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S04](../SPEC.md). **Process IDs:** PS-010-01…PS-010-10. **Code:** `packages/bazaar/src/pricing/negotiation`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Counteroffer chains between a buyer and a seller, up to 10 rounds, each round an immutable signed statement (classrup.bazaar.negotiation_round/v1) sent end to end encrypted to the counterparty. Round zero is the buyer's Offer (F01.S04.M01), which the first counter closes with reason countered (N10); every round keeps the root offer's currency and quantity. The chain closes on acceptance, rejection, withdrawal or expiry. Consent is always given on the exact round and the exact listing revision through the shared consent API (comms.consent.sign with subjectType bazaar_negotiation over the round digest, N13). Because there is no shared server, each party's vault keeps its own copy and agreement exists only when the seller's vault has taken a Deal-linked inventory hold and signed a confirmation. Expiry is judged by each vault's clock with a 24 h grace for a decision in transit, after which the waiting side sends a signed timeout close. Forked or conflicting signed rounds freeze the negotiation for explicit discarding; the app never picks a winner by timestamp.

## Responsibilities

- Own Negotiation (the chain) and NegotiationRound (immutable signed round) records in each party's vault.
- Create, verify and store counter, reject, withdraw, close and confirm statements and sign acceptances through F08.S02.M02; quarantine statements with bad signatures, wrong roles or unknown negotiations.
- Enforce 10 rounds, the root offer's currency and quantity, a convergence rule (each counter moves toward the other side), per-round expiry (default 48 h, range 1 h to 7 days) and an overall 14-day limit.
- On acceptance, have the seller's vault take a Deal-linked inventory hold (bazaar.inventory.hold), open the Deal (F09.S01.M01), and send the signed confirmation; cancel that Deal when a late timeout close arrives.
- Close the root offer with reason countered in the same transaction as the first counter.
- React to listing changes, depletion, hold forks and blocks by closing or freezing the chain.
- Register the F10 privacy ports and pseudonymize retained chains after principal deletion (N6).

## Not responsible for

- The first offer, its expiry and its direct accept/reject path (F01.S04.M01).
- Inventory quantities and holds (F01.S03.M01) and Deal, payment claims and receipts (F09).
- Consent signing and verification primitives (F08.S02.M02) and mirror verification of listing projections (F11.S01.M02).
- Messaging threads (F08); rounds are referenced from threads as structured cards, not copied.
- Multi-party barter revisions (F02.S01.M04).
- Future: automated counter rules such as auto-accept above a threshold, and bundle negotiations over several listings.

## User stories

- As a seller, I answer a buyer's offer with a counter price and a note, and see whether the buyer has received and accepted it.
- As a buyer, I accept a seller's counter and see clearly that the deal is agreed only after the seller's confirmation arrives.
- As either party, I can walk away, and I can see the full list of rounds with who proposed what.

## Edge cases

- Both parties counter at the same time (each on round n+1); the second statement to arrive fails the turn check, both vaults freeze the chain on detecting two signed rounds with the same number, and both are asked to discard the chain and start again with a new offer.
- Buyer accepts a seller round after the round expiry according to the seller's clock; the seller's vault refuses with EXPIRED and sends a signed close; the buyer's clock is only a claim.
- The seller confirms 5 minutes before expiry on its clock and the confirmation reaches the buyer 2 hours after expiry; the buyer applies it inside the 24 h grace. After the grace the buyer sends a signed timeout close and the seller cancels the Deal and releases the hold.
- Seller edits the price materially after sending a counter; the buyer's accept is refused with BAZAAR_NEGOTIATION_LISTING_CHANGED and the buyer must review the new revision.
- The last unit is held for another buyer while the first buyer's acceptance is in transit; the seller vault returns a signed close with outcome superseded and no hold is taken.
- A counter moves away from the other side (seller raises above the buyer, or buyer lowers below their earlier amount); BAZAAR_NEGOTIATION_NOT_CONVERGING is returned.
- The offer is in EUR and the seller counters in USD, or with another quantity; VALIDATION_FAILED is returned because the chain is pinned to the root offer's currency and quantity.
- The 11th round is attempted; BAZAAR_NEGOTIATION_ROUND_LIMIT is returned and only accept, reject or withdraw remain.
- Statement arrives with a valid signature from a key that is not the stated buyer or seller; it is quarantined with reason role_mismatch.
- Either vault is offline for days; the other side sees prepared or transport_acknowledged, never accepted, and the round expiry keeps running.
- The buyer withdraws the root offer while the seller's first counter is in transit; when round 1 arrives the buyer vault closes the chain as withdrawn and sends a signed close.
- A chain stays frozen and nobody decides; it expires at its hard deadline.

## UX and accessibility

- Negotiation thread card (also embedded in F08 conversation): round list with proposer, amount, note, expiry, listing revision, and sync state chips (prepared, relay received, peer accepted).
- Counter sheet: amount input in the chain currency, optional note (up to 280 characters), expiry selector, convergence hint, summary of the exact listing revision.
- Accept confirmation dialog: states exactly which round and amount is accepted and that the deal is agreed only after the seller's confirmation.

**States:** loading; awaiting-me; awaiting-them; pending-offline; accept-sent; expiring-grace; accepted; rejected; withdrawn; expired; frozen-conflict

**Accessibility:** Round list is an ordered list; each round has a text summary readable by screen readers.; Status and sync-state changes are announced in an aria-live polite region.; Accept and Reject buttons are at least 44x44 px and have names that include the amount and round number.

## Owned data

- `Negotiation` (classrup.bazaar.negotiation/v1, P2, RET-EVIDENCE)
- `NegotiationRound` (classrup.bazaar.negotiation_round_record/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `bazaar.negotiation.counter`, `bazaar.negotiation.accept`, `bazaar.negotiation.reject`, `bazaar.negotiation.withdraw`, `bazaar.negotiation.discard_frozen`, `bazaar.negotiation.keep_frozen`, `bazaar.negotiation.receive`
- Queries: `bazaar.negotiation.get`, `bazaar.negotiation.list_mine`
- Emits: `bazaar.negotiation.countered`, `bazaar.negotiation.closed`
- Consumes: `bazaar.listing.edited`, `bazaar.listing.unpublished`, `bazaar.listing.expired`, `bazaar.listing.closed`, `bazaar.inventory.depleted`, `bazaar.inventory.conflict_detected`, `identity.block.added`, `federation.record.accepted`, `federation.tombstone.applied`, `comms.consent.received`, `commerce.deal.cancelled`, `privacy.deletion.completed`

## Dependencies

F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-010-01 | [Domain schema](domain_schema.md) | 5 |
| PS-010-02 | [Validation rules](validation_rules.md) | 4 |
| PS-010-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-010-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-010-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-010-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-010-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-010-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-010-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-010-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/pricing/negotiation/index.ts`.

## Acceptance criteria

- All tests T01-T26 pass in CI.
- An acceptance is never shown as agreed until the seller's signed confirmation with hold and Deal reference is verified, and a late confirmation never leaves an open Deal behind an expired chain.
- Conflicting signed rounds freeze the chain and never resolve by timestamp or last writer; amounts and notes never leave the two parties' encrypted channel.
