# F03.S02.M01 — Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F03.S02](../SPEC.md). **Process IDs:** PS-032-01…PS-032-10. **Code:** `packages/services/src/service_booking/quotes`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A client sends a quote request to a provider; the provider answers with a signed quote (price, optional milestone plan with sequence numbers, start time, validity, cancellation terms) and the provider vault holds the slot until validUntil plus 5 minutes; the client accepts the exact quote by signing a consent statement (F08.S02.M02, key consent.services.booking.accept.v1) over the quote cid; the provider vault extends the hold and signs a booking confirmation that repeats the accepted plan. Each of these is a signed statement exchanged over end-to-end encrypted mailboxes or directly; each party's vault keeps its own Booking record derived from the statements it holds. A booking is confirmed only when both signatures exist. Both vaults run the confirmation timeout and tell each other when it fires; crossing promises freeze the booking instead of diverging. This module opens no Deal and takes no payment: each approved milestone opens its own Deal in F09 through F03.S02.M02, and the late fee is an advisory claim between the parties.

## Responsibilities

- Own QuoteRequest, ServiceQuote and Booking records in each party's vault and the statement schemas quote_request, quote, quote_acceptance (which carries a consent statement), quote_decline, booking_confirmation and booking_cancellation (all classrup.services.*/v1).
- Verify every inbound statement - schema, signature, signer role derived from the signer key (client for requests, acceptances and client cancellations; provider for quotes, confirmations, withdrawals and provider cancellations), exact quote cid, plan equality and expiry - drop statements from blocked DIDs silently (N7) and quarantine anything else with a reason.
- On provider confirmation commit (or re-hold and commit) the slot through F03.S01.M02 and store the signed confirmation in the same vault transaction; no Deal is opened here.
- Apply cancellation terms and compute the late-cancellation fee as an advisory claim amount from delivery evidence both parties can check, never as a charge.
- Keep both vaults consistent at the edges - confirmation timeout, superseding quotes, offering withdrawal, availability changes, disputes and mutual cancellation through F08.S02.M02 consent - and freeze conflicting promises instead of letting the vaults diverge.

## Not responsible for

- Slot generation and holds (F03.S01.M02) and the offering (F03.S01.M01).
- Milestone delivery and approval (F03.S02.M02) and dispute handling (F03.S02.M03, F09.S02.M02).
- Deals, payment claims, receipts and chain verification (F09.S01.M01 and the rest of F09); milestone Deals are opened by F03.S02.M02 on approval and this module never calls commerce.deal.open.
- Message transport and mailboxes (F08, F11); this module only hands signed envelopes to the sync outbox.
- Exact on-site addresses (F06.S02.M02 L4 location shares over F08 threads).
- Future: recurring bookings, group bookings, a Deal context type for late fees, and quote revision rounds beyond superseding quotes.

## User stories

- As a client, I request a quote for a task with a description and a preferred time window and see when the provider answers.
- As a provider, I issue a quote with a price, optional milestones and validity, and the slot is held for me while it is open.
- As a client, I accept the exact quote and see honestly whether the provider has confirmed yet or the booking is still awaiting confirmation.
- As either party, I cancel under the stated policy and see the fee claim that applies before I confirm.
- As a provider, when I withdraw an offering, open requests and quotes on it close cleanly and their holds are released.

## Edge cases

- Two clients accept two quotes for the same slot after the first hold expired and a second quote was issued; the provider vault holds the slot only for one quote, so the other acceptance gets a provider-signed refusal (booking_cancellation reason slot_taken) and that client sees declined.
- Acceptance arrives after validUntil by the provider clock plus 5 minutes tolerance; the provider refuses with reason quote_expired and the client sees expired.
- Provider issues a second quote for the same request; the first becomes superseded, its hold is released in the same transaction and an acceptance of it is refused with reason quote_superseded.
- A statement arrives signed by a key that is not the offering provider key or not the request author; it is quarantined and never changes state.
- The same acceptance statement is delivered twice or through two relays; dedup by cid makes the second a no-op.
- Client cancels offline and syncs two days later; the fee is computed from the earliest relay-signed receipt time on the envelope from a relay the client selected, or else the provider vault receipt time, and the client's claimed time counts only within 5 minutes of that evidence; before signing offline the client was told the fee is computed at delivery.
- Client blocks the provider (or the reverse) while a request is open; open requests and unconfirmed bookings move to cancelled with reason blocked locally, later statements from the blocked DID are dropped silently (N7), and no notice reveals the block.
- Provider confirmation is lost in transit; the client still sees awaiting_confirmation (transport_acknowledged at most) and never confirmed; 24 hours after signing the acceptance the client vault signs and sends a confirmation_timeout cancellation.
- A provider confirmation delayed by 8 hours crosses the client's confirmation_timeout cancellation; the provider vault moves the booking to conflicted with the slot still committed, the client vault keeps cancelled and shows both statements, and the parties renegotiate explicitly (ADR-0016 section 5); nothing is quarantined.
- Provider withdraws the offering while requests and quotes are open; open and quoted requests are cancelled with reason offering_withdrawn, issued quotes are withdrawn with provider-signed quote_decline statements and their holds released; confirmed bookings are unaffected.
- A rule change in the provider calendar moves or removes the slot of an issued quote; the quote card shows needs reconfirmation and confirmation is refused until the provider reconfirms the hold or issues a superseding quote.
- 60 fresh DIDs each send one request in one day; the provider vault queues first-contact requests without per-item notifications, accepts at most 10 per day from DIDs with no prior interaction and 50 per day overall, and drops the rest with a local count.
- A provider signs a booking_cancellation with reason client_request to assign a late fee to the client; the role is derived from the signer key, so the statement is quarantined with SERVICES_STATEMENT_INVALID and no fee is recorded.

## UX and accessibility

- Request sheet: task description (≤ 2000 chars) with a warning when the text looks like a street address, preferred window, optional budget with currency, attachments by reference (max 5).
- Quote card: price, milestone plan with order and parallel marks, start time in the viewer's zone and the provider's zone, validity countdown, cancellation policy in words and numbers, needs-reconfirmation banner, Accept button naming the exact amount.
- Booking card: state chip (awaiting confirmation, confirmed, in progress, cancellation proposed, conflicted, disputed, completed, cancelled) with a sync line (prepared, delivered to relay, acknowledged by peer) and, when conflicted, both signed statements side by side with the renegotiation actions.
- Cancel sheet: policy, the fee number the statement will carry, and for offline cancellers the notice that the fee is computed from delivery evidence.
- First-contact queue (provider): requests from DIDs with no prior interaction, without per-item notifications, with bulk accept and drop.

**States:** loading; empty; request-draft; quoted; needs-reconfirmation; awaiting-confirmation; confirmed; cancellation-proposed; conflicted; disputed; cancelled; expired; quarantined; pending-offline

**Accessibility:** Accept and Cancel are buttons of at least 44x44 px whose accessible names include the amount and the date.; Countdown is conveyed as text (expires in 2 d 3 h) in an aria-live polite region updating at most once per minute.; Sync status and conflict banners use text labels and never colour alone.

## Owned data

- `QuoteRequest` (classrup.services.quote_request/v1, P2, RET-EVIDENCE)
- `ServiceQuote` (classrup.services.quote/v1, P2, RET-EVIDENCE)
- `Booking` (classrup.services.booking/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `services.quote.request`, `services.quote.issue`, `services.quote.accept`, `services.quote.decline`, `services.booking.confirm`, `services.booking.cancel`, `services.booking.propose_cancellation`, `services.booking.resolve_conflict`, `services.statement.receive`
- Queries: `services.quote.get`, `services.quote.list_mine`, `services.booking.list_mine`
- Emits: `services.quote.requested`, `services.quote.issued`, `services.quote.accepted`, `services.booking.confirmed`, `services.booking.cancelled`, `services.quote.declined`, `services.quote.expired`
- Consumes: `services.milestone.submitted`, `services.milestone.approved`, `services.booking.completed`, `services.dispute.opened`, `commerce.dispute.resolved`, `commerce.dispute.withdrawn`, `identity.block.added`, `services.offering.withdrawn`, `services.availability.changed`, `privacy.deletion.completed`

## Dependencies

F03.S01.M01, F03.S01.M02, F08.S01.M01, F08.S01.M03, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-032-01 | [Domain schema](domain_schema.md) | 3 |
| PS-032-02 | [Validation rules](validation_rules.md) | 3 |
| PS-032-03 | [Workflow state machine](workflow_state_machine.md) | 6 |
| PS-032-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-032-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-032-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-032-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 6 |
| PS-032-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-032-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-032-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/services/src/service_booking/quotes/index.ts`.

## Acceptance criteria

- All tests T01–T30 pass in CI.
- No booking is ever shown as confirmed without the provider's verified signed confirmation held in the vault.
- Duplicated, reordered or replayed statements never change state twice, and a booking never stays disputed after its case is resolved or withdrawn.
