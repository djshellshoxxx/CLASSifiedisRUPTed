# F03.S02.M02 — Service milestones

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F03.S02](../SPEC.md). **Process IDs:** PS-031-01…PS-031-10. **Code:** `packages/services/src/service_booking/milestones`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

When a booking is confirmed, each party's vault creates the milestones of the plan the client signed in the accepted quote (identified by quoteCid), with milestoneId = uuid(sha256(bookingId + ':' + seq)) so both vaults agree without the provider assigning ids. The provider submits a milestone with deliverable references and hashes as a signed statement; the client approves the exact submission by signing its cid or requests changes. Approval opens one Deal in F09.S01.M01 per milestone (contextRef {type: service_milestone, id: milestoneId}, contextCid = approvalCid) in the same vault transaction; payment is a claim recorded through F09 (CTR-COM-001), never a platform transfer, and claim events are matched through the milestone's dealId. A milestone is settled only when the payee acknowledged the claim or a chain verifier reports finality; reorgs and failures lower the proof shown. When every non-cancelled milestone is settled, both parties sign a booking completion statement and only then does the booking complete.

## Responsibilities

- Own Milestone records in both participants' vaults, created deterministically from the client-signed quote plan (milestoneId = uuid(sha256(bookingId + ':' + seq)), seq 1 for the implicit milestone).
- Define and verify the statements milestone_submission, milestone_approval, milestone_changes_request and booking_completion (classrup.services.*/v1); approval signs the exact submission cid.
- Open one Deal per approved milestone through commerce.deal.open in the approval transaction, store its dealId, and track claim status from F09 events resolved through dealId, labelling it claimed (unverified), acknowledged, confirming, confirmed, final, reorged or failed exactly as CTR-COM-001 requires.
- Emit services.booking.completed locally only after both parties' signed booking_completion statements are held, when all non-cancelled milestones are settled and at least one was settled.

## Not responsible for

- Quotes, booking creation and cancellation terms (F03.S02.M01).
- Dispute intake, case handling and the resolution mapping (F03.S02.M03 and F09.S02.M02).
- Deal storage, payment claims, acknowledgements, receipts (F09.S01.M01, F09.S02.M01) and chain observation (F09.S01.M03).
- Judging quality of work; a signature evidences the assertion made, not delivery or quality.
- Future: mid-flight milestone amendments by mutual signature, automatic partial-delivery splits and encrypted generic-file deliverables.

## User stories

- As a provider, I submit a milestone with files and a note and see whether the client has received and acted on it.
- As a client, I approve a milestone, then pay the provider directly and record my payment claim, seeing whether the provider has acknowledged it.
- As a client, I request changes up to three times with a reason before approving.
- As a provider, I see which milestones are settled and when the booking is complete, with the proof level shown for each payment.

## Edge cases

- Client approves a submission that was already superseded by a newer submission; the approval signature names the older cid and is refused with SERVICES_SUBMISSION_STALE.
- Client never answers a submission; nothing auto-approves, and after 14 days the provider is offered the dispute path (F03.S02.M03).
- Payment claim is marked claimed but never acknowledged; the milestone stays approved, the claim expires after 14 days (COM-3) and the UI shows expired without completing the booking.
- Crypto payment is claimed but only confirming; the milestone stays approved and shows confirmations N of M until final; a reorg sets proof reorged (shown below confirming) and a failure sets proof failed, and the milestone stays approved in both cases.
- Booking is cancelled while a milestone is submitted; unapproved milestones become cancelled and approved ones keep their Deal and payment obligation.
- Both parties sign contradictory states (provider says submitted, client signs approval for a cid the provider never signed); the approval is quarantined and the milestone is not changed.
- A booking confirmation whose plan differs from the accepted quote (one amount changed) is quarantined upstream by F03.S02.M01 with SERVICES_STATEMENT_INVALID; this module derives milestones only from the client-signed quote plan, never from the confirmation.
- Deliverable file hash does not match the hash in the submission; the client UI marks the file as altered and approval is disabled for that file.
- A deliverable is a 12 MB PDF; it cannot be an F08.S01.M03 attachment (images up to 5 MiB only), so it is recorded as an external hash reference (name, size, SHA-256), exchanged outside ClassRup and checked locally against the signed hash.
- All milestones are settled but the client never signs the completion statement; the booking stays in progress with completion awaiting the client's signature and no review window opens.
- A dispute on an approved milestone resolves with refund_claimed; the milestone returns to approved with its Deal unchanged, and any refund is a new Deal the provider may open, never a change to the existing obligation.

## UX and accessibility

- Milestone list for a booking: title, amount, order or parallel mark, status chip, proof level for payment (claimed (unverified), acknowledged by payee, confirming N/M, confirmed, final, reorged, failed), sync line.
- Submission sheet (provider): note up to 2000 characters, up to 10 deliverables as image attachments up to 5 MiB or external files recorded by name, size and hash, with hashes shown as short fingerprints.
- Review sheet (client): deliverables with integrity check result, Approve button naming the amount, Request changes with required reason, and a Pay directly instructions panel with a record payment claim action.
- Completion sheet: settled milestones with approval and payment proof, and a Sign completion button for each party.

**States:** loading; empty; pending; submitted; changes-requested; approved; payment-claimed; settled; completion-awaiting-signature; cancelled; disputed; pending-offline

**Accessibility:** Status chips are text with an icon, never colour alone, and are announced through an aria-live polite region.; Approve and Request changes are buttons of at least 44x44 px with accessible names that include the milestone title and amount.; Deliverable integrity results are text such as hash matches or hash differs.

## Owned data

- `Milestone` (classrup.services.milestone/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `services.milestone.submit`, `services.milestone.approve`, `services.milestone.request_changes`, `services.completion.sign`, `services.milestone.receive`
- Queries: `services.milestone.list_for_booking`, `services.milestone.get`
- Emits: `services.milestone.submitted`, `services.milestone.approved`, `services.booking.completed`, `services.milestone.changes_requested`, `services.milestone.settled`
- Consumes: `services.booking.confirmed`, `services.booking.cancelled`, `commerce.payment.claimed`, `commerce.payment.acknowledged`, `commerce.payment.confirming`, `commerce.payment.confirmed`, `commerce.payment.finalized`, `commerce.payment.reorged`, `commerce.payment.failed`, `commerce.payment.disputed`, `commerce.payment.expired`, `commerce.deal.cancelled`, `services.dispute.opened`, `commerce.dispute.resolved`, `commerce.dispute.withdrawn`, `privacy.deletion.completed`

## Dependencies

F03.S02.M01, F09.S01.M01, F09.S01.M03, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-031-01 | [Domain schema](domain_schema.md) | 4 |
| PS-031-02 | [Validation rules](validation_rules.md) | 3 |
| PS-031-03 | [Workflow state machine](workflow_state_machine.md) | 6 |
| PS-031-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-031-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-031-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-031-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-031-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-031-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-031-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/services/src/service_booking/milestones/index.ts`.

## Acceptance criteria

- All tests T01–T21 pass in CI.
- A milestone is never shown settled on a claim alone, never shows a stronger proof than the claim reached, and the proof level is always displayed.
- Duplicated, reordered or replayed statements never advance a milestone twice, and a booking completes only with both completion signatures.
