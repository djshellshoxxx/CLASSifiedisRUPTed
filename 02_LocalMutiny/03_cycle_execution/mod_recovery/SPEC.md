# F02.S03.M04 — Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S03](../SPEC.md). **Process IDs:** PS-024-01…PS-024-10. **Code:** `packages/mutiny/src/cycle_execution/recovery`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

After a vault considers a cycle committed, every hand-over is evidenced by Ed25519-signed attestations: the giver of a leg attests handed_over, the receiver attests received, and a receiver can report an issue. A cycle is completed in a vault when every leg has a valid receiver attestation and every compensation leg is settled (acknowledged or final, CTR-COM-001). Signatures evidence what the signer asserts, not that goods changed hands. If a participant drops or a deadline passes after any handover started, the cycle moves to partially_executed and a RecoveryCase offers return of items, a compensation leg, waiver or a dispute (F09.S02.M02); every option names the participants whose signatures it needs, each leg's disposition is backed by its own giver's and receiver's signed acceptance or a dispute outcome they acknowledged, and nothing is decided by a relay or rerouted. The completion event carries a completionCid over the receiver attestations so reputation and other consumers can verify completion (N3).

## Responsibilities

- Create, sign, verify and store HandoverAttestation statements with role rules, per-leg uniqueness and claimed-time checks.
- Compute completion locally from receiver attestations and compensation settlement and emit leg.handed_over, leg.received and cycle.completed with contextId, completionCid, parties and legs (N3).
- Open a RecoveryCase on participant drop after handover, execution deadline with partial evidence, issue report or late evidence for a cancelled cycle, and emit cycle.partially_executed.
- Manage recovery options (return item, compensation, waive, dispute) as signed proposals and responses with requiredSignerIds derived per kind, escalate to F09.S02.M02, and record per-leg disposition of reserved items on resolution only when backed by that leg's giver and receiver.
- Emit review-unlock data with the outcome on mutiny.recovery.resolved, including closed_unresolved cases, so reputation can unlock reviews with a dispute flag (FLOW-08).
- Register the module's export section, deletion and retention purge handlers with F10 (N6) and pseudonymize erased participants in retained evidence.

## Not responsible for

- Consent and commit verdict (F02.S03.M01), reservations and inventory conversion (F02.S03.M02) and dropout classification (F02.S03.M03).
- Payment claims and receipts (F09.S01.M01) and dispute adjudication (F09.S02.M02); this module only links to them.
- Guaranteeing delivery or condition of any item; attestations are assertions by their signers.
- Future: photo-hash handover proofs with timestamp anchoring, QR-based in-person co-signing, and insurance integrations.

## User stories

- As a giver, I attest that I handed my item to the next participant, and as a receiver I attest that I received mine; each attestation is signed and sent to the others.
- As a participant in a cycle where someone dropped after the first handover, I see clear recovery options (return the item, compensation, waive, or open a dispute) and agree on one by signing.
- As a participant, I see that the cycle is completed only when all receivers attested and payments for any compensation leg are acknowledged by the payee.

## Edge cases

- The receiver attests received but the giver never attested handed_over; the receipt counts and the leg is received.
- The giver attests handed_over and the receiver reports not_received; an issue is recorded, the cycle moves to partially_executed and both sides are offered recovery options.
- A receiver attests received twice from two devices; the second is a duplicate by (leg, kind) and is skipped.
- An attestation arrives after the cycle was cancelled for lack of evidence; the cycle stays cancelled and a standalone recovery case opens.
- An attestation claims a time 10 minutes in the local future; it is quarantined because claimed times of others are not trusted.
- Evidence photos include GPS metadata; they must be re-encoded and stripped before attaching and are rejected otherwise.
- A compensation payment is acknowledged by the payee after all items were received; completion happens at that moment, not before.
- The recovery case has no activity for 30 days; it closes as unresolved, the UI states that no automatic remedy exists, and reviews are unlocked with a dispute flag.
- In a 6-party cycle Erin proposes that Bob waives the loss on leg L2 between Carol and Dan; the option is not accepted until the party bearing the loss signs, and L2's disposition is recorded only when Carol and Dan both signed acceptance.
- The dispute on an escalated case is withdrawn by its opener; the case returns to open with its options instead of waiting 60 days.

## UX and accessibility

- Hand-over screen per leg: I give / I receive, buttons 'I handed it over' and 'I received it', optional note and up to 3 photos, plain statement of what the signature means.
- Cycle execution timeline: legs with giver and receiver attestation chips, compensation legs with payment claim status labels (claimed unverified, acknowledged by payee), sync state per statement.
- Recovery screen: what happened, what each participant holds, available options with consequences, propose and respond buttons, dispute button, deadline countdown.

**States:** loading; awaiting-handover; giver-attested; received; issue-reported; completed; partially-executed; recovery-open; recovery-escalated; recovery-resolved; unresolved; pending-offline; error

**Accessibility:** Attestation buttons state the item and the person in their accessible names, such as 'I received Lamp from Bob'.; Payment status uses the CTR-COM-001 labels as text, never only color.; Timeline and recovery options are keyboard operable lists with 44 by 44 px actions, and status changes are announced in an aria-live polite region.

## Owned data

- `HandoverAttestation` (classrup.mutiny.handover_attestation/v1, P2, RET-EVIDENCE)
- `RecoveryCase` (classrup.mutiny.recovery_case/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `mutiny.attestation.attest`, `mutiny.attestation.ingest`, `mutiny.recovery.propose_option`, `mutiny.recovery.respond`, `mutiny.recovery.escalate`, `mutiny.recovery.ingest`
- Queries: `mutiny.attestation.list_for_cycle`, `mutiny.recovery.get`, `mutiny.recovery.list_mine`
- Emits: `mutiny.leg.handed_over`, `mutiny.leg.received`, `mutiny.cycle.completed`, `mutiny.cycle.partially_executed`, `mutiny.recovery.opened`, `mutiny.recovery.resolved`
- Consumes: `mutiny.cycle.committed`, `mutiny.cycle.participant_dropped`, `mutiny.cycle.cancelled`, `mutiny.compensation.settled`, `commerce.payment.disputed`, `commerce.dispute.opened`, `commerce.dispute.resolved`, `commerce.dispute.withdrawn`, `privacy.deletion.completed`

## Dependencies

F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F15.S02.M03, F10.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-024-01 | [Domain schema](domain_schema.md) | 5 |
| PS-024-02 | [Validation rules](validation_rules.md) | 3 |
| PS-024-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-024-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-024-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-024-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-024-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-024-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-024-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-024-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/cycle_execution/recovery/index.ts`.

## Acceptance criteria

- All tests T01–T26 pass in CI.
- No cycle is completed without a valid receiver attestation for every leg and settled compensation, and no state ever claims that goods were delivered, only that signers asserted it.
- Dropout after handover always yields partially_executed with a RecoveryCase and never a silent reroute.
