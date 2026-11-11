# F05.S02.M02 — Rental return

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F05.S02](../SPEC.md). **Process IDs:** PS-043-01…PS-043-10. **Code:** `packages/rentals/src/rental_lifecycle/return`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

When the handoff is attested, each vault starts a return record due at the reservation's end. The renter records the return with a condition report (checklist, photos as MediaBlob references, notes) as a signed statement and the owner attests that exact report, contests it, or alone records receipt with a checklist. If no return is recorded after the end plus the grace period, each vault detects overdue and the late fee, computed from the terms the renter signed, starts to accrue; the effective return time is bounded by the earliest verifiable evidence such as a relay-signed transport receipt. Owner silence for 72 hours after the report demonstrably reached the owner's mailbox relay is recorded as such, stops the late fee and never counts as an attestation. The rental closes when the return is attested, the damage claim window plus its delivery tolerance is over or waived, no damage claim is open and the deposit is absent, settled or its owner decision is overdue; an item never returned closes through a not_returned damage resolution or the owner's declaration. Closure offers a completion statement for both parties' signatures. Nothing here proves delivery or condition; it records signed assertions.

## Responsibilities

- Own RentalReturn in both vaults and the statements return_report, return_attestation, owner_receipt (verdict received, not_received or differs), late_fee_adjustment, return_waiver, not_returned_declaration, return_renegotiation and rental_completion (classrup.rentals.*/v1), each registered with its signer role in F11.S01.M01.
- Detect overdue locally at the reservation end plus the grace period (default 60 minutes) and emit rentals.rental.overdue once per vault.
- Compute the late fee as min(cap, ceil(lateMinutes / 60) times ratePerHour) with lateMinutes after grace up to the effective return time, as integer minor units; the owner may lower it until the late-fee Deal {rental_late_fee, returnId} is opened at attestation and only waive it afterwards.
- Close the rental under the closure rule, offer the completion over the deterministic completionCid for co-signature and emit rentals.rental.closed locally with the N3 fields.
- Start the owner-silence clock only once the return report is transport-acknowledged by the owner's mailbox relay, and never turn silence into an attestation.

## Not responsible for

- Handoff report (F05.S02.M01), damage assessment and claims (F05.S02.M03), deposit release or forfeit (F05.S01.M02), reservation calendar (F05.S01.M01).
- Collecting or enforcing the late fee; it is a Deal between the parties, disputes go to F09.S02.M02.
- Legal characterisation of non-return or theft; a not-returned case is a damage claim of kind not_returned and possibly a dispute.
- Future: tracked return shipping and automatic late-fee reminders by push.

## User stories

- As a renter, I record the return with photos, see whether I am late and what late fee would apply before I confirm, and see honestly whether my report has reached the owner.
- As an owner, I attest the return, contest it as not received or different, or record receipt myself, and I can waive or lower the late fee.
- As either party, I see when the rental is closed and why it has not closed yet, and co-sign the completion so reviews can open.

## Edge cases

- Renter returns 30 minutes after the end with a 60 minute grace; lateMinutes is 0, no overdue event, no fee.
- Renter returns 3 h 10 min after the end with grace 60 and rate EUR 5.00 per hour; lateMinutes 130, ceil(130/60) = 3 hours, fee EUR 15.00 unless the cap is lower.
- Renter claims a return time more than 72 hours before the earliest verifiable evidence (the relay-signed transport receipt of the report or the owner's signed receipt); the effective return time is that evidence time, not the claim.
- The return report stays prepared on the renter's device for 4 days; the return stays awaiting_owner labelled 'not yet delivered', no silence clock starts and nothing is attested.
- Owner does not respond for 72 hours after relay receipt of the report; the return becomes renter_reported_unconfirmed labelled 'owner did not respond within 72 h of relay receipt at <relay>', the late fee stops at the effective return time, no rentals.return.attested is emitted and the calendar stays blocked.
- Owner says the item was not received; the owner signs a contest with verdict not_received, the return is contested and the not_returned path stays open.
- Owner stays offline for 5 days and then records receipt; the late fee is bounded by the relay receipt of the renter's report, not raised by the owner's late receipt.
- Owner records receipt although the renter never reported; allowed as owner_only with a required checklist, and the renter can co-sign the completion so a review window can still open.
- Item is never returned; a not_returned damage claim that ends with outcome accepted, counter_accepted, refund_claimed or dispute_unresolved, or the owner's not_returned_declaration 30 days after the due time, closes the rental with reason not_returned and no completion; a claim that ends withdrawn or return_agreed leaves the return open for the actual return or a later declaration.
- Funded deposit is never decided by the owner; once its decision is overdue the rental closes with reason deposit_unsettled so reviews can open while the deposit record stays open.
- Return is reported while a damage claim from the handoff differences is in preparation; the return attests, closure waits for the damage window plus 72 hours.
- Daylight saving change between end and return; durations use elapsed UTC time, so the late fee never gains or loses an hour.
- Reservation end is moved by an agreed extension (future); not supported in MVP, so the due time is always the confirmed endsAt.
- Late-fee adjustment tries to raise the fee; refused with RENTALS_FEE_ADJUST_INVALID because only a decrease or waiver is allowed.

## UX and accessibility

- Return screen (renter): countdown to due time, checklist from the handoff with condition chips, photos, notes, a live late-fee preview, Record return button, and a delivery line (not yet delivered, received by relay <relay> at <time>, owner responded).
- Owner receipt screen: renter's report next to the handoff report with differences highlighted, Attest return, Contest (not received or different), Record receipt, Waive late fee, Waive damage claims.
- Rental status card: due, overdue (with accruing fee), awaiting owner, owner did not respond, contested, attested, completion awaiting co-signature, closed, with the closure checklist (damage window, deposit, open claims).

**States:** loading; due; overdue; awaiting-owner; not-yet-delivered; renter-reported-unconfirmed; contested; attested; completion-pending; frozen; closed; pending-offline

**Accessibility:** Late-fee preview is announced as text whenever the time changes by a full hour, in an aria-live polite region.; Differences between handoff and return are listed as text with condition words, not only colour.; Buttons are at least 44x44 px with accessible names including the action and the reservation dates.

## Owned data

- `RentalReturn` (classrup.rentals.return/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `rentals.return.report`, `rentals.return.attest`, `rentals.return.record_received`, `rentals.return.contest`, `rentals.return.adjust_late_fee`, `rentals.return.waive_damage`, `rentals.return.declare_not_returned`, `rentals.return.sign_completion`, `rentals.return.renegotiate`, `rentals.return.receive`
- Queries: `rentals.return.get`, `rentals.return.get_for_reservation`
- Emits: `rentals.return.attested`, `rentals.rental.overdue`, `rentals.rental.closed`
- Consumes: `rentals.handoff.attested`, `rentals.damage.claimed`, `rentals.damage.resolved`, `rentals.deposit.agreed`, `rentals.deposit.funded`, `rentals.deposit.released`, `commerce.deal.cancelled`, `identity.block.added`, `privacy.deletion.completed`

## Dependencies

F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-043-01 | [Domain schema](domain_schema.md) | 3 |
| PS-043-02 | [Validation rules](validation_rules.md) | 4 |
| PS-043-03 | [Workflow state machine](workflow_state_machine.md) | 7 |
| PS-043-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-043-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-043-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-043-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 6 |
| PS-043-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-043-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-043-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/rentals/src/rental_lifecycle/return/index.ts`.

## Acceptance criteria

- All tests T01–T27 pass in CI.
- The late fee equals the reference model in every case, never exceeds the cap and can only be lowered by the owner.
- A rental closes with a completionCid only when both parties signed it, owner silence never produces an attestation, and an item never returned still reaches closed.
