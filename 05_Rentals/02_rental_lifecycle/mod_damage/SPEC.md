# F05.S02.M03 — Rental damage claims

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F05.S02](../SPEC.md). **Process IDs:** PS-041-01…PS-041-10. **Code:** `packages/rentals/src/rental_lifecycle/damage`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

After a rental the owner can claim damage or non-return as a signed statement that carries a computed comparison of the attested handoff report and the return report, up to 10 itemized amounts and evidence references. The renter has 7 days to accept, counter once with an amount, or contest; silence is never acceptance - after 7 days or on contest the claim escalates to a dispute in F09.S02.M02, whose resolution statement settles it. Money is never held or moved by the platform: an accepted amount is satisfied from a funded deposit through the bilateral forfeit in F05.S01.M02, or paid directly through a payment claim. The comparison shows what the two signed reports say, not what happened to the item.

## Responsibilities

- Own DamageClaim in both vaults and the statements damage_claim, damage_response, damage_counter_acceptance and damage_withdrawal (classrup.rentals.*/v1).
- Compute the comparison between the attested handoff report and the return report by checklist item (condition ranking ok < worn < damaged < missing) and require at least one worsened or missing item, or kind not_returned.
- Enforce windows - claim within 7 days after return attestation, or for not_returned from 14 days overdue until 30 days after the reservation end; response within 7 days; one counter.
- Escalate to a dispute through F09.S02.M02 on contest, on a rejected counter, or on 7 days of silence, and emit rentals.damage.resolved when the claim reaches accepted, withdrawn or resolved.

## Not responsible for

- Handoff and return reports (F05.S02.M01, F05.S02.M02), deposit release and forfeit (F05.S01.M02) and the reservation (F05.S01.M01).
- Dispute case handling and resolution statements (F09.S02.M02).
- Insurance, valuation of used items or depreciation tables; the owner states amounts, the renter answers, a dispute decides.
- Future: standard repair price catalogues and third-party assessor attestations.

## User stories

- As an owner, I compare the handoff and return reports, select the worsened items, add photos and amounts, and send a claim.
- As a renter, I see the comparison and evidence, and accept, offer a lower amount, or contest the claim.
- As either party, I see when the claim goes to a dispute and how it was resolved, and how an accepted amount is paid.

## Edge cases

- Owner claims for an item whose condition was already worn in the handoff report; the comparison shows no worsening for it and the item cannot be selected without a note, and a claim with no worsened item is refused with RENTALS_DAMAGE_NO_BASIS.
- Return report was attested with renter_only_silent_owner; the owner still has the 7 day window from the attestation time.
- Total claimed exceeds the owner's declared item value; refused with RENTALS_DAMAGE_EXCEEDS_VALUE.
- Renter does not answer within 7 days; the claim escalates to a dispute and the renter is notified; the claim is never accepted by silence.
- Renter counters with a lower amount and the owner ignores it for 7 days; the claim escalates to a dispute with both amounts shown.
- Owner withdraws after the renter contested; allowed only before the dispute case is created, otherwise the withdrawal is evidence in the case.
- Item never returned; kind not_returned is allowed from 14 days after the due time and carries the overdue and return history as basis.
- A funded deposit exists; an accepted amount at or below the deposit is settled through the forfeit flow, and any excess is a payment claim between the parties.
- Two claims for the same reservation and kind; refused with RENTALS_DAMAGE_DUPLICATE.

## UX and accessibility

- Compare screen: handoff and return checklist side by side with condition words and photo pairs, worsened items pre-selected, differences summarized.
- Claim builder: up to 10 items each with description (≤ 300 characters), estimated cost with currency, 1 to 5 evidence references; total and declared value check.
- Renter response screen: claim summary, comparison, Accept, Counter with amount and note, Contest; dispute status once escalated.

**States:** loading; no-basis; composing; claimed; countered; accepted; escalated; resolved; withdrawn; window-closed; pending-offline

**Accessibility:** Comparison table has row and column headers and states condition changes in words (changed from ok to damaged).; Amount fields have visible labels including currency and use inputmode=decimal; the total is announced after each change.; Accept, Counter, Contest and Withdraw buttons are at least 44x44 px with accessible names including the total amount.

## Owned data

- `DamageClaim` (classrup.rentals.damage_claim/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `rentals.damage.claim`, `rentals.damage.respond`, `rentals.damage.accept_counter`, `rentals.damage.withdraw`, `rentals.damage.escalate`, `rentals.damage.receive`
- Queries: `rentals.damage.compare_reports`, `rentals.damage.get`
- Emits: `rentals.damage.claimed`, `rentals.damage.resolved`
- Consumes: `rentals.handoff.attested`, `rentals.return.attested`, `rentals.rental.overdue`, `rentals.rental.closed`, `commerce.dispute.opened`, `commerce.dispute.resolved`, `commerce.payment.acknowledged`, `commerce.payment.finalized`

## Dependencies

F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S02.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-041-01 | [Domain schema](domain_schema.md) | 3 |
| PS-041-02 | [Validation rules](validation_rules.md) | 3 |
| PS-041-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-041-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-041-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-041-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-041-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-041-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-041-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-041-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/rentals/src/rental_lifecycle/damage/index.ts`.

## Acceptance criteria

- All tests T01–T16 pass in CI.
- No claim is accepted by silence and no amount is shown as paid on a payment claim alone.
- Every claim carries a comparison the receiver can recompute from the two attested reports.
