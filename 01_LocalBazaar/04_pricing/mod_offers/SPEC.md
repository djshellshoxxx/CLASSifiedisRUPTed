# F01.S04.M01 — Purchase offers

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S04](../SPEC.md). **Process IDs:** PS-011-01…PS-011-10. **Code:** `packages/bazaar/src/pricing/offers`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Buyers make money offers on published sell listings. A seller can accept, reject or let an offer expire; a buyer can withdraw before a decision. Acceptance atomically reserves inventory through F01.S03.M01 and opens a noncustodial Deal in F09.S01.M01. The platform never takes payment.

## Responsibilities

- Own the Offer record and its lifecycle from made to a terminal decision.
- Enforce one open offer per buyer per listing variant and a per-listing cap of 50 open offers.
- On acceptance, request an inventory hold and open a Deal; roll back the acceptance if the hold fails.
- Expire offers after their deadline (default 48 h, range 1 h to 7 days).

## Not responsible for

- Counteroffer rounds (F01.S04.M02 negotiation owns them and reuses Offer as round zero).
- Payment, receipts and disputes (F09).
- Messaging between parties (F08); offers are referenced from threads, not copied.

## User stories

- As a buyer, I can offer a price below the asking price and see whether it is pending, accepted, rejected or expired.
- As a seller, I can review all open offers on my listing sorted by amount and accept one, which reserves the item for that buyer.
- As a buyer, I can withdraw my offer before the seller decides.

## Edge cases

- Two sellers' devices accept two different offers for the last unit at the same time; exactly one acceptance succeeds, the other gets CONFLICT_STATE.
- Listing is edited materially (price or condition) while offers are open; offers stay open but are marked listingChangedSinceOffer and the buyer is notified.
- Listing is unpublished, expired or removed by moderation; all open offers become expired with reason listing_unavailable.
- Buyer is blocked by the seller after making an offer; the offer is auto-rejected with reason blocked and no notification reveals the block.
- Offer currency differs from the listing currency; rejected unless the listing accepts that currency.
- Buyer goes offline after submitting; the outbox replays with the same Idempotency-Key and gets the original response.

## UX and accessibility

- Make offer sheet: amount input with currency, optional note (≤ 280 chars), expiry selector, summary showing asking price.
- Seller offers list: sortable by amount and time, accept/reject buttons with confirmation dialog.
- Buyer offer status card inside the listing and the conversation thread (F08.S02.M01).

**States:** loading; empty; pending-offline; submitted; accepted; rejected; expired; withdrawn; conflict

**Accessibility:** Amount input has a visible label including currency and uses inputmode=decimal.; Status changes are announced through an aria-live polite region.; Accept and reject are buttons ≥ 44×44 px with distinct accessible names including the amount.

## Owned data

- `Offer` (classrup.bazaar.offer/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `bazaar.offer.make`, `bazaar.offer.accept`, `bazaar.offer.reject`, `bazaar.offer.withdraw`
- Queries: `bazaar.offer.list_for_listing`, `bazaar.offer.list_mine`
- Emits: `bazaar.offer.made`, `bazaar.offer.accepted`, `bazaar.offer.rejected`, `bazaar.offer.withdrawn`, `bazaar.offer.expired`
- Consumes: `bazaar.listing.edited`, `bazaar.listing.unpublished`, `bazaar.listing.expired`, `bazaar.inventory.depleted`, `identity.block.added`

## Dependencies

F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-011-01 | [Domain schema](domain_schema.md) | 3 |
| PS-011-02 | [Validation rules](validation_rules.md) | 3 |
| PS-011-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-011-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-011-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-011-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-011-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-011-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-011-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-011-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/pricing/offers/index.ts`.

## Acceptance criteria

- All tests T01–T17 pass in CI.
- No offer data appears in public, search or federation payloads (privacy test suite).
- Concurrent acceptance never produces two accepted offers for one unit (property and integration tests).
