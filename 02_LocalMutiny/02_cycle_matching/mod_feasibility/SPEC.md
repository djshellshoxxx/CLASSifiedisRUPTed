# F02.S02.M05 — Cycle feasibility checks

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S02](../SPEC.md). **Process IDs:** PS-016-01…PS-016-10. **Code:** `packages/mutiny/src/cycle_matching/feasibility`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A pure, deterministic set of checks that tells a vault whether a suggestion, a direct proposal or a cycle revision can be proposed or consented to right now, and explains every failure with a stable check code. Checks cover participant uniqueness, item uniqueness, ownership and availability, value tolerance (MNY-5), quote freshness, distance, blocks, eligibility and deadlines. Each check states its basis, either verified locally, derived from a signed projection or only claimed by a peer, so the UI never presents a peer's claim as verified fact.

## Responsibilities

- Provide checkFeasibility(input, ports) as a pure function and the command that stores a FeasibilityReport for a subject.
- Return overall feasible, feasible_with_conditions or infeasible with ordered check results and machine-readable reason codes.
- Re-run before proposing, before signing consent, and before the local commit verdict, and mark reports older than 10 minutes stale.

## Not responsible for

- Reserving items or signing anything (F02.S03.M02, F02.S03.M01).
- Computing normalized values and pinning quotes (F02.S04.M02) and declared values (F02.S04.M03); this module only consumes them.
- Guaranteeing that a peer's item exists; only the peer's signed reservation statement and the physical exchange evidence speak to that.
- Future: probabilistic dropout risk estimates per participant and travel-time based distance checks.

## User stories

- As a member about to consent, I see a checklist that says which facts my vault verified itself and which are only claimed by the other parties.
- As a proposer, I am told exactly why a cycle cannot be proposed, for example that one item is no longer available or the value gap of one participant exceeds the tolerance.
- As a member, I see the cheapest fix offered by the system, such as adding a compensation leg of a stated amount.

## Edge cases

- Two legs name the same inventory item; the report fails check C02 and names both legs.
- A pinned FX quote expires 20 minutes from now; the check warns because it has less than 30 minutes left, and fails when expired.
- A participant's projection says they accept cycles of at most 3 but the subject has 4 participants; check C10 fails for that participant only.
- Item quantity is 1 and a local reservation for another cycle holds it; the check fails with item_reserved_elsewhere without revealing the other cycle.
- A peer's item cannot be verified because the listing projection is missing locally; basis is unverifiable and the overall result is feasible_with_conditions, never feasible.
- The report was computed 11 minutes ago; consent is refused until a fresh report is stored.

## UX and accessibility

- Feasibility checklist inside the proposal and consent screens: one row per check with pass, warn or fail, a basis chip (verified here, from signed projection, claimed by peer) and a fix suggestion.
- Value gap table: for each participant, gives X, receives Y, gap, tolerance, and result.

**States:** loading; feasible; feasible-with-conditions; infeasible; stale; offline; error

**Accessibility:** Check results use text labels and icons together, never color alone.; The checklist is a list with each row reachable by keyboard and described by its basis chip.; Result changes after refresh are announced through an aria-live polite region.

## Owned data

- `FeasibilityReport` (classrup.mutiny.feasibility_report/v1, P2, RET-SHORT)

## Interfaces

- Commands: `mutiny.feasibility.check`
- Queries: `mutiny.feasibility.get`, `mutiny.feasibility.latest_for_subject`
- Emits: `mutiny.cycle.feasibility_checked`
- Consumes: `mutiny.proposal.revised`, `mutiny.values.normalized`

## Dependencies

F02.S02.M04, F01.S03.M01, F01.S01.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-016-01 | [Domain schema](domain_schema.md) | 3 |
| PS-016-02 | [Validation rules](validation_rules.md) | 3 |
| PS-016-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-016-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-016-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-016-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-016-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-016-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-016-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-016-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/cycle_matching/feasibility/index.ts`.

## Acceptance criteria

- All tests T01–T17 pass in CI.
- No peer claim is ever presented as verified and overall feasible is impossible with any unverifiable or peer_claim basis.
- MNY-5 tolerance is exact at the boundary for bigint amounts.
