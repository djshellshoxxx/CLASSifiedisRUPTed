# F05.S01.M01 — Rental availability

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F05.S01](../SPEC.md). **Process IDs:** PS-039-01…PS-039-10. **Code:** `packages/rentals/src/rental_catalog/availability`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Owners list rentable items (hourly and/or daily rate, quantity, buffers, lead time, blackout dates, late-fee terms) and keep the reservation calendar in their own vault. A renter sends a signed rental request; the owner's vault checks the requested interval, extended by the buffer before and after, against its own confirmed reservations with a half-open interval test and, if free, the owner signs a confirmation. Overlap prevention exists only inside the owner's vault; the renter's copy is a claim until the owner's signed confirmation is held. The platform holds no funds; the rent is a payment claim between the parties through F09, and deposits are F05.S01.M02.

## Responsibilities

- Own RentalOffering and RentalReservation records in the owner and renter vaults and the statements offering projection, rental_request, rental_confirmation and rental_cancellation (classrup.rentals.*/v1).
- Check overlap in UTC with half-open intervals [start - bufferBefore, end + bufferAfter), capacity quantity (1..20), lead time, horizon of 365 days, maximum duration of 90 days and blackout dates in the offering time zone.
- On confirmation, store the signed confirmation, compute the rent from the chosen unit as integer minor units, and open a local Deal in F09.S01.M01 in the same vault transaction.
- Track reservation status from handoff, return and closure events, shorten the occupied interval on early return and extend it while overdue.

## Not responsible for

- Deposit terms and release or forfeit (F05.S01.M02).
- Condition reports and attestations at pickup and return (F05.S02.M01, F05.S02.M02), damage claims (F05.S02.M03) and disputes (F09.S02.M02).
- Cross-vault locking; two renters can each hold an unconfirmed request, and only the owner's signed confirmation reserves the interval.
- Future: multi-owner pooled inventory, recurring rentals and delivery logistics.

## User stories

- As an owner, I list a tent with a daily rate, a 2 hour buffer after each rental and a late fee, and see my calendar of reservations.
- As a renter, I pick dates, see the exact price and the owner's rules, send a request, and see honestly whether the owner has confirmed.
- As an owner, I confirm a request only if it fits, and the vault stops me from confirming overlapping reservations.
- As either party, I cancel under the stated terms and the interval is freed in the owner's calendar.

## Edge cases

- Two renters request overlapping dates; both requests stay requested, the owner confirms one, and the other cannot be confirmed (RENTALS_INTERVAL_CONFLICT) and is answered with a signed declined cancellation.
- Back-to-back rentals where the next start is inside the previous buffer; refused by the buffer rule, shown to the renter as unavailable at the conflicting time.
- Interval touching exactly at the boundary (end of one equals start of the next with zero buffers) is allowed because intervals are half-open.
- Daylight saving change inside the rental; duration is elapsed time in UTC, a day is 24 elapsed hours, and blackout dates are evaluated by local calendar date in the offering time zone.
- Early return frees the tail of the occupied interval after the return buffer; late return keeps the interval blocked until the return is attested, and a pending next request is flagged.
- Owner confirms on two devices at once; a Web Locks lock serializes tabs, and forked devices that sign overlapping confirmations are detected on merge and both reservations are frozen for explicit renegotiation.
- Request arrives after the owner paused or archived the offering; refused with RENTALS_OFFERING_UNAVAILABLE and a signed declined statement.
- Renter's clock is wrong; interval times are UTC instants chosen in the UI by date pickers, and the owner vault validates them against its own clock for lead time.
- Quantity is 3 and three overlapping rentals exist; a fourth overlapping request is refused, a request overlapping only two is allowed.

## UX and accessibility

- Offering editor: item details from the listing, hourly rate, daily rate, quantity, minimum and maximum duration, buffer before and after, lead time, blackout dates, auto-confirm switch (works only while the owner's app is open), late-fee terms.
- Date picker for renters: shows busy blocks from the owner's latest signed busy summary, with a note that only the owner's confirmation reserves the dates.
- Owner calendar: month and agenda views of reservations with status chips and conflict warnings; Confirm and Decline buttons with the exact interval.

**States:** loading; empty; requested; confirmed; in-use; overdue; returned; closed; cancelled; frozen; pending-offline

**Accessibility:** Date and time inputs are native controls with labels that include the zone name; duration and price are announced as text after each change.; Calendar is a keyboard-navigable grid; each day cell has an accessible name with date and number of reservations.; Confirm, Decline and Cancel buttons are at least 44x44 px with accessible names including the interval.

## Owned data

- `RentalOffering` (classrup.rentals.offering/v1, P0, RET-STANDARD)
- `RentalReservation` (classrup.rentals.reservation/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `rentals.offering.create`, `rentals.offering.revise`, `rentals.offering.publish`, `rentals.availability.publish_busy`, `rentals.reservation.request`, `rentals.reservation.confirm`, `rentals.reservation.cancel`, `rentals.reservation.receive`
- Queries: `rentals.offering.get`, `rentals.availability.list_busy`, `rentals.reservation.list_mine`
- Emits: `rentals.reservation.requested`, `rentals.reservation.confirmed`, `rentals.reservation.cancelled`, `rentals.offering.published`
- Consumes: `rentals.handoff.attested`, `rentals.rental.overdue`, `rentals.return.attested`, `rentals.rental.closed`, `bazaar.listing.unpublished`, `identity.block.added`

## Dependencies

F01.S01.M01, F09.S01.M01, F09.S03.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-039-01 | [Domain schema](domain_schema.md) | 3 |
| PS-039-02 | [Validation rules](validation_rules.md) | 3 |
| PS-039-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-039-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-039-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-039-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-039-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-039-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-039-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-039-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/rentals/src/rental_catalog/availability/index.ts`.

## Acceptance criteria

- All tests T01–T16 pass in CI.
- No renter is ever shown a confirmed reservation without the owner's verified signed confirmation held in the vault.
- In the owner vault no instant ever exceeds the offering quantity, verified against the brute-force model.
