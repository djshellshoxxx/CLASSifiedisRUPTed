# F17.S01.M03 — Integration testing

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S01](../SPEC.md). **Process IDs:** PS-135-01…PS-135-10. **Code:** `tests/integration`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Integration tests simulate several participants: one in-memory vault per participant (storage/memory adapter, local principal with its own Ed25519 key) plus an optional in-process relay (SQLite in-memory) that indexes public projections and forwards end-to-end encrypted envelopes. Under ADR-0016 the 12 reference flows (paid classified listing, ordinary local sale, two-party barter, three-party cycle, four-party cycle, generalized N-party cycle, mixed-value barter compensation, cancellation and dispute, fraud and moderation, private messages, payments with cash and crypto claim including a simulated reorg, federation and vault portability) map one to one to FLOW-01..FLOW-12 of planning/FLOWS.md and run with a relay and, unless the flow mode table marks them relay-only, relay-less through direct envelope exchange. This module owns the trust-fault suites and their single oracle (relay_down, fork_conflict, revocation_lag, relay_tamper, signer_role_mismatch, relay_replay, relay_withhold_equivocate) and the statement contract tests; F17.S02.M02 reruns the trust faults with seeded random timing. Fakes replace the chain (FakeChainVerifierPort with the BTC finality policy of 6 confirmations), clock and push. No relay ever receives private user data or a vault export bundle.

## Responsibilities

- Provide a harness that creates N memory vaults (one per participant) and an optional in-process relay with in-memory SQLite plus fake ports and a fixed clock, ready in under 2 s per test file; a DirectTransport lets vaults exchange envelopes with no relay.
- Implement the 12 reference flows as integration suites mapped one to one to FLOW-01..FLOW-12 (04.R04), each asserting final state, emitted events and audit entries.
- Provide contract tests: every command input and output and every emitted event payload validates against the schema registry (CTR-SCH-001), every error matches CTR-ERR-001 shapes, and every signed statement type sent in a flow is registered in the F11.S01.M01 statement registry (N2) with its signer role, its payload validates against its classrup.<slug>.<entity>/vN schema, its cid matches CTR-FED-001 FED-7 and its ext is at most 4 KiB (CTR-SCH-001 SCH-2), with one generated row per registry entry plus a negative case signed by the wrong role.
- Provide the FakeChainVerifierPort, scripted with the BTC finality policy of 6 confirmations (CTR-COM-001 COM-5), able to simulate confirmation progress, a reorg of depth 2 and RPC outage, plus a vault with no verifier configured, so the crypto claim flow is proven without a chain.
- Run each reference flow in two modes, relay and relay-less (DirectTransport), except the steps the flow mode table (04.R04) marks relay-only (FLOW-01 listing_paid, FLOW-09 fraud_moderation and the federation step of FLOW-12); assert that every vault reaches the same final state in both modes.
- Own the trust-fault suites and their oracle (one name and one expected outcome each, 02.R04): relay_down, fork_conflict, revocation_lag, relay_tamper, signer_role_mismatch, relay_replay and relay_withhold_equivocate; F17.S02.M02 imports the same scenario definitions and oracle and reruns them with seeded random fault timing.

## Not responsible for

- Browser-level flows (F17.S01.M04).
- Throughput and latency (F17.S02.M01); infrastructure fault injection (DB busy, consumer crash, duplicate delivery, clock skew, peer outage) and seeded random-timing reruns of this module's trust-fault suites (F17.S02.M02, which reuses this module's oracle instead of defining its own).
- The business logic under test; each owning module implements it.
- Future: multi-relay federation topologies of more than 3 relays.

## User stories

- As a developer, I run one command and see the 12 reference flows pass or fail with the event trail of the failing step.
- As a release manager, I can see that each flow passes before release and which requirement IDs they cover.
- As a contract owner, I learn immediately when an event payload drifts from its registered schema.

## Edge cases

- Two flows write to the same tenant concurrently; each test uses its own tenant ID and in-memory database so no cross-talk occurs.
- A command is replayed with the same Idempotency-Key mid-flow; the harness asserts the original response and no duplicate events.
- The fake chain verifier reorgs a confirmed payment claim at 3 of 6 confirmations; the claim returns to pending_confirmation, the deal does not complete at 5 of 6, and it completes only when both vaults' verifiers report final and the payee-signed classrup.commerce.payment_ack/v1 with verification.source chain arrives.
- A vault has no chain verifier configured; its crypto claim stays claimed (unverified) and is never auto-confirmed.
- A consumer fails after an event is written; the outbox redelivers and the flow still ends in the expected final state.
- An event type is emitted that is not in the catalog; the contract suite fails with QUALITY_IT_EVENT_UNREGISTERED.
- Clock jumps across an expiry boundary mid-flow; the FakeClock advance triggers the sweeps and the flow ends expired exactly once.
- The relay is stopped mid-flow; local records stay intact, status for undelivered statements stays prepared (delivery unknown), and the flow completes after direct exchange or relay restart.
- Two vaults sign conflicting classrup.bazaar.reservation/v1 statements for the same item after a fork (fork_conflict); both receivers detect the fork, freeze the coordination and require renegotiation, with no last-writer-wins.
- A key is revoked while a vault is offline (revocation_lag), judged by the verifier's own receipt time against revocationEffectiveFrom (F16.S02.M02), never by the signer's createdAt: a statement received before the revocation arrives and before effectiveFrom stays valid; one received after the revocation arrives with a backdated createdAt is refused with FEDERATION_SIGNER_ROLE_INVALID and listed in quarantine with reason signer_key_revoked; one received inside [effectiveFrom, arrival] is re-marked signed during claimed compromise and its dependent coordination is frozen; a revocation whose effectiveFrom is more than 30 days back is refused with VALIDATION_FAILED; the lag reported is arrival minus effectiveFrom, at most 30 days.
- A malicious relay alters one byte of an envelope (relay_tamper); the receiver rejects it with FED_SIGNATURE_INVALID and quarantines it with provenance.
- A correctly signed acceptance arrives from a key that is not the listing author (signer_role_mismatch); it is quarantined with its reason and causes no state change.
- A relay re-delivers an old valid envelope, replays it into another context or after its expiresAt (relay_replay); re-delivery has a single effect by cid, the other two are rejected.
- A relay serves divergent index views to two vaults, withholds a seq or drops a tombstone (relay_withhold_equivocate); the vaults detect the gap, release it with chainGap after 24 h and never claim more than the reached state.
- The relay-mode run of the portability step is watched by the in-process relay; it receives no classrup-export/v1 bundle.

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

CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, CTR-PRV-001, CTR-CAP-001, CTR-IOX-001, F17.S01.M01, F15.S02.M02, F15.S02.M03, F15.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F09.S01.M01, F09.S01.M03, F16.S02.M02, F07.S02.M01, F10.S01.M03, F06.S02.M01

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-135-01 | [Domain schema](domain_schema.md) | 3 |
| PS-135-02 | [Validation rules](validation_rules.md) | 6 |
| PS-135-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-135-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
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
- The crypto claim flow demonstrates a simulated reorg returning the claim to pending_confirmation, and the deal completes only after final per both vaults' verifiers and the payee-signed payment_ack.
- Every trust-fault suite passes with its single oracle, every sent statement type passes the registry contract, and no relay ever receives an export bundle or P2+ plaintext.
- The full integration suite finishes within 120 s on 2 vCPU.
