# F05.S02.M03 — Rental damage claims

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F05.S02](../SPEC.md). **Process IDs:** PS-041-01…PS-041-10. **Code:** `packages/rentals/src/rental_lifecycle/damage`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

After a rental the owner can claim damage or non-return as a signed statement that carries a computed comparison of the attested handoff report and the return condition report with its provenance, up to 10 itemized amounts capped by the declared value the renter agreed, evidence references and an absolute response deadline. The renter has until that signed deadline to accept, counter once with an amount, or contest; silence is never acceptance. On contest, a counter the owner rejects or a missed deadline the claim moves towards an F09.S02.M02 dispute that only the designated party opens by explicit action, and the claim records the outcome both parties accepted - a dispute that ends without such an outcome leaves the claim resolved_unsettled with no amount. Money is never held or moved by the platform: an agreed amount is first satisfied from a funded deposit through the bilateral forfeit in F05.S01.M02, and any excess is paid directly under its own Deal. The comparison shows what the two signed reports say, not what happened to the item.

## Responsibilities

- Own DamageClaim in both vaults and the statements damage_claim, damage_response, damage_counter_acceptance, damage_withdrawal, damage_escalation and damage_renegotiation (classrup.rentals.*/v1), each registered with its signer role in F11.S01.M01.
- Compute the comparison between the attested handoff report and the return condition report by checklist item (condition ranking ok < worn < damaged < missing), record its provenance (bilateral, owner_only or renter_only), flag a conflicting renter report, and require at least one worsened or missing item, or kind not_returned.
- Enforce windows from signed times - claim createdAt within 7 days after the signed return attestation time, or for not_returned from 14 days overdue until 30 days after the reservation end, accepted when received within 72 hours; a signed respondBy of createdAt plus 7 days plus 72 hours; one counter; no claim after a verified return waiver.
- Prepare escalation on contest, a rejected counter or a missed deadline as escalation_due with a prefilled draft of the F09 case held in this vault that only the designated party opens, map every F09 resolution explicitly, and emit rentals.damage.resolved when the claim reaches accepted, withdrawn, resolved or resolved_unsettled.

## Not responsible for

- Handoff and return reports (F05.S02.M01, F05.S02.M02), deposit release and forfeit (F05.S01.M02) and the reservation (F05.S01.M01).
- Dispute case handling and outcome statements (F09.S02.M02); this module only maps the recorded outcome.
- Insurance, valuation of used items or depreciation tables; the owner states amounts, the renter answers, a mediator can only advise.
- Future: standard repair price catalogues and third-party assessor attestations.

## User stories

- As an owner, I compare the handoff and return reports, select the worsened items, add photos and amounts, and send a claim.
- As a renter, I see the comparison, its provenance and the evidence, and accept, offer a lower amount, or contest the claim.
- As either party, I see when the claim goes to a dispute, who opens it and which outcome both of us accepted, and how an agreed amount is paid.

## Edge cases

- Owner claims for an item whose condition was already worn in the handoff report; the comparison shows no worsening for it and the item cannot be selected without a note, and a claim with no worsened item is refused with RENTALS_DAMAGE_NO_BASIS.
- The return was recorded owner_only; the basis is marked one-sided on the compare and response screens, and if the renter later files a return report the comparison is recomputed against it and the conflict is flagged.
- Total claimed exceeds the declared value bound in the agreed deposit terms or the signed rental request; refused with RENTALS_DAMAGE_EXCEEDS_VALUE, and a claim stating a different declared value is refused with VALIDATION_FAILED.
- Renter does not answer by respondBy; the claim moves to escalation_due with a prefilled draft case for the owner, no case is opened automatically and the claim is never accepted by silence.
- Renter counters with a lower amount and the owner ignores it until its deadline; the claim moves to escalation_due with a prefilled draft case for the renter.
- A claim signed on day 6.9 after the return attestation is delivered on day 7.5; it is accepted in both vaults because its createdAt is inside the window and it arrived within 72 hours, and the rental does not close before the window plus 72 hours.
- Owner waived damage claims at return and then claims within 7 days; refused with RENTALS_DAMAGE_WINDOW in the owner's vault and again in the renter's vault.
- Owner withdraws after the renter contested; allowed only before the dispute case is opened, otherwise the withdrawal is evidence in the case.
- Item never returned; kind not_returned is allowed from 14 days after the due time and carries the overdue and return history as basis.
- A funded deposit exists; an agreed amount is first prefilled into a deposit forfeit, and only agreedAmount minus the amount retained for this claim becomes a payment Deal, so the same damage is never recovered twice.
- The dispute ends no_fault_close, enforcement_referral or lapsed; the claim becomes resolved_unsettled with no agreed amount and nothing is forfeited.
- Two claims for the same reservation and kind; refused with RENTALS_DAMAGE_DUPLICATE.

## UX and accessibility

- Compare screen: handoff and return checklist side by side with condition words and photo pairs, provenance badge (bilateral, owner only, renter only) and conflict notice, worsened items pre-selected, differences summarized.
- Claim builder: up to 10 items each with description (≤ 300 characters), estimated cost with currency, 1 to 5 evidence references; total and the bound declared value check.
- Renter response screen: claim summary, comparison with provenance, response deadline, Accept, Counter with amount and note, Contest; escalation-due card with the prefilled draft and an Open case button for the designated party only; dispute status once escalated.

**States:** loading; no-basis; composing; claimed; countered; escalation-due; escalated-pending; escalated; frozen; accepted; resolved; resolved-unsettled; withdrawn; window-closed; pending-offline

**Accessibility:** Comparison table has row and column headers and states condition changes in words (changed from ok to damaged).; Amount fields have visible labels including currency and use inputmode=decimal; the total is announced after each change.; Accept, Counter, Contest, Open case and Withdraw buttons are at least 44x44 px with accessible names including the total amount.

## Owned data

- `DamageClaim` (classrup.rentals.damage_claim/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `rentals.damage.claim`, `rentals.damage.respond`, `rentals.damage.accept_counter`, `rentals.damage.withdraw`, `rentals.damage.escalate`, `rentals.damage.renegotiate`, `rentals.damage.receive`
- Queries: `rentals.damage.compare_reports`, `rentals.damage.get`
- Emits: `rentals.damage.claimed`, `rentals.damage.resolved`
- Consumes: `rentals.handoff.attested`, `rentals.return.attested`, `rentals.rental.overdue`, `rentals.rental.closed`, `rentals.deposit.released`, `commerce.dispute.opened`, `commerce.dispute.resolved`, `commerce.dispute.withdrawn`, `commerce.payment.acknowledged`, `commerce.payment.finalized`, `identity.block.added`, `privacy.deletion.completed`

## Dependencies

F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S01.M03, F09.S02.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-041-01 | [Domain schema](domain_schema.md) | 3 |
| PS-041-02 | [Validation rules](validation_rules.md) | 4 |
| PS-041-03 | [Workflow state machine](workflow_state_machine.md) | 6 |
| PS-041-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-041-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-041-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-041-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 6 |
| PS-041-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-041-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-041-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/rentals/src/rental_lifecycle/damage/index.ts`.

## Acceptance criteria

- All tests T01–T26 pass in CI.
- No claim is accepted by silence, no case is opened without the designated party's explicit action, and no amount is shown as paid on a payment claim alone.
- Every claim carries a comparison with provenance the receiver can recompute from the two reports, and no damage is recovered both from the deposit and through a payment Deal.
