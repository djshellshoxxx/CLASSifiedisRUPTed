# F17.S02.M02 — Chaos testing

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S02](../SPEC.md). **Process IDs:** PS-138-01…PS-138-10. **Code:** `tests/chaos`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Fault-injection suites that prove invariants hold under faults of the local-first architecture (ADR-0016): database busy (relay SQLite BUSY and IndexedDB transaction abort), consumer crash on the local outbox, duplicate and reordered statement delivery, clock skew, relay or peer outage, and seeded random-timing reruns of the trust-fault suites owned by F17.S01.M03 (relay_down, fork_conflict, revocation_lag, relay_tamper, signer_role_mismatch, relay_replay, relay_withhold_equivocate) against that module's oracle. Faults are injected through ports and wrappers in test vaults (including the storage/indexeddb adapter) and test relays, never in production paths. Every scenario ends by asserting the invariants: no lost committed command, no duplicate effect, no last-writer-wins on consent, money or inventory, ordering independent of wall time, no expired entity resurrected, local records intact, and every vault reservation store, saga and sync outbox (and on the relay only relay-hosted leases and queues) drained or in a documented state within the scenario's recovery bound.

## Responsibilities

- Provide fault injectors: relay SQLite BUSY, and IndexedDB transaction abort on the Nth write by wrapping the vault storage/indexeddb adapter (F15.S02.M03) in test vaults, consumer crash before and after ack, duplicate and reordered statement delivery, clock skew of plus or minus 5 min and 24 h on one vault clock or on the relay clock, relay or peer outage, and the random fault timing used to rerun the F17.S01.M03 trust-fault suites.
- Define the invariant set checked after every scenario: committed commands appear exactly once, entity revisions strictly increase, idempotent replay returns the stored response, no event is lost, ordering (seq, revision, outbox order) never depends on wall time, an expired entity never comes back, and every vault reservation store, saga and sync outbox plus the relay-hosted leases and queues are drained or in a documented terminal state within the scenario's recovery bound (06.R04).
- Run each scenario with 3 seeds in the PR profile (smoke, 2 min total) and 30 seeds nightly with randomised fault timing.
- Write a chaos report with the seed, fault schedule and violated invariant on failure so it can be replayed.

## Not responsible for

- Throughput targets (F17.S02.M01).
- Offline client behavior (F17.S02.M03).
- The trust-fault scenario definitions and their expected outcomes (F17.S01.M03 owns the single oracle); this module only reruns them with seeded random fault timing.
- Infrastructure-level chaos such as killing real hosts or network partitions between machines.
- Future: staged chaos in a pre-production environment.

## User stories

- As an engineer, I replay a failed chaos run from its seed and fault schedule to debug a lost event.
- As an operator, I trust that a busy database causes retries and not lost commands.
- As a federation maintainer, I see that a peer outage does not block local commands and that deliveries resume afterwards.

## Edge cases

- SQLITE_BUSY persists for longer than the busy timeout of 5 000 ms; the command returns DEPENDENCY_UNAVAILABLE retryable and nothing is half-committed.
- Consumer crashes after applying an effect but before acking; redelivery must not duplicate the effect.
- The same event is delivered twice and out of order; the inbox dedupes by event ID and revision, and statements dedupe by cid.
- The clock moves backwards by 24 h after a reservation expired; ordering by seq, revision and outbox order is unchanged, and the expired reservation stays expired with its expiry event fired exactly once (never resurrected).
- One vault clock runs 24 h ahead; that vault expires its own reservations and cycles by its own clock (wall-clock expiry is the specified behavior of F15.S01.M01, FLOW-06 and N14 absolute expiresAt, and ADR-0016 offers no trusted time), and the other vaults receive a signed withdrawal or expiry statement instead of silently diverging.
- A vault clock is skewed while a relay-hosted auction close lease (IDM-3) runs; the lease follows the relay clock only.
- A federation peer is down for 10 minutes; the F11.S02.M01 PeerOutbox retries in IDM-4 rounds scheduled 1 min and then 15 min after the previous round, and resumes at the next scheduled round or on federation.peer.reinstated with no duplicate imports.
- A vault outbox destination relay is unreachable for 10 minutes; the OutboxEntry moves to failed with failureReason retry_exhausted after 6 IDM-4 attempts and is sent after Retry now; nothing drains automatically.
- A fault is injected while a cycle execution is mid-way; saga compensation completes or the state remains consistent and visible.
- Two forked vaults sign conflicting reservations; each peer detects the conflict, freezes the coordination and requires explicit renegotiation.
- A relay tampers with an envelope in transit; the receiver vault rejects the signature and quarantines the statement.
- A relay goes down mid-flow; the local vault keeps working and the sync state stays prepared until a transport acknowledgement exists.

## UX and accessibility



Headless. Output is reports/chaos.json with scenario, seed, fault schedule, invariant results and Markdown summary.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03, F15.S01.M01, F11.S02.M01, F11.S01.M02, F01.S03.M01, F16.S02.M02, F16.S01.M01

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-138-01 | [Domain schema](domain_schema.md) | 3 |
| PS-138-02 | [Validation rules](validation_rules.md) | 3 |
| PS-138-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-138-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-138-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-138-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 5 |
| PS-138-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-138-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-138-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-138-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `tests/chaos/index.ts`.

## Acceptance criteria

- All five fault types (DB busy, consumer crash, duplicate delivery, clock skew, peer outage) are covered by passing scenarios.
- After each fault the invariant set holds within the scenario recovery bound (60 s for local faults; next scheduled round plus one IDM-4 cycle for peer outage; failed then Retry now for a vault outbox outage).
- Every F17.S01.M03 trust-fault suite passes its oracle under randomised fault timing.
- A planted double-apply bug is caught within the smoke profile.
- A failed run can be replayed exactly from its exported seed and fault schedule.
