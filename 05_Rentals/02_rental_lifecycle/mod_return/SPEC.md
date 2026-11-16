# F05.S02.M02 — Rental return

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F05.S02](../SPEC.md). **Process IDs:** PS-043-01…PS-043-10. **Code:** `packages/rentals/src/rental_lifecycle/return`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

When the handoff is attested, each vault starts a return record due at the reservation's end. The renter records the return with a condition report (checklist, photo hashes, notes) as a signed statement and the owner attests that exact report, or the owner alone records receipt. If no return is recorded after the end plus the grace period, each vault detects overdue and the late fee, computed from the offering's terms as a payment claim between the parties, starts to accrue. Silence of the owner for 72 hours after a renter report is recorded as such and does not hold the renter hostage. The rental closes when the return is attested, the damage claim window is over or waived, no damage claim is open and any funded deposit is settled. Nothing here proves delivery or condition; it records signed assertions.

## Responsibilities

- Own RentalReturn in both vaults and the statements return_report, return_attestation, owner_receipt, late_fee_adjustment and return_waiver (classrup.rentals.*/v1).
- Detect overdue locally at the reservation end plus the grace period (default 60 minutes) and emit rentals.rental.overdue once per vault.
- Compute the late fee as min(cap, ceil(lateMinutes / 60) times ratePerHour) with lateMinutes after grace, as integer minor units; the owner may only lower or waive it; register it as a payment context for the renter to claim through F09.
- Close the rental under the closure rule and emit rentals.rental.closed locally.

## Not responsible for

- Handoff report (F05.S02.M01), damage assessment and claims (F05.S02.M03), deposit release or forfeit (F05.S01.M02), reservation calendar (F05.S01.M01).
- Collecting or enforcing the late fee; it is a claim between parties, disputes go to F09.S02.M02.
- Legal characterisation of non-return or theft; a not-returned case is a damage claim of kind not_returned and a dispute.
- Future: tracked return shipping and automatic late-fee reminders by push.

## User stories

- As a renter, I record the return with photos, see whether I am late and what late fee would apply before I confirm.
- As an owner, I attest the return or note differences, and I can waive or lower the late fee.
- As either party, I see when the rental is closed and why it has not closed yet.

## Edge cases

- Renter returns 30 minutes after the end with a 60 minute grace; lateMinutes is 0, no overdue event, no fee.
- Renter returns 3 h 10 min after the end with grace 60 and rate EUR 5.00 per hour; lateMinutes 130, ceil(130/60) = 3 hours, fee EUR 15.00 unless the cap is lower.
- Renter claims a return time before the owner's receipt time by more than 72 hours; the effective return time is the receipt time, not the claim.
- Owner does not respond for 72 hours after the renter's report; the return is attested as renter_only_silent_owner and the UI says the owner did not respond.
- Owner records receipt although the renter never reported; allowed as owner_only attestation, and the renter can add a report afterwards for the record.
- Return is reported while a damage claim from the handoff differences is in preparation; the return attests, closure waits for the damage window.
- Daylight saving change between end and return; durations use elapsed UTC time, so the late fee never gains or loses an hour.
- Reservation end is moved by an agreed extension (future); not supported in MVP, so the due time is always the confirmed endsAt.
- Late-fee adjustment tries to raise the fee; refused with RENTALS_FEE_ADJUST_INVALID because only a decrease or waiver is allowed.

## UX and accessibility

- Return screen (renter): countdown to due time, checklist from the handoff with condition chips, photos, notes, a live late-fee preview, Record return button.
- Owner receipt screen: renter's report next to the handoff report with differences highlighted, Attest return, Note differences, Waive late fee, Waive damage claims.
- Rental status card: due, overdue (with accruing fee), awaiting owner, attested, closed, with the closure checklist (damage window, deposit, open claims).

**States:** loading; due; overdue; awaiting-owner; attested; closed; pending-offline

**Accessibility:** Late-fee preview is announced as text whenever the time changes by a full hour, in an aria-live polite region.; Differences between handoff and return are listed as text with condition words, not only colour.; Buttons are at least 44x44 px with accessible names including the action and the reservation dates.

## Owned data

- `RentalReturn` (classrup.rentals.return/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `rentals.return.report`, `rentals.return.attest`, `rentals.return.record_received`, `rentals.return.adjust_late_fee`, `rentals.return.waive_damage`, `rentals.return.receive`
- Queries: `rentals.return.get`, `rentals.return.get_for_reservation`
- Emits: `rentals.return.attested`, `rentals.rental.overdue`, `rentals.rental.closed`
- Consumes: `rentals.handoff.attested`, `rentals.damage.claimed`, `rentals.damage.resolved`, `rentals.deposit.agreed`, `rentals.deposit.funded`, `rentals.deposit.released`

## Dependencies

F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-043-01 | [Domain schema](domain_schema.md) | 3 |
| PS-043-02 | [Validation rules](validation_rules.md) | 3 |
| PS-043-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-043-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-043-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-043-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-043-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-043-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-043-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-043-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/rentals/src/rental_lifecycle/return/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- The late fee equals the reference model in every case, never exceeds the cap and can only be lowered by the owner.
- A rental closes only when attested, damage window over or waived, no open claim and any funded deposit settled.
