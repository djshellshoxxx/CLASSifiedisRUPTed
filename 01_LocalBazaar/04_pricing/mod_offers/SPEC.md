# F01.S04.M01 — Purchase offers

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S04](../SPEC.md). **Process IDs:** PS-011-01…PS-011-10. **Code:** `packages/bazaar/src/pricing/offers`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Buyers make money offers on published sell listings. Under ADR-0016 the buyer's vault records the offer and publishes it as a participant statement (classrup.bazaar.offer/v1) through the StatementPublisherPort (F11.S01.M02 federation.record.publish), sealed end to end to the mailbox named in the verified listing projection on the offer's own thread stream; F11.S01.M02 signs it and the receiving vault's F11.S01.M02 acknowledges it. Before acting on an offer each vault asks federation.conflict.is_frozen (F11.S02.M03) and fails closed. The seller's vault verifies it and can accept, reject or let it expire; the buyer can withdraw before a decision. Acceptance runs in the seller's vault in one IndexedDB transaction: it places a local inventory hold (F01.S03.M01) tied to the lifetime of a noncustodial Deal (F09.S01.M01) and signs the acceptance through the shared consent API (F08.S02.M02, N13). Every other seller-side close is sent to the buyer as a signed decision, so both copies converge. A hold only protects inside one vault: two forked devices of the seller that accept different offers are detected and frozen for the owner, never resolved by timestamp. Offers below the seller's private minimum look to the buyer exactly like unanswered offers. The platform never takes payment and no relay is authoritative or can read offers.

## Responsibilities

- Own the Offer record in the buyer's and in the seller's vault and its lifecycle from made to a terminal decision.
- Verify inbound offer, decision and withdrawal statements (signer role, offer binding, cid dedup) and quarantine anything else.
- Enforce one open offer per buyer per listing variant, a per-listing cap of 50 open offers and the seller's private minimum offer.
- On acceptance in the seller's vault, place a Deal-linked inventory hold, open a Deal and sign the consent in one local transaction; roll back if any fails.
- Send a signed decision for every seller-side close except timeout and below-minimum, and derive buyer-side listing changes from the verified mirror.
- Expire offers after their deadline (default 48 h, range 1 h to 7 days), with a 24 h grace in the buyer vault for late acceptances.
- Register the F10 privacy ports and pseudonymize retained offers after principal deletion (N6).
- Register the ConsentSubjectPort {canonicalBytes, currentRevision, partyRole, isCommitted} of F08.S02.M02 for subjectType bazaar_offer and echo every received consent statement to the other participant before committing on it (N13).
- Implement the F09.S01.M01 ContextTermsPort {verify, openerRole, ownerRole} for Deal context type offer, including Deals opened on an accepted negotiation round of the offer (N5).
- Consume federation.conflict.detected and federation.conflict.resolved and call federation.conflict.is_frozen synchronously before acting on an offer subject (F11.S02.M03).

## Not responsible for

- Counteroffer rounds (F01.S04.M02 negotiation owns them and reuses Offer as round zero).
- Payment, receipts, disputes and the Deal lifecycle after acceptance (F09).
- Messaging between parties (F08); offers are referenced from threads, not copied.
- Consent signing and verification primitives (F08.S02.M02) and mirror verification of listing projections (F11.S01.M02).
- Signing, seq allocation, mailbox routing and transport acknowledgements of statements (F11.S01.M02 and F11.S02.M01) and conflict records (F11.S02.M03).

## User stories

- As a buyer, I can offer a price below the asking price and see whether it is pending, accepted, rejected or expired.
- As a seller, I can review all open offers on my listing sorted by amount and accept one, which reserves the item for that buyer.
- As a buyer, I can withdraw my offer before the seller decides.
- As a buyer, I can trust that an acceptance shown to me was signed by the listing author for exactly my offer.

## Edge cases

- Two tabs of the seller's vault accept two different offers for the last unit at the same time; the IndexedDB transaction serializes them, so within one vault exactly one acceptance succeeds and the other gets CONFLICT_STATE.
- Two devices of the seller accept different offers for the last unit while offline; both acceptances are kept, on sync F01.S03.M01 emits bazaar.inventory.conflict_detected and freezes both holds, both offers become frozen and neither Deal proceeds until the owner keeps one and sends a signed close to the other buyer.
- Listing is edited materially (price or condition) while offers are open; offers stay open but are marked listingChangedSinceOffer in the seller vault, and in the buyer vault once the newer verified projection arrives.
- Listing is unpublished, expired or closed in the seller vault; all open offers become expired with reason listing_unavailable and each buyer receives a signed decision. A relay removing the projection from its index changes no offer.
- Buyer is blocked by the seller after making an offer; the offer is rejected locally with reason blocked, the buyer receives an ordinary signed rejection with reason seller_rejected that does not reveal the block, and later statements from the buyer are dropped silently (N7).
- Offer currency differs from the listing currency; rejected unless the listing accepts that currency.
- Buyer goes offline after submitting; the outbox replays with the same Idempotency-Key and gets the original response.
- An offer below the seller's private minimum is stored rejected and hidden; the buyer sees the same peer acknowledgement as for any offer and the offer expires at expiresAt with reason timeout.
- The seller accepts 5 minutes before expiry on the seller's clock and the acceptance reaches the buyer 3 hours after expiry; the buyer vault still applies it inside the 24 h grace. After the grace the buyer sends a signed timeout close, and the seller cancels the Deal and releases the hold.
- The buyer withdraws while the seller's acceptance is in transit; the seller vault receives the withdrawal after accepting, cancels the Deal and releases the hold (withdrawn before accept); the buyer keeps the late acceptance only as evidence.
- A decision signed by a key that is not the listing author, or an acceptance consent replayed from another offer, is quarantined and the offer stays made.
- The seller answers with a counter; the offer is rejected with reason countered in the same transaction as the first negotiation round and the chain continues in F01.S04.M02.
- F11.S02.M03 detects that the seller signed two acceptance consents with different subjectRevisionHash values for one offer and emits federation.conflict.detected; the offer freezes and accept, reject, withdraw and resolve_conflict return CONFLICT_STATE until the conflict is resolved; if the conflict store cannot be read they return DEPENDENCY_UNAVAILABLE.

## UX and accessibility

- Make offer sheet: amount input with currency, quantity, optional note (≤ 280 chars), expiry selector, summary showing asking price from the verified listing projection.
- Seller offers list: sortable by amount and time, accept/reject buttons with confirmation dialog; offers below the private minimum are not listed.
- Buyer offer status card inside the listing and the conversation thread (F08.S02.M01) with sync state chips (prepared, relay received, seller received).
- Fork resolution sheet for the seller: frozen offers on the same unit, keep one, the others receive a signed close.

**States:** loading; empty; pending-offline; submitted; expiring-grace; accepted; rejected; expired; withdrawn; frozen-conflict; conflict

**Accessibility:** Amount input has a visible label including currency and uses inputmode=decimal.; Status changes are announced through an aria-live polite region.; Accept and reject are buttons ≥ 44×44 px with distinct accessible names including the amount.

## Owned data

- `Offer` (classrup.bazaar.offer_record/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `bazaar.offer.make`, `bazaar.offer.receive`, `bazaar.offer.accept`, `bazaar.offer.reject`, `bazaar.offer.withdraw`, `bazaar.offer.resolve_conflict`
- Queries: `bazaar.offer.list_for_listing`, `bazaar.offer.list_mine`
- Emits: `bazaar.offer.made`, `bazaar.offer.accepted`, `bazaar.offer.rejected`, `bazaar.offer.withdrawn`, `bazaar.offer.expired`
- Consumes: `bazaar.listing.edited`, `bazaar.listing.unpublished`, `bazaar.listing.expired`, `bazaar.listing.closed`, `bazaar.inventory.depleted`, `bazaar.inventory.conflict_detected`, `identity.block.added`, `federation.record.accepted`, `federation.tombstone.applied`, `comms.consent.received`, `federation.conflict.detected`, `federation.conflict.resolved`, `commerce.deal.cancelled`, `privacy.deletion.completed`

## Dependencies

F01.S01.M01, F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F11.S02.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-011-01 | [Domain schema](domain_schema.md) | 4 |
| PS-011-02 | [Validation rules](validation_rules.md) | 6 |
| PS-011-03 | [Workflow state machine](workflow_state_machine.md) | 7 |
| PS-011-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-011-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-011-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-011-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-011-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-011-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-011-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/pricing/offers/index.ts`.

## Acceptance criteria

- All tests T01–T31 pass in CI.
- No offer data appears in public, search, relay index or federation payloads (privacy test suite).
- Never two accepted offers for one unit within one vault; cross-device forks are detected and frozen, never resolved by timestamp; an offer below the private minimum is indistinguishable for the buyer from an unanswered one.
