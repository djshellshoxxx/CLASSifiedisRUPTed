# F03.S02.M03 — Service disputes

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F03.S02](../SPEC.md). **Process IDs:** PS-030-01…PS-030-10. **Code:** `packages/services/src/service_booking/disputes`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Either party of a service booking can open a service-specific dispute in their own vault: the module collects the scope (booking, milestone, no-show, payment not received, quality, other), a statement and an automatically assembled evidence pack of the signed statements already held (quote, acceptance, confirmation, cancellation, submissions, approvals, payment claim references). It then asks F09.S02.M02 to create the DisputeCase and sends the counterparty a signed dispute notice. Case handling, evidence review and resolution belong to F09.S02.M02; this module only links the case to the booking and freezes service actions while the case is open. No funds are held by anyone, so a resolution is a signed statement the parties act on.

## Responsibilities

- Own ServiceDisputeLink in both participants' vaults, linking a booking and optional milestone to one DisputeCase.
- Assemble the evidence pack automatically - list of statement cids and attachment references with hashes - and let the opener add up to 5 more references and a statement of up to 2000 characters.
- Enforce eligibility - parties only, booking confirmed or later, within 30 days after the later of booking end, last milestone activity and cancellation, one open dispute per scope, at most 3 per booking.
- Emit services.dispute.opened locally so F03.S02.M01 and F03.S02.M02 freeze approvals and fee claims, and mark the link resolved when F09 reports the resolution.

## Not responsible for

- Case handling, evidence review, arbitration and resolution statements (F09.S02.M02 DisputeCase).
- Payment claims and receipts (F09.S01.M01, F09.S02.M01).
- Account sanctions or takedowns; there is no global enforcement (ADR-0016 section 8), relays may apply their own hosting policy.
- Future: mediator marketplace and automatic evidence scoring.

## User stories

- As a client, I open a dispute for a milestone where the provider delivered nothing, see the evidence assembled for me and know that the case is now with the dispute process.
- As a provider, I receive a dispute notice, see the scope and statement, and add my response through the case.
- As either party, I withdraw my dispute before the case is created if I resolved it directly.

## Edge cases

- Both parties open a dispute for the same milestone at the same moment; the links merge on the booking and scope key and the earlier case cid (lexicographically smaller on tie) is kept, the other opener is pointed to it.
- The dispute window of 30 days has passed; refused with SERVICES_DISPUTE_WINDOW_CLOSED, but the parties may still use F09 directly with a manual case.
- F09.S02.M02 case creation fails or times out after 10 minutes; the link becomes link_failed after 3 retries and the opener is told to retry, nothing is lost.
- The counterparty never acknowledges the notice; the case proceeds with the evidence held and the notice shows transport_acknowledged at most.
- Evidence pack contains an attachment that is no longer in the vault; the pack lists it as missing with its recorded hash.
- Opener's device clock is wrong; windows are evaluated on the local clock plus the signed statement times as claims, and a skew over 24 hours shows a warning.
- Booking is cancelled in the middle of a dispute; the link stays linked and cancellation fee claims remain frozen until resolution.
- Counterparty is blocked locally; the dispute can still be opened (a block does not remove the right to dispute) and the notice goes to the mailbox without a notification sound.

## UX and accessibility

- Open dispute sheet: scope choice, statement field (up to 2000 characters), evidence checklist pre-filled from signed statements, plain-language note that no funds are held and the outcome is a statement the parties act on.
- Dispute status card on the booking: link state (pending, linked, resolved, withdrawn), case reference, sync line, resolution outcome in words.
- Notice view for the counterparty: scope, opener statement, evidence list with hashes, Respond in case button.

**States:** loading; eligible; ineligible; pending-link; linked; resolved; withdrawn; link-failed; pending-offline

**Accessibility:** Scope choice is a radio group with visible labels and descriptions.; Evidence checklist items are checkboxes with accessible names including type and date.; Link state changes are announced through an aria-live polite region.

## Owned data

- `ServiceDisputeLink` (classrup.services.dispute_link/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `services.dispute.open`, `services.dispute.withdraw`, `services.dispute.receive`
- Queries: `services.dispute.get`, `services.dispute.preview_evidence`
- Emits: `services.dispute.opened`
- Consumes: `commerce.dispute.opened`, `commerce.dispute.resolved`

## Dependencies

F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-030-01 | [Domain schema](domain_schema.md) | 3 |
| PS-030-02 | [Validation rules](validation_rules.md) | 3 |
| PS-030-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-030-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-030-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-030-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-030-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-030-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-030-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-030-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/services/src/service_booking/disputes/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No dispute outcome is ever decided by this module; only F09 resolution events change a link to resolved.
- Every opened dispute freezes approvals and fee claims exactly once and produces exactly one case.
