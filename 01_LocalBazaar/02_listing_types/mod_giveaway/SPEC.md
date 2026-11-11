# F01.S02.M03 — Giveaway listing type

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S02](../SPEC.md). **Process IDs:** PS-005-01…PS-005-10. **Code:** `packages/bazaar/src/listing_types/giveaway`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Free-item listings. A giver publishes a giveaway with a selection mode (first come or giver choice), a queue limit and a closing time. Interested members send a signed, end-to-end encrypted request; the giver's vault queues requests in the order its device received them, breaks near-ties by a local random draw, applies anti-hoarding limits (including a cap on keys it has never seen) and selects a recipient, in first-come mode only after one giver confirmation per pick. Selection reserves the item locally through the inventory port and sends the recipient a signed selection statement with an expiry; the requester's vault accepts a selection or decline only when the author of the verified listing projection signed it for that exact request. No money changes hands; handover is confirmed by the giver and optionally marked received by the recipient, and neither is proof of delivery.

## Responsibilities

- Own GiveawayTerms (selection mode, queue limit, closing time, requester caps) and GiveawayRequest (one per requester per giveaway, in the giver's and in the requester's vault).
- Verify incoming request statements (signature, block lists, self-request, caps, fresh-key share) and quarantine invalid ones.
- Select a recipient by queue order (as received by the giver's device, near-ties drawn locally) with one giver confirmation, or by giver choice; reserve the quantity through bazaar.inventory.hold and sign the selection statement.
- [object Object]
- Verify selection and decline statements in the requester's vault against the author of the verified listing projection (F11.S01.M02) and the exact request they answer.
- Re-open selection when a selected recipient withdraws or does not collect within 72 hours.
- Register the F10 privacy ports and pseudonymize retained requests after principal deletion (N6).

## Not responsible for

- Listing creation and publication (F01.S01.M01, F01.S01.M03).
- Inventory quantities and holds (F01.S03.M01).
- Messaging and meetup coordination between giver and recipient (F08).
- Reputation effects (F07.S03.M01).
- Verifying the requester's real identity or neediness; requesters are pseudonymous principals and rings of pseudonyms cannot be fully detected.
- Mirror verification of the listing projection (F11.S01.M02); this module reads the verified mirror view.
- Future: lottery selection and charity-verified givers.

## User stories

- As a giver, I choose first come or my own choice and see who asked, with a short note from each.
- As a requester, I can ask for an item once, withdraw my request, and see whether I was selected and until when I must collect.
- As a giver, I am protected from one person or a swarm of new pseudonyms grabbing everything by per-person limits, a cap on unknown keys and a confirmation before each pick.
- As a requester, I can trust that a selection shown to me was signed by the person who published the giveaway.

## Edge cases

- Requests fetched in the same mailbox sync batch or received within 60 s of each other are tied and ordered by a giver-local random draw; requesters' timestamps are only claims and the queue says relays can influence order.
- A requester asks twice; the second is rejected with BAZAAR_GIVEAWAY_DUPLICATE_REQUEST.
- The selected recipient never collects; after 72 h the request expires, the hold is released and the giver may select again.
- Requester is blocked by the giver; the request is dropped silently on the giver side and the requester is shown only that it is pending delivery.
- The giver chooses a requester who withdrew a moment ago; selection returns CONFLICT_STATE and the queue refreshes.
- A request arrives for a closed or full giveaway; it is rejected with BAZAAR_GIVEAWAY_CLOSED and a signed decline is returned.
- A request statement carries a forged signature or a signer different from the stated requester; it is quarantined with reason and never queued.
- The giver's vault is offline for days; requests wait in the relay mailbox as ciphertext and are processed on next unlock; requesters see pending, never selected, until the signed selection arrives.
- 200 fresh keys send requests within a minute to a first-come giveaway with queueLimit 50; at most 25 are queued, they are tied and drawn, and nothing is selected until the giver confirms.
- A selection arrives at the requester signed by a key that is not the listing author, or a selection of an older withdrawn request is replayed; both are quarantined and the request stays pending.

## UX and accessibility

- Giveaway terms form: selection mode, queue limit (1 to 200), closing time (1 h to 30 d), pickup note.
- Giver queue: list of requests with pseudonym, note (up to 280 characters), request time (as claimed), tie group marker and the label Order as received by your device; relays can influence order; first-come shows the proposed next recipient with a Confirm pick button; giver choice shows Select with confirm dialog.
- Requester view: Request button, my request state, selected card with expiry, giver identity from the verified listing and instructions, Withdraw and Mark received actions.

**States:** loading; empty; queue-open; queue-full; closed; pick-awaiting-confirmation; requested-pending-delivery; selected; collected; expired; withdrawn; blocked-silent

**Accessibility:** Queue is a labelled list; Select, Confirm pick and Decline buttons have names including the requester pseudonym and are at least 44x44 px.; Status changes and new requests are announced in an aria-live polite region.; Expiry times are shown as text with date and time, not only as a countdown graphic.

## Owned data

- `GiveawayTerms` (classrup.bazaar.giveaway_terms/v1, P3, RET-STANDARD)
- `GiveawayRequest` (classrup.bazaar.giveaway_request_record/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `bazaar.giveaway_terms.define`, `bazaar.giveaway_request.request`, `bazaar.giveaway_request.receive`, `bazaar.giveaway_selection.receive`, `bazaar.giveaway_request.select`, `bazaar.giveaway_request.decline`, `bazaar.giveaway_request.withdraw`, `bazaar.giveaway_request.confirm_collected`
- Queries: `bazaar.giveaway_request.list_for_listing`, `bazaar.giveaway_request.list_mine`
- Emits: `bazaar.giveaway.recipient_selected`
- Consumes: `bazaar.listing.unpublished`, `bazaar.listing.expired`, `bazaar.listing.closed`, `identity.block.added`, `federation.tombstone.applied`, `privacy.deletion.completed`

## Dependencies

F01.S01.M01, F01.S03.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-005-01 | [Domain schema](domain_schema.md) | 4 |
| PS-005-02 | [Validation rules](validation_rules.md) | 4 |
| PS-005-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-005-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-005-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-005-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-005-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-005-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-005-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-005-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/listing_types/giveaway/index.ts`.

## Acceptance criteria

- All tests T01-T21 pass in CI.
- A recipient is never shown as selected before a selection statement signed by the listing author for that exact request is verified, and handover is never described as proven.
- Per-requester limits and the fresh-key share hold under retries, replays, Sybil swarms and concurrent tabs.
