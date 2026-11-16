# F02.S03.M02 — Cycle locks

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S03](../SPEC.md). **Process IDs:** PS-023-01…PS-023-10. **Code:** `packages/mutiny/src/cycle_execution/lock`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Each participant reserves only their own items in their own vault, all-or-nothing, through an inventory hold with an absolute expiry, and signs a reservation statement (classrup.mutiny.cycle_lock/v1) that tells the other participants what was reserved and until when. A reservation prevents conflicts only inside the reserving vault; across vaults it is a signed promise whose breach can be detected but not prevented. Other participants' reservation statements are verified and stored with provenance. A subject can be committed by a vault only when every giver's reservation statement is present, valid and unexpired on that vault's clock. Conflicting promises about one item freeze the affected subjects.

## Responsibilities

- Reserve the principal's own items for a subject all-or-nothing through InventoryPort.hold with expiry equal to consentDeadline plus executionWindow (maximum 37 days) and sign the reservation statement.
- Release, convert (after the receiver's signed receipt) or expire reservations and publish a signed release statement on request.
- Verify and store peers' reservation statements, detect conflicting promises for the same item, and emit locked and unlocked events for local consumers.
- Enforce a cap of 5 active own reservation sets per vault and evaluate expiry lazily on vault open and every 60 s while open.

## Not responsible for

- Any claim that an item is physically available or that a peer will honor a reservation; a signed statement is evidence of a promise only.
- Inventory quantities, holds storage and listing availability (F01.S03.M01).
- Deciding the commit verdict (F02.S03.M01) and handling dropouts (F02.S03.M03).
- Future: reservations with partial quantities across several cycles and a deposit-free reputation staking signal.

## User stories

- As a participant, when I consent I know my own item is reserved in my vault and the others are told in a signed statement until what time.
- As a participant, I see for each other giver whether their signed reservation has arrived, is still valid, or has expired.
- As a participant who withdraws, my reservation is released immediately and a signed release is sent.

## Edge cases

- Two cycles proposed to me concurrently name the same item with quantity 1; the first reserve succeeds and the second fails with a conflict without naming the first cycle.
- Reserving three items for one subject fails on the third because it is unavailable; nothing remains reserved.
- The vault is closed past the reservation expiry; on next open the reservation is expired before any other action and the subject is told.
- A peer's reservation statement names an item and another statement from the same peer names the same quantity-1 item for another subject; both are marked conflicted and both subjects are frozen at this vault.
- A reservation statement arrives with expiresAt earlier than consentDeadline plus executionWindow; it is invalid for commit and the UI says the peer's promise is too short.
- The vault clock moves backwards; expiry never un-expires a reservation that was already marked expired.
- The receiver's received attestation arrives after the giver already released after a cancellation; the lock is already terminal and the late attestation is handled by recovery.

## UX and accessibility

- Reservation panel in the proposal and cycle screens: for each giver, item, reserved-until time on the viewer's clock, source (reserved here, signed by them) and validity chip.
- Release confirmation dialog stating that a release notice will be sent but the other participants may have already relied on the reservation.

**States:** loading; none; reserved-here; peer-signed; expired; released; conflicted; error

**Accessibility:** Expiry times are shown as absolute local time and as relative text, both readable by screen readers.; Conflict and expiry notices are announced in an aria-live polite region and use text, not color alone.; Release is a button of at least 44 by 44 px with a distinct accessible name.

## Owned data

- `CycleLock` (classrup.mutiny.cycle_lock/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `mutiny.lock.reserve`, `mutiny.lock.release`, `mutiny.lock.ingest`
- Queries: `mutiny.lock.get_for_subject`, `mutiny.lock.list_active_own`
- Emits: `mutiny.cycle.locked`, `mutiny.cycle.unlocked`, `mutiny.lock.conflict_detected`
- Consumes: `mutiny.cycle.declined`, `mutiny.cycle.cancelled`, `mutiny.cycle.completed`, `mutiny.cycle.partially_executed`, `mutiny.recovery.resolved`, `mutiny.leg.received`, `mutiny.proposal.rejected`, `mutiny.proposal.withdrawn`, `mutiny.proposal.expired`, `mutiny.revision.forked`, `bazaar.inventory.released`

## Dependencies

F01.S03.M01, F01.S01.M01, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-023-01 | [Domain schema](domain_schema.md) | 3 |
| PS-023-02 | [Validation rules](validation_rules.md) | 3 |
| PS-023-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-023-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-023-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-023-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-023-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-023-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-023-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-023-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/cycle_execution/lock/index.ts`.

## Acceptance criteria

- All tests T01–T17 pass in CI.
- A reservation never leaves a partial item set, and no module claims that a peer's reservation prevents that peer from double-promising.
- Expiry is always evaluated on the local clock and terminal lock states never reopen.
