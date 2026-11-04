# F03.S02.M01 — Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F03.S02](../SPEC.md). **Process IDs:** PS-032-01…PS-032-10. **Code:** `packages/services/src/service_booking/quotes`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A client sends a quote request to a provider; the provider answers with a signed quote (price, optional milestone plan, start time, validity, cancellation terms); the client accepts the exact quote by signing its content hash; the provider then signs a booking confirmation. Each of these is a signed statement exchanged over end-to-end encrypted mailboxes or directly; each party's vault keeps its own Booking record derived from the statements it holds. A booking is confirmed only when both signatures exist. The platform takes no payment; money is handled by F09 claims between the parties.

## Responsibilities

- Own QuoteRequest, ServiceQuote and Booking records in each party's vault and the statement schemas quote_request, quote, quote_acceptance, quote_decline, booking_confirmation and booking_cancellation (all classrup.services.*/v1).
- Verify every inbound statement - signature, signer role (client for requests and acceptances, provider for quotes and confirmations), exact quote cid and expiry - and quarantine anything else with a reason.
- On provider confirmation commit the slot through F03.S01.M02 and open a local Deal in F09.S01.M01 in the same vault transaction.
- Apply cancellation terms and compute the late-cancellation fee as a claim amount, never as a charge.

## Not responsible for

- Slot generation and holds (F03.S01.M02) and the offering (F03.S01.M01).
- Milestone delivery and approval (F03.S02.M02) and dispute handling (F03.S02.M03, F09.S02.M02).
- Payment, receipts and chain verification (F09).
- Message transport and mailboxes (F08, F11); this module only hands signed envelopes to the sync outbox.
- Future: recurring bookings, group bookings and quote revision rounds beyond one superseding quote.

## User stories

- As a client, I request a quote for a task with a description and a preferred time window and see when the provider answers.
- As a provider, I issue a quote with a price, optional milestones and validity, and the slot is held for me while it is open.
- As a client, I accept the exact quote and see honestly whether the provider has confirmed yet or the booking is still awaiting confirmation.
- As either party, I cancel under the stated policy and see the fee claim that applies before I confirm.

## Edge cases

- Two clients accept two quotes for the same slot; the provider vault holds the slot only for the first quote, so the second acceptance gets a signed refusal (booking_cancellation reason slot_taken) and the second client sees declined.
- Acceptance arrives after validUntil by the provider clock plus 5 minutes tolerance; the provider refuses with reason quote_expired and the client sees expired.
- Provider issues a second quote for the same request; the first becomes superseded and an acceptance of it is refused with reason quote_superseded.
- A statement arrives signed by a key that is not the offering provider key or not the request author; it is quarantined and never changes state.
- The same acceptance statement is delivered twice or through two relays; dedup by cid makes the second a no-op.
- Client cancels offline and syncs two days later; effective cancellation time is the claimed time only when it is within 72 h before the receipt time, otherwise the receipt time.
- Client blocks the provider (or the reverse) while a request is open; open requests move to cancelled with reason blocked and no notice reveals the block.
- Provider confirmation is lost in transit; the client still sees awaiting_confirmation (transport_acknowledged at most) and never confirmed.

## UX and accessibility

- Request sheet: task description (≤ 2000 chars), preferred window, optional budget with currency, attachments by reference (max 5).
- Quote card: price, milestone plan, start time in the viewer's zone and the provider's zone, validity countdown, cancellation policy in words and numbers, Accept button naming the exact amount.
- Booking card: state chip (awaiting confirmation, confirmed, in progress, completed, cancelled, disputed) with a sync line (prepared, delivered to relay, acknowledged by peer).

**States:** loading; empty; request-draft; quoted; awaiting-confirmation; confirmed; cancelled; expired; quarantined; pending-offline

**Accessibility:** Accept and Cancel are buttons of at least 44x44 px whose accessible names include the amount and the date.; Countdown is conveyed as text (expires in 2 d 3 h) in an aria-live polite region updating at most once per minute.; Sync status uses text labels and never colour alone.

## Owned data

- `QuoteRequest` (classrup.services.quote_request/v1, P2, RET-EVIDENCE)
- `ServiceQuote` (classrup.services.quote/v1, P2, RET-EVIDENCE)
- `Booking` (classrup.services.booking/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `services.quote.request`, `services.quote.issue`, `services.quote.accept`, `services.quote.decline`, `services.booking.confirm`, `services.booking.cancel`, `services.statement.receive`
- Queries: `services.quote.get`, `services.quote.list_mine`, `services.booking.list_mine`
- Emits: `services.quote.requested`, `services.quote.issued`, `services.quote.accepted`, `services.booking.confirmed`, `services.booking.cancelled`, `services.quote.declined`, `services.quote.expired`
- Consumes: `services.milestone.submitted`, `services.booking.completed`, `services.dispute.opened`, `commerce.dispute.resolved`, `identity.block.added`

## Dependencies

F03.S01.M01, F03.S01.M02, F09.S01.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-032-01 | [Domain schema](domain_schema.md) | 3 |
| PS-032-02 | [Validation rules](validation_rules.md) | 3 |
| PS-032-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-032-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-032-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-032-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-032-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-032-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-032-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-032-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/services/src/service_booking/quotes/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No booking is ever shown as confirmed without the provider's verified signed confirmation held in the vault.
- Duplicated, reordered or replayed statements never change state twice.
