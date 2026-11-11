# F09.S01.M02 — Cash payments

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S01](../SPEC.md). **Process IDs:** PS-067-01…PS-067-10. **Code:** `packages/commerce/src/payments/cash`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Defines the rules that apply when a Deal obligation is paid in cash: the payee must acknowledge receipt, an optional bilateral receipt can be agreed, and the UI shows safety guidance for in-person cash handover. Cash terms are a small signed agreement between the payee and the payer stored in both vaults; default terms (acknowledgement required, no receipt) are in force from the moment the Deal opens, and a payee proposal replaces them only when the payer signs its acceptance. This module plugs into F09.S01.M01 through the MethodRulePort, which signs the in-force termsCid into every cash claim, and through the StatementHandlerPort, which delivers the counterparty's terms statements. The jurisdiction cash limit is read at evaluation time from governance.jurisdiction_profile.resolve of F18.S01.M01 as effective.cashLimits: Money[] over the vault's selected ProfileRefs, compared in the obligation's own currency with no FX conversion. It never verifies cash; the strongest state a cash claim can reach is acknowledged by the payee, and the platform never touches the money.

## Responsibilities

- Own CashTerms per Deal obligation - acknowledgement requirement (always true), optional bilateral receipt, handover guidance key and an optional public-place hint - with default terms entering as accepted when the Deal opens.
- Implement the cash MethodRulePort - reject cash claims on obligations that do not allow cash or exceed the jurisdiction cash limit, read from governance.jurisdiction_profile.resolve of F18.S01.M01 over the vault's selected ProfileRefs as effective.cashLimits (Money[], the minimum per currency, no FX conversion), and return the termsCid of the in-force terms for F09.S01.M01 to sign into the claim.
- Produce and verify the signed statements classrup.commerce.cash_terms/v1 (payee), classrup.commerce.cash_terms_accept/v1 (payer) and classrup.commerce.cash_terms_decline/v1 (payer), and ingest them through the StatementHandlerPort of F09.S01.M01.
- Show safety guidance (public place, daytime, count together, counterfeit check, no home address) keyed to amount thresholds and never block on guidance alone.
- Own the cash receipt prompt after acknowledgement when the in-force terms require receipts; F09.S02.M01 only signs and verifies the receipts.
- Keep the label honest - claimed (unverified) then acknowledged by payee; never confirmed.

## Not responsible for

- The PaymentClaim state machine, acknowledge and dispute commands (F09.S01.M01).
- Signing and verifying receipts (F09.S02.M01); this module only records that a bilateral receipt is required and prompts the parties.
- Meetup scheduling and safe-spot suggestions (F08.S03); this module links to them by reference.
- Future: cash handover QR attestations and counterfeit-detection partners.

## User stories

- As a seller accepting cash, I require the buyer to sign a receipt, and I see a reminder to count the cash together in a public place.
- As a buyer paying cash for a high-value item, I see safety guidance and can still proceed if I choose.
- As either party, I see that a cash payment is only ever acknowledged by the seller and never shown as verified.
- As a buyer, I can decline terms the seller proposed, and the terms I already agreed to stay in force.

## Edge cases

- Payee proposes new cash terms after the payer already claimed; the existing claim keeps the termsCid it was signed with, the accepted terms stay in force, and the new terms apply only to claims made after the payer accepts them.
- governance.jurisdiction_profile.resolve returns effective.cashLimits [1 000.00 EUR] for the selected ProfileRef and the obligation is 2 500.00 EUR; the cash method is refused for that obligation with COMMERCE_CASH_LIMIT_EXCEEDED naming the supplying ProfileRef and version.
- The payer never answers the terms proposal; after 7 days the proposal expires and the prior accepted terms (the defaults unless the payer accepted others) stay in force.
- The payer declines a proposal; the decline is signed, the proposal ends as declined and the prior accepted terms stay in force.
- Handover hint contains what looks like a street address with a house number; the UI warns and the hint is rejected if it matches a home address pattern the user stored as private.
- Statement terms arrive from a party who is not the payee of the obligation; ingest quarantines it with reason signer_not_payee.
- Terms statements arrive from a party the receiver has blocked; they are dropped silently (N7).
- Offline - terms are proposed locally and wait in the sync outbox; the UI shows prepared, not agreed.
- effective.cashLimits holds only [500.00 USD] and the obligation is 5 000.00 GBP; no limit applies to the GBP obligation, because limits are compared only in the obligation's own currency and are never converted with FX rates.
- Two selected profiles set 1 000.00 EUR and 3 000.00 EUR; resolve returns the minimum 1 000.00 EUR and that limit applies; nothing is selected and resolve falls back to the generic profile without a cash limit, so no limit applies.

## UX and accessibility

- Cash terms sheet: toggle Require signed receipt, public-place hint (≤ 120 chars), safety checklist; button Propose terms; the terms in force are shown above the proposal.
- Payer view: terms summary with Accept or Decline, and the safety guidance panel; 'Your current terms stay in force until you accept'.
- Cash safety card shown before claiming: meet in public, count together, check notes, never share your home address; amounts above the threshold show the stronger variant.

**States:** loading; defaults; proposed; accepted; declined; superseded; expired; pending-offline

**Accessibility:** Toggles have visible labels and state announced politely.; Guidance is plain text in a collapsible region with a 44 px high header button and aria-expanded.; Status is conveyed by text, not color alone.

## Owned data

- `CashTerms` (classrup.commerce.cash_terms/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `commerce.cash_terms.set`, `commerce.cash_terms.accept`, `commerce.cash_terms.decline`
- Queries: `commerce.cash_terms.get`
- Emits: none
- Consumes: `commerce.deal.opened`, `commerce.payment.claimed`, `commerce.payment.acknowledged`, `commerce.payment.expired`, `commerce.deal.cancelled`, `privacy.deletion.completed`

## Dependencies

F09.S01.M01, F09.S02.M01, F09.S03.M03, F18.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-067-01 | [Domain schema](domain_schema.md) | 4 |
| PS-067-02 | [Validation rules](validation_rules.md) | 5 |
| PS-067-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-067-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-067-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-067-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-067-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-067-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-067-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-067-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/payments/cash/index.ts`.

## Acceptance criteria

- All tests T01 to T21 pass in CI.
- A cash claim can reach acknowledged but never confirmed or final, and no UI text implies verification.
- Safety guidance is displayed for every cash claim and never blocks on its own.
- Accepted cash terms are never replaced without the payer's signed acceptance of newer terms.
