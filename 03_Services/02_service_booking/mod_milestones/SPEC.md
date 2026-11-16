# F03.S02.M02 — Service milestones

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F03.S02](../SPEC.md). **Process IDs:** PS-031-01…PS-031-10. **Code:** `packages/services/src/service_booking/milestones`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

When a booking is confirmed, each party's vault creates the milestones named in the signed booking confirmation. The provider submits a milestone with deliverable references and hashes as a signed statement; the client approves the exact submission by signing its cid or requests changes. Approval makes a payment due between the parties; payment is a claim recorded through F09 (CTR-COM-001), never a platform transfer. A milestone is settled only when the payee acknowledged the claim or a chain verifier reports finality. When every non-cancelled milestone is settled the booking completes.

## Responsibilities

- Own Milestone records in both participants' vaults, created deterministically from the milestone plan (with provider-assigned milestoneIds) in the signed booking confirmation.
- Define and verify the statements milestone_submission, milestone_approval and milestone_changes_request (classrup.services.*/v1); approval signs the exact submission cid.
- Register each approved milestone's payment context with the local Deal (F09.S01.M01) and track claim status from F09 events, labelling it claimed (unverified), acknowledged or final exactly as CTR-COM-001 requires.
- Emit services.booking.completed locally when all non-cancelled milestones are settled and at least one was settled.

## Not responsible for

- Quotes, booking creation and cancellation terms (F03.S02.M01).
- Dispute intake and case handling (F03.S02.M03 and F09.S02.M02).
- Payment claims, acknowledgements, receipts and chain verification (F09).
- Judging quality of work; a signature evidences the assertion made, not delivery or quality.
- Future: mid-flight milestone amendments by mutual signature and automatic partial-delivery splits.

## User stories

- As a provider, I submit a milestone with files and a note and see whether the client has received and acted on it.
- As a client, I approve a milestone, then pay the provider directly and record my payment claim, seeing whether the provider has acknowledged it.
- As a client, I request changes up to three times with a reason before approving.
- As a provider, I see which milestones are settled and when the booking is complete, with the proof level shown for each payment.

## Edge cases

- Client approves a submission that was already superseded by a newer submission; the approval signature names the older cid and is refused with SERVICES_SUBMISSION_STALE.
- Client never answers a submission; nothing auto-approves, and after 14 days the provider is offered the dispute path (F03.S02.M03).
- Payment claim is marked claimed but never acknowledged; the milestone stays approved, the claim expires after 14 days (COM-3) and the UI shows expired without completing the booking.
- Crypto payment is claimed but only confirming; the milestone stays approved and shows confirmations N of M until final.
- Booking is cancelled while a milestone is submitted; unapproved milestones become cancelled and approved ones keep their payment obligation.
- Both parties sign contradictory states (provider says submitted, client signs approval for a cid the provider never signed); the approval is quarantined and the milestone is not changed.
- Total of milestone amounts after rounding differs from the booking total; confirmation is refused upstream, and here a plan whose sum differs is quarantined.
- Deliverable file hash does not match the hash in the submission; the client UI marks the file as altered and approval is disabled for that file.

## UX and accessibility

- Milestone list for a booking: title, amount, status chip, proof level for payment (claimed (unverified), acknowledged by payee, confirmed N/M, final), sync line.
- Submission sheet (provider): note up to 2000 characters, up to 10 deliverables with hashes shown as short fingerprints.
- Review sheet (client): deliverables with integrity check result, Approve button naming the amount, Request changes with required reason, and a Pay directly instructions panel with a record payment claim action.

**States:** loading; empty; pending; submitted; changes-requested; approved; payment-claimed; settled; cancelled; disputed; pending-offline

**Accessibility:** Status chips are text with an icon, never colour alone, and are announced through an aria-live polite region.; Approve and Request changes are buttons of at least 44x44 px with accessible names that include the milestone title and amount.; Deliverable integrity results are text such as hash matches or hash differs.

## Owned data

- `Milestone` (classrup.services.milestone/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `services.milestone.submit`, `services.milestone.approve`, `services.milestone.request_changes`, `services.milestone.receive`
- Queries: `services.milestone.list_for_booking`, `services.milestone.get`
- Emits: `services.milestone.submitted`, `services.milestone.approved`, `services.booking.completed`, `services.milestone.changes_requested`, `services.milestone.settled`
- Consumes: `services.booking.confirmed`, `services.booking.cancelled`, `commerce.payment.claimed`, `commerce.payment.acknowledged`, `commerce.payment.finalized`, `commerce.payment.confirming`, `commerce.payment.disputed`, `commerce.payment.expired`, `services.dispute.opened`, `commerce.dispute.resolved`

## Dependencies

F03.S02.M01, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-031-01 | [Domain schema](domain_schema.md) | 3 |
| PS-031-02 | [Validation rules](validation_rules.md) | 3 |
| PS-031-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-031-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-031-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-031-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-031-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-031-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-031-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-031-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/services/src/service_booking/milestones/index.ts`.

## Acceptance criteria

- All tests T01–T14 pass in CI.
- A milestone is never shown settled on a claim alone and the proof level is always displayed.
- Duplicated, reordered or replayed statements never advance a milestone twice.
