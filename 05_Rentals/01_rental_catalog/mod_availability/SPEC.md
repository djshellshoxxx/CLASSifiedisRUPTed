# F05.S01.M01 — Rental availability

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F05.S01](../SPEC.md). **Process IDs:** PS-039-01…PS-039-10. **Code:** `packages/rentals/src/rental_catalog/availability`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Owners list rentable items (hourly and/or daily rate, quantity, buffers, lead time, blackout dates, late-fee terms, cancellation policy, declared item value and a condition checklist template) and keep the reservation calendar in their own vault. A renter sends a signed rental request that binds the offering revision and terms the renter saw and carries an absolute expiry; the owner's vault checks the requested interval, extended by the buffer before and after, against its own confirmed and frozen reservations with a half-open interval test and, if free and the terms are unchanged, the owner signs a confirmation. Overlap prevention exists only inside the owner's vault; the renter's copy is a claim until the owner's signed confirmation is held. Both parties' consents are comms.consent statements. The platform holds no funds; the rent and any cancellation fee are noncustodial F09 Deals between the parties, and deposits are F05.S01.M02.

## Responsibilities

- Own RentalOffering and RentalReservation records in the owner and renter vaults and the statements offering projection, busy_blocks, rental_request, rental_confirmation, rental_cancellation, reservation_frozen and reservation_renegotiation (classrup.rentals.*/v1), each registered with its signer role in the F11.S01.M01 statement registry.
- Check overlap in UTC with half-open intervals [start - bufferBefore, end + bufferAfter), counting confirmed, handoff_pending, in_use, overdue and frozen units against quantity (1..20), lead time, horizon of 365 days, maximum duration of 90 days and blackout dates in the offering time zone.
- On confirmation, store the signed confirmation and copy the terms the renter signed in the request (rent, late fee, cancellation policy, declared value) and the checklist template of that offering revision; at handoff the owner vault opens the rent Deal through commerce.deal.open with contextRef {type rental_reservation, id reservationId} and contextCid requestCid.
- Track reservation status from handoff, return and closure events, shorten the occupied interval on early return, extend it while overdue and end it at closure for an item that is never returned.
- Expire requests on the signed absolute expiresAt in both vaults, never cancel a confirmed reservation automatically while a signed handoff report may exist, and freeze forked or equivocal owner promises for explicit renegotiation.
- Emit rentals.offering.withdrawn locally when a published offering is paused, archived or loses its listing, so the local discovery index (F06.S01.M01) removes the rental listing; copies of the signed projection already held by relays and other vaults end through the listing unpublish, an author tombstone or the projection expiry.

## Not responsible for

- Deposit terms and release or forfeit (F05.S01.M02).
- Condition reports and attestations at pickup and return (F05.S02.M01, F05.S02.M02), damage claims (F05.S02.M03) and disputes (F09.S02.M02).
- Cross-vault locking; two renters can each hold an unconfirmed request, and only the owner's signed confirmation reserves the interval.
- Exact pickup address sharing; it is an L4 location share owned by F06.S02.M02 and sent in the F08 thread by explicit user action.
- Future: multi-owner pooled inventory, recurring rentals and delivery logistics.

## User stories

- As an owner, I list a tent with a daily rate, a 2 hour buffer after each rental, a late fee and a cancellation policy, and see my calendar of reservations.
- As a renter, I pick dates, see the exact price, late fee, cancellation terms and declared item value, send a request that binds exactly those terms, and see honestly whether the owner has confirmed.
- As an owner, I confirm a request only if it fits and my terms have not changed since the renter saw them, and the vault stops me from confirming overlapping reservations.
- As either party, I cancel under the cancellation policy copied into the signed request, a renter cancellation inside the fee period opens the stated fee as a payment Deal, and the interval is freed in the owner's calendar.

## Edge cases

- Two renters request overlapping dates; both requests stay requested, the owner confirms one, and the other cannot be confirmed (RENTALS_INTERVAL_CONFLICT) and is answered with a signed decline.
- Back-to-back rentals where the next start is inside the previous buffer; refused by the buffer rule, shown to the renter as unavailable at the conflicting time.
- Interval touching exactly at the boundary (end of one equals start of the next with zero buffers) is allowed because intervals are half-open.
- Daylight saving change inside the rental; duration is elapsed time in UTC, a day is 24 elapsed hours, and blackout dates are evaluated by local calendar date in the offering time zone.
- Early return frees the tail of the occupied interval after the return buffer; late return keeps the interval blocked until the return is attested, and a pending next request is flagged.
- Owner confirms on two forked devices; both reservations are frozen, keep counting toward capacity so no third booking can be confirmed over them, and each affected renter receives a signed reservation_frozen notice; renegotiation, cancellation or the frozen expiry at startsAt minus lead time ends the freeze.
- The owner's vault holds a confirmation and a decline it signed over the same requestCid (forked devices); in either arrival order both vaults freeze the reservation instead of following arrival order.
- Request arrives after the owner paused or archived the offering; refused with RENTALS_OFFERING_UNAVAILABLE and a signed decline.
- Owner raises the late fee between request and confirmation; the confirmation is refused with RENTALS_TERMS_CHANGED and the renter must send a new request with the new terms.
- Request is never answered; the owner vault expires it at the signed expiresAt and sends a signed expired notice, the renter vault stops retrying and stops counting it toward the open-request limit at min(expiresAt + 24 h, startsAt − leadTime), and a valid confirmation delivered late is held frozen for the renter's explicit acceptance.
- Both parties sign the handoff offline at the meeting and sync 30 hours later; the reservation is never cancelled automatically, moves to handoff_pending after startsAt plus 24 hours and then to in_use when the attestation pair arrives.
- Item is never returned; rentals.rental.closed with reason not_returned closes the overdue reservation and ends its occupied interval at the closure time.
- Owner blocks the renter after confirmation; lifecycle statements for the reservation are still verified and stored, notifications are suppressed, and no statement ever carries the reason blocked.
- Renter's clock is wrong; interval times are UTC instants chosen in the UI by date pickers, and the owner vault validates them against its own clock for lead time.
- Quantity is 3 and three overlapping rentals exist; a fourth overlapping request is refused, a request overlapping only two is allowed.
- Owner pauses a published offering while one request is open; rentals.offering.withdrawn with reason paused is emitted once, the open request is answered with a signed decline (offering_unavailable), confirmed reservations are unaffected, and pausing a never-published draft emits nothing.

## UX and accessibility

- Offering editor: item details from the listing, hourly rate, daily rate, quantity, minimum and maximum duration, buffer before and after, lead time, blackout dates, cancellation policy (free until N hours before start, fee), declared item value, condition checklist template (up to 30 labels), auto-confirm switch (works only while the owner's app is open), late-fee terms, Pause and Archive actions with a notice that copies other people already fetched cannot be recalled.
- Date picker for renters: shows busy blocks from the owner's latest signed busy summary, with a note that only the owner's confirmation reserves the dates, and a terms summary (rent, late fee, cancellation fee, declared value) that the request signs.
- Owner calendar: month and agenda views of reservations with status chips and conflict warnings; Confirm and Decline buttons with the exact interval; frozen reservations show Renegotiate and Cancel.

**States:** loading; empty; requested; lapsed; declined; confirmed; handoff-pending; in-use; overdue; returned; closed; cancelled; frozen; cancellation-pending-counterparty; pending-offline

**Accessibility:** Date and time inputs are native controls with labels that include the zone name; duration and price are announced as text after each change.; Calendar is a keyboard-navigable grid; each day cell has an accessible name with date and number of reservations.; Confirm, Decline, Cancel and Renegotiate buttons are at least 44x44 px with accessible names including the interval.

## Owned data

- `RentalOffering` (classrup.rentals.offering/v1, P3, RET-STANDARD)
- `RentalReservation` (classrup.rentals.reservation/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `rentals.offering.create`, `rentals.offering.revise`, `rentals.offering.publish`, `rentals.offering.withdraw`, `rentals.availability.publish_busy`, `rentals.reservation.request`, `rentals.reservation.confirm`, `rentals.reservation.cancel`, `rentals.reservation.renegotiate`, `rentals.reservation.receive`
- Queries: `rentals.offering.get`, `rentals.availability.list_busy`, `rentals.reservation.get`, `rentals.reservation.list_mine`
- Emits: `rentals.reservation.requested`, `rentals.reservation.confirmed`, `rentals.reservation.cancelled`, `rentals.offering.published`, `rentals.offering.withdrawn`
- Consumes: `rentals.handoff.attested`, `rentals.rental.overdue`, `rentals.return.attested`, `rentals.rental.closed`, `bazaar.listing.unpublished`, `identity.block.added`, `comms.consent.revoked`, `commerce.deal.cancelled`, `privacy.deletion.completed`

## Dependencies

F01.S01.M01, F01.S01.M03, F09.S01.M01, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F06.S02.M01, F06.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-039-01 | [Domain schema](domain_schema.md) | 3 |
| PS-039-02 | [Validation rules](validation_rules.md) | 4 |
| PS-039-03 | [Workflow state machine](workflow_state_machine.md) | 6 |
| PS-039-04 | [Commands, queries and events](commands_queries_events.md) | 7 |
| PS-039-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-039-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-039-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-039-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-039-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-039-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/rentals/src/rental_catalog/availability/index.ts`.

## Acceptance criteria

- All tests T01–T28 pass in CI.
- No renter is ever shown a confirmed reservation without the owner's verified signed confirmation and consent held in the vault.
- In the owner vault no instant ever exceeds the offering quantity outside detected fork excess, verified against the brute-force model, and a confirmed reservation is never cancelled automatically while a signed handoff report may exist.
