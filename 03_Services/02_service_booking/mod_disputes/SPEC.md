# F03.S02.M03 — Service disputes

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F03.S02](../SPEC.md). **Process IDs:** PS-030-01…PS-030-10. **Code:** `packages/services/src/service_booking/disputes`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Either party of a service booking can open a service-specific dispute in their own vault: the module collects the scope (not delivered, quality, scope change, payment not received, no-show, cancellation fee, other), the milestone it concerns when the scope needs one, a statement and an automatically assembled evidence pack of the signed statements already held (quote, acceptance, confirmation, cancellation, submissions, approvals, payment claim references). In the same vault transaction it opens the single DisputeCase through the F09.S02.M02 port (contextRef {type: booking, id: bookingId}, the service scope, and the link id as idempotency reference) and sends the counterparty a signed dispute notice. The receiving vault re-checks the notice against its own records and links it only when the matching case statement arrives. Case handling, evidence review and resolution belong to F09.S02.M02; this module links the case to the booking, owns the mapping from F09 resolutions to service effects and lets F03.S02.M01 and F03.S02.M02 freeze service actions while the case is open. No funds are held by anyone, so a resolution is a signed statement the parties act on and no effect is executed automatically.

## Responsibilities

- Own ServiceDisputeLink in both participants' vaults, linking a booking and optional milestone to exactly one DisputeCase and storing the pre-dispute booking and milestone status.
- Assemble the evidence pack automatically - list of statement cids and attachment references with hashes - and let the opener add up to 5 more references and a statement of up to 2000 characters.
- Enforce eligibility - parties only, booking and milestone states allowed for the scope, within 30 days after the later of booking end, last milestone activity and cancellation, one open dispute per booking (matching the F09 one-case-per-context-and-opener rule), one per scope key and at most 3 per booking - in the opener's vault and again in the receiving vault.
- Emit services.dispute.opened locally once the link has a verified case so F03.S02.M01 and F03.S02.M02 freeze approvals and fee claims, and emit services.dispute.closed on every terminal transition.
- Own the resolution mapping from F09 resolutions, outcome types and withdrawals to service effects; every effect restores the pre-dispute state and none changes an obligation.

## Not responsible for

- Case handling, evidence review, arbitration and resolution statements (F09.S02.M02 DisputeCase).
- Payment claims and receipts (F09.S01.M01, F09.S02.M01).
- Executing any outcome - refunds are new Deals opened by the paying party (F09.S01.M01), cancellations are mutually signed statements (F03.S02.M01).
- Account sanctions or takedowns; there is no global enforcement (ADR-0016 section 8), relays may apply their own hosting policy.
- Future: mediator marketplace and automatic evidence scoring.

## User stories

- As a client, I open a dispute for a milestone where the provider delivered nothing, see the evidence assembled for me and know that the case is now with the dispute process.
- As a provider, I receive a dispute notice, see the scope and statement, and add my response through the case.
- As either party, I withdraw my dispute if I resolved it directly, and both vaults lift the freeze.

## Edge cases

- Both parties open a dispute for the same booking at the same moment; each vault keeps the link whose noticeCid is lexicographically smaller (no time component), the other link becomes withdrawn with reason merged and its opener withdraws the second case with commerce.dispute.withdraw, so exactly one non-withdrawn case remains.
- The dispute window of 30 days has passed; refused with SERVICES_DISPUTE_WINDOW_CLOSED, but the parties may still use F09 directly with a manual case.
- F09.S02.M02 case creation fails in the opener vault; the link stays pending_link, retries at 10 s, 60 s and 10 minutes with the link id as idempotency reference, and becomes link_failed after 3 failures; a link_failed link never blocks opening again.
- The counterparty vault holds a valid notice but no matching case statement arrives within 7 days; its pending link becomes link_failed and nothing was frozen there.
- Evidence pack contains an attachment that is no longer in the vault; the pack lists it as missing with its recorded hash.
- Opener's device clock is wrong; windows are evaluated on the local clock plus the signed statement times as claims, the receiving vault re-checks the window on its own clock with 24 h tolerance, and a skew over 24 hours shows a warning.
- Booking is cancelled by mutual consent in the middle of a dispute; the link stays linked, the booking keeps the dispute overlay and cancellation fee claims remain frozen until the case closes.
- Counterparty is blocked locally; the dispute can still be opened (a block does not remove the right to dispute, recorded as an exception to N7), and an inbound notice from a blocked DID who is a party to an existing booking is quarantined for review without notification instead of being dropped.
- A notice arrives 60 days after the booking ended, exceeds the per-booking limit or duplicates an existing scope; the receiving vault quarantines it, creates no link and emits nothing.
- A payment_not_received dispute is opened on a cancelled booking that has an approved, unsettled milestone; it is allowed, the booking keeps its cancelled status with only an overlay and the milestone is frozen as disputed.
- The case is withdrawn in F09 by its opener or lapses after 30 days of inactivity; the link moves to withdrawn or resolved and both vaults restore the pre-dispute state.

## UX and accessibility

- Open dispute sheet: scope choice, milestone picker shown only for scopes that need one, statement field (up to 2000 characters), evidence checklist pre-filled from signed statements, plain-language note that no funds are held and the outcome is a statement the parties act on.
- Dispute status card on the booking: link state (pending, linked, resolved, withdrawn, link failed), case reference, sync line, resolution in words and what each party may now sign (for example a mutual cancellation after return agreed).
- Notice view for the counterparty: scope, opener statement, evidence list with hashes, Respond in case button.

**States:** loading; eligible; ineligible; pending-link; linked; resolved; withdrawn; link-failed; quarantined; pending-offline

**Accessibility:** Scope choice is a radio group with visible labels and descriptions.; Evidence checklist items are checkboxes with accessible names including type and date.; Link state changes are announced through an aria-live polite region.

## Owned data

- `ServiceDisputeLink` (classrup.services.dispute_link/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `services.dispute.open`, `services.dispute.withdraw`, `services.dispute.receive`
- Queries: `services.dispute.get`, `services.dispute.preview_evidence`
- Emits: `services.dispute.opened`, `services.dispute.closed`
- Consumes: `commerce.dispute.opened`, `commerce.dispute.resolved`, `commerce.dispute.withdrawn`, `privacy.deletion.completed`

## Dependencies

F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-030-01 | [Domain schema](domain_schema.md) | 3 |
| PS-030-02 | [Validation rules](validation_rules.md) | 3 |
| PS-030-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-030-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-030-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-030-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-030-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-030-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-030-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-030-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/services/src/service_booking/disputes/index.ts`.

## Acceptance criteria

- All tests T01–T22 pass in CI.
- No dispute outcome is ever decided by this module; only F09 resolution and withdrawal events close a linked link, and no effect changes an obligation.
- Every opened dispute freezes approvals and fee claims exactly once, produces exactly one non-withdrawn case and is unfrozen exactly once when the case closes.
