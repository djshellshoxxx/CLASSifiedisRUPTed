# F17.S01.M03 — Integration testing

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S01](../SPEC.md). **Process IDs:** PS-135-01…PS-135-10. **Code:** `tests/integration`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Integration tests simulate several participants: one in-memory vault per participant (storage/memory adapter, local principal with its own Ed25519 key) plus an optional in-process relay (SQLite in-memory) that indexes public projections and forwards end-to-end encrypted envelopes. Under ADR-0016 the 12 reference flows (paid classified listing, ordinary local sale, two-party barter, three-party cycle, four-party cycle, generalized N-party cycle, mixed-value barter compensation, cancellation and dispute, fraud and moderation, private messages, payments with cash and crypto claim including a simulated reorg, federation import and export) run with a relay and, where meaningful, relay-less through direct envelope exchange. Fault cases cover relay down mid-flow, forked vaults with conflicting promises, offline revocation lag and a malicious relay tampering with statements. Fakes replace the chain (FakeChainVerifierPort), clock and push.

## Responsibilities

- Provide a harness that creates N memory vaults (one per participant) and an optional in-process relay with in-memory SQLite plus fake ports and a fixed clock, ready in under 2 s per test file; a DirectTransport lets vaults exchange envelopes with no relay.
- Implement the 12 reference flows as integration suites, each asserting final state, emitted events and audit entries.
- Provide contract tests: every command input and output and every emitted event payload validates against the schema registry (CTR-SCH-001) and every error matches CTR-ERR-001 shapes.
- Provide the FakeChainVerifierPort able to simulate confirmations, a reorg of depth 2 and RPC outage so the crypto claim flow is proven without a chain.
- Run each reference flow in two modes, relay and relay-less (DirectTransport), except flows that need a relay by nature (index discovery, push, auction host) which declare relay-only; assert that every vault reaches the same final state in both modes.
- Provide fault cases: relay down mid-flow, forked vault with conflicting signed promises, offline revocation lag, malicious relay tampering with a statement (signature failure leads to quarantine).

## Not responsible for

- Browser-level flows (F17.S01.M04).
- Throughput and latency (F17.S02.M01) and fault injection (F17.S02.M02).
- The business logic under test; each owning module implements it.
- Future: multi-relay federation topologies of more than 3 relays.

## User stories

- As a developer, I run one command and see the 12 reference flows pass or fail with the event trail of the failing step.
- As a release manager, I can see that each flow passes before release and which requirement IDs they cover.
- As a contract owner, I learn immediately when an event payload drifts from its registered schema.

## Edge cases

- Two flows write to the same tenant concurrently; each test uses its own tenant ID and in-memory database so no cross-talk occurs.
- A command is replayed with the same Idempotency-Key mid-flow; the harness asserts the original response and no duplicate events.
- The fake chain verifier reorgs a confirmed payment claim; the claim returns to pending and the deal does not complete.
- A consumer fails after an event is written; the outbox redelivers and the flow still ends in the expected final state.
- An event type is emitted that is not in the catalog; the contract suite fails with QUALITY_IT_EVENT_UNREGISTERED.
- Clock jumps across an expiry boundary mid-flow; the FakeClock advance triggers the sweeps and the flow ends expired exactly once.
- The relay is stopped mid-flow; local records stay intact, status for undelivered statements stays prepared (delivery unknown), and the flow completes after direct exchange or relay restart.
- Two vaults sign conflicting reservations for the same item after a fork; both receivers detect the fork, freeze the coordination and require renegotiation, with no last-writer-wins.
- A key is revoked while a vault is offline; statements it signs afterwards are accepted until the revocation statement arrives, then quarantined, and the bounded lag window is reported.
- A malicious relay alters one byte of an envelope; the receiver rejects it with signature failure and quarantines it with provenance.

## UX and accessibility



Headless. Output is vitest JUnit and a flow report reports/integration.json listing each flow, steps, events seen and requirement IDs covered.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, F17.S01.M01, F15.S02.M02, F15.S02.M03

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-135-01 | [Domain schema](domain_schema.md) | 3 |
| PS-135-02 | [Validation rules](validation_rules.md) | 4 |
| PS-135-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-135-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-135-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-135-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-135-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-135-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-135-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-135-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `tests/integration/index.ts`.

## Acceptance criteria

- All 12 reference flows pass with outbox drained and zero unexpected events.
- Contract tests validate every registered command, event and error against the schema registry.
- The crypto claim flow demonstrates a simulated reorg returning the claim to pending.
- The full integration suite finishes within 120 s on 2 vCPU.
