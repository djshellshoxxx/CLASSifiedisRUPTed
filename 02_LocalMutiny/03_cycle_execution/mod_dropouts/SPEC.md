# F02.S03.M03 — Cycle dropouts

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S03](../SPEC.md). **Process IDs:** PS-022-01…PS-022-10. **Code:** `packages/mutiny/src/cycle_execution/dropouts`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Handles every way a participant stops taking part in a cycle: signed withdrawal or decline, missed consent deadline, missed execution deadline, a local block, a lost item or an expired reservation. Before any handover evidence exists the cycle is cancelled and the vault releases its own reservations. After any handover evidence exists the cycle is not cancelled; the dropout is recorded and cycle execution (F02.S03.M04) moves it to partially_executed with recovery options. The module never adds, removes or substitutes a participant, so a cycle is never rerouted; a replacement is only ever a new cycle with new consent from everyone. Each vault decides from the evidence it holds and its own clock; peers learn through signed notices or their own timeouts.

## Responsibilities

- Record each dropout as an append-only DropoutRecord with reason, phase (before commit, committed without handover, after handover), outcome and evidence basis (signed statement or local clock).
- Produce the principal's signed withdrawal statement when the principal leaves, and be the single ingest owner of peers' classrup.mutiny.cycle_withdrawal/v1; declines and revocations are F08 ConsentStatements ingested by F08.S02.M02, and this module reacts to their events for committed cycles.
- Evaluate timeouts and loss signals lazily on vault open and every 60 s while open, cancel cycles with no handover evidence, and leave handover cases to F02.S03.M04.
- Guarantee the no-silent-reroute rule by refusing every operation that would change a cycle's participant set.
- Release the principal's own reservations through the F02.S03.M02 LockPort.releaseForSubject inside the same transaction as every cancellation, and run orphan reconciliation on vault open.
- Register the module's export section, deletion and retention purge handlers with F10 (N6) and pseudonymize erased participants in retained dropout records.

## Not responsible for

- Reservation records and the mechanics of release (F02.S03.M02, called through LockPort.releaseForSubject in the same transaction) and consent before commit (F02.S03.M01).
- Handover attestations and recovery options (F02.S03.M04).
- Global suspension or takedown of an account; none exists (ADR-0016). A relay hosting policy may stop indexing someone, which is not a dropout signal here.
- Future: pre-consented alternates and automatic re-matching after a cancellation; both would still require new explicit consent from every participant.

## User stories

- As a participant who can no longer take part, I withdraw before any handover and my reservation is released, and the others are told by a signed notice.
- As a participant in a cycle whose member went silent, I see the cycle cancelled at the deadline by my own clock with a plain reason, and my item is available again.
- As a participant, I am never silently moved into a different cycle or have someone substituted for the person who left.

## Edge cases

- Two participants withdraw at the same moment; both records are stored and the cycle is cancelled once, with two dropout records.
- A withdrawal statement arrives after the cycle is already cancelled; it is stored as history and changes nothing.
- A giver's handed_over attestation arrives at my vault after my vault cancelled for lack of handover evidence; the cycle stays cancelled and F02.S03.M04 opens a standalone recovery case for the late evidence.
- I block a participant after committing; my vault withdraws on my behalf with coarse reason unavailable, and no statement names the block.
- A participant's reservation expires before the execution deadline because their statement had a short expiry; their reservation is invalid for commit, but if already committed it is recorded as a lock_lost dropout.
- The vault was closed over the consent deadline; on next open the timeout is evaluated before any other action.
- The account holder erased their identity locally; dropout records are pseudonymized but remain as evidence.
- A participant revokes their consent through F08 after my vault committed and before any handover; my vault records a dropout with public reason withdrew, cancels and releases my reservation in the same transaction.
- A relay injects a withdrawal it signed itself, or a cancellation notice for a cycle; nothing is cancelled because only the participant's own signed withdrawal or this vault's clock counts.

## UX and accessibility

- Withdraw confirmation dialog: states the phase ('before any handover: the cycle is cancelled' or 'after a handover started: recovery options will open'), the effect on others and that no one is substituted.
- Cycle timeline showing dropout events with coarse reasons (withdrew, unavailable, timeout) and evidence basis (signed by them, detected here).

**States:** loading; active; withdrawing; cancelled; partially-executed-pending; pending-offline; error

**Accessibility:** The dialog title and phase text are read first by screen readers and the destructive button is named 'Withdraw from this exchange'.; Timeline items include text for reason and evidence basis, not only icons.; Withdraw and Cancel buttons are at least 44 by 44 px with focus visible.

## Owned data

- `DropoutRecord` (classrup.mutiny.dropout_record/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `mutiny.dropout.withdraw`, `mutiny.dropout.ingest`, `mutiny.dropout.evaluate`
- Queries: `mutiny.dropout.list_for_cycle`, `mutiny.dropout.get`
- Emits: `mutiny.cycle.participant_dropped`, `mutiny.cycle.cancelled`
- Consumes: `mutiny.cycle.proposed`, `mutiny.cycle.committed`, `mutiny.cycle.declined`, `comms.consent.received`, `comms.consent.revoked`, `privacy.deletion.completed`, `mutiny.cycle.unlocked`, `mutiny.leg.handed_over`, `mutiny.leg.received`, `identity.block.added`, `bazaar.listing.unpublished`, `bazaar.listing.expired`

## Dependencies

F02.S03.M01, F02.S03.M02, F02.S03.M04, F02.S01.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-022-01 | [Domain schema](domain_schema.md) | 3 |
| PS-022-02 | [Validation rules](validation_rules.md) | 3 |
| PS-022-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-022-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-022-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-022-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-022-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-022-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-022-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-022-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/cycle_execution/dropouts/index.ts`.

## Acceptance criteria

- All tests T01–T21 pass in CI.
- Before any handover evidence a dropout always ends in cancellation with released reservations; after evidence it never cancels and always leads to partially_executed with recovery.
- No code path changes or substitutes cycle participants and no signed statement or event exposes a private reason.
