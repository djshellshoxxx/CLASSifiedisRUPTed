# F05.S01.M02 — Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F05.S01](../SPEC.md). **Process IDs:** PS-040-01…PS-040-10. **Code:** `packages/rentals/src/rental_catalog/deposits`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Noncustodial rental deposits (ADR-0012). The owner proposes deposit terms for a reservation as a signed statement; the renter agrees by signing a comms.consent statement over the exact terms cid, with the registered wording that the owner, not the platform, holds the deposit. The deposit itself is paid directly between the parties and recorded only as F09 payment claims under a funding Deal; the platform and relays never hold it, so the only protection is evidence, reputation and disputes. Release and forfeit are bilateral - the owner attests a release payment under its own release Deal that the renter acknowledges, or the owner claims a forfeit that the renter accepts or disputes. Disagreements go to F09.S02.M02 disputes opened only by an explicit party action; a dispute outcome is mapped to the deposit only as the outcome both parties accepted, and silence is never consent.

## Responsibilities

- Own DepositTerms in both vaults and the statements deposit_terms, deposit_withdrawal, deposit_release_attestation, forfeit_claim, forfeit_response, deposit_dispute_notice and deposit_renegotiation (classrup.rentals.*/v1), each registered with its signer role in F11.S01.M01; the renter's agreement is a comms.consent statement with key consent.rentals.deposit.agree.v1.
- Bind the terms to one reservation, one currency and an exact amount no higher than the declared item value bound in the signed rental request, and require agreement on the exact terms cid.
- Open one noncustodial Deal per obligation through commerce.deal.open from the owner vault (opener role owner through this module's ContextTermsPort) - funding {rental_deposit, depositId} from renter to owner with contextCid agreementCid, and release {rental_deposit_release, depositId} from owner to renter with contextCid the release attestation cid - and derive funded and released only from acknowledged or final payment per CTR-COM-001 and forfeited only from the renter's signed acceptance.
- Enforce the decision clock - 7 days after the signed return attestation is the soft clock after which the deposit shows decision overdue and the renter can dispute; the hard forfeit limit is V06; releases are never time-barred; a forfeit claim unanswered by its signed respondBy moves to escalation_due with a prefilled draft of the F09 case, held in this vault, rather than acceptance.

## Not responsible for

- Holding, escrowing or moving money; payment claims, acknowledgements, receipts and chain checks belong to F09.
- Damage assessment and claims against the renter (F05.S02.M03); a forfeit for damage or missing parts must reference a damage claim.
- Reservation calendar and rent (F05.S01.M01) and condition reports (F05.S02.M01, F05.S02.M02).
- Case handling and resolution (F09.S02.M02).
- Future: card pre-authorization holds through a provider adapter, and deposit insurance.

## User stories

- As an owner, I propose a deposit of EUR 100.00 for a reservation and see when the renter agrees and when I have acknowledged receiving it.
- As a renter, I read plainly that the owner will hold the deposit directly, agree to the exact terms, pay and record my payment claim.
- As an owner, I release the deposit in full at any time, or after return claim a forfeit of up to the deposit with evidence.
- As a renter, I accept or dispute a forfeit claim and see the dispute case if I dispute.

## Edge cases

- Renter agrees to terms that were superseded by a newer proposal; the agreement names the old cid and is refused with RENTALS_DEPOSIT_TERMS_STALE.
- Owner withdraws the terms while the renter agrees concurrently; the agreement received after the withdrawal fails with CONFLICT_STATE in both vaults, both end withdrawn, and the renter is never left seeing proposed after the withdrawal is delivered.
- Reservation is cancelled after the deposit was funded; the deposit moves to release_pending with the full amount and no release Deal yet, and the owner attests the full release without any return or window condition.
- Owner never decides after return; after 7 days the renter sees a decision-overdue banner and can dispute, the rental may close with reason deposit_unsettled while the deposit stays open, and nothing is auto-forfeited or auto-released.
- Forfeit amount exceeds the funded amount; refused with RENTALS_FORFEIT_EXCEEDS_DEPOSIT.
- Renter accepts a forfeit that was claimed for less than the deposit; the retained part is fixed and the remainder goes to release_pending, never to forfeited.
- Item is never returned; a forfeit with reason not_returned is allowed without a return attestation once rentals.rental.overdue has been held for 14 days.
- Owner waived damage claims at return; a later forfeit for damage or missing parts is refused with RENTALS_DEPOSIT_WINDOW.
- A dispute ends no_fault_close, enforcement_referral or lapsed; the deposit returns to funded with decision overdue so the owner decides again, and it is never forfeited without the renter's signed acceptance.
- Payment claim for the deposit is claimed but never acknowledged; the deposit stays agreed, the claim expires after 14 days (COM-3) and the handoff UI warns that the deposit is not funded.
- Crypto deposit is confirming only; the deposit stays agreed with confirmations N of M until final.
- Owner and renter sign contradictory statements (two forfeit claims, or a response to an unknown claim cid); the deposit is frozen until a co-signed renegotiation, a dispute or the frozen expiry.
- Owner blocks the renter after funding; the renter's forfeit response and release acknowledgement are still verified and stored, so a block cannot strand the deposit.
- Funding is acknowledged but the owner later claims it never arrived; the owner's own acknowledgement statement is evidence against the claim and the renter can open a dispute.

## UX and accessibility

- Deposit proposal sheet: amount with currency, declared item value from the signed request, payment method (cash, external, crypto), due time, plain-language box stating that the platform does not hold the deposit and the owner will.
- Deposit status card on the reservation: state chip, proof level (claimed (unverified), acknowledged by owner, confirmed N/M, final), decision clock after return, decision-overdue banner.
- Forfeit sheet: amount up to the funded deposit, reason, damage claim picker (required for damage and missing parts), evidence picker, renter response buttons Accept, Accept partly, Dispute; escalation-due card with the prefilled draft case and an Open case button for the designated party only.

**States:** loading; none; proposed; agreed; funded; release-pending; forfeit-claimed; escalation-due; escalated-pending; disputed; frozen; released; forfeited; withdrawn; expired; pending-offline

**Accessibility:** Amount fields have visible labels including currency and use inputmode=decimal; the non-custody notice is body text, not a tooltip.; Status chips are text with an icon and announced in an aria-live polite region on change.; Accept, Dispute, Open case and Release buttons are at least 44x44 px with accessible names that include the amount.

## Owned data

- `DepositTerms` (classrup.rentals.deposit_terms/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `rentals.deposit.propose`, `rentals.deposit.agree`, `rentals.deposit.withdraw`, `rentals.deposit.attest_release`, `rentals.deposit.claim_forfeit`, `rentals.deposit.respond_forfeit`, `rentals.deposit.dispute`, `rentals.deposit.renegotiate`, `rentals.deposit.receive`
- Queries: `rentals.deposit.get`, `rentals.deposit.get_for_reservation`
- Emits: `rentals.deposit.agreed`, `rentals.deposit.released`, `rentals.deposit.forfeit_claimed`, `rentals.deposit.funded`
- Consumes: `commerce.payment.claimed`, `commerce.payment.acknowledged`, `commerce.payment.finalized`, `commerce.payment.expired`, `commerce.deal.cancelled`, `commerce.dispute.opened`, `commerce.dispute.resolved`, `commerce.dispute.withdrawn`, `comms.consent.revoked`, `rentals.reservation.cancelled`, `rentals.return.attested`, `rentals.rental.overdue`, `rentals.damage.claimed`, `rentals.damage.resolved`, `identity.block.added`, `privacy.deletion.completed`

## Dependencies

F05.S01.M01, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-040-01 | [Domain schema](domain_schema.md) | 3 |
| PS-040-02 | [Validation rules](validation_rules.md) | 3 |
| PS-040-03 | [Workflow state machine](workflow_state_machine.md) | 7 |
| PS-040-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-040-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-040-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-040-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-040-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-040-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-040-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/rentals/src/rental_catalog/deposits/index.ts`.

## Acceptance criteria

- All tests T01–T25 pass in CI.
- No state shows a deposit as funded, released or forfeited on a payment claim alone, silence never settles money and no case is ever opened without a party's explicit action.
- No code path in the platform or a relay moves or holds deposit funds.
