# F11.S02.M02 — Federated dedup

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S02](../SPEC.md). **Process IDs:** PS-087-01…PS-087-10. **Code:** `packages/federation/src/relay_sync/dedup`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Pure decision library, used by vaults and relays through F11.S01.M02, that implements cid deduplication, per-author seq/prev chain ordering and the 24 h gap buffer of CTR-FED-001 FED-3. Given a verified envelope and the stored head of its author chain it returns exactly one decision: duplicate, next, buffer, release order, fork or reject. It stores nothing; buffered envelopes are rows of FederatedRecord owned by F11.S01.M02. A hash chain shows that records belong to one author's sequence, not that the author is honest.

## Responsibilities

- Decide per envelope between duplicate (cid already known), next (seq = head+1 and prev = head cid, or seq 1 without prev), buffer (seq > head+1), fork (seq ≤ head with unknown cid, or prev mismatch) and reject (gap too large).
- [object Object]
- Compute the drain order when a missing predecessor arrives so buffered envelopes are released in ascending seq with prev verified at each step.
- Report which buffered envelopes have expired and which seq numbers to fetch from the origin before they are dropped.

## Not responsible for

- Persisting envelopes, buffer rows or heads (F11.S01.M02).
- Signature verification and cid computation (F11.S01.M03).
- Quarantine, origin-wins policy and operator review after a fork decision (F11.S02.M03).
- Fetching missing envelopes from the origin (F11.S02.M01 pull catch-up).
- Future: multi-device authors with per-device sub-chains; MVP assumes one chain per did:key.

## User stories

- As a user whose relay delivers listing updates out of order, I see them applied in the author's order without manual action.
- As a relay operator, I can see that an envelope was held for a missing predecessor and when it will be dropped.
- As a developer, I can run a property test that any permutation of a valid chain converges to the same accepted order.

## Edge cases

- The same envelope arrives from two relays; the second decision is duplicate and nothing changes.
- Envelope seq 9 arrives when head is 6 and seq 8 is already buffered; it is buffered, and draining waits for seq 7.
- Gap of 101 or more seq numbers; rejected with FEDERATION_GAP_TOO_LARGE so one forged high seq cannot pin buffer memory.
- An author floods 51 future seq numbers; the 51st is refused with FEDERATION_BUFFER_FULL.
- Envelope seq 7 with prev pointing to a different cid than the stored seq 6; decision fork, never accepted silently.
- Clock changes on the device between buffering and sweep; expiry uses the stored bufferedUntil and an injected monotonic-checked clock.

## UX and accessibility



Headless pure library; vault diagnostics show 'waiting for earlier update' for buffered statements using messageKey federation.status.buffered.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F11.S01.M03, CTR-FED-001, CTR-ERR-001, CTR-OBS-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-087-01 | [Domain schema](domain_schema.md) | 3 |
| PS-087-02 | [Validation rules](validation_rules.md) | 3 |
| PS-087-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-087-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-087-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-087-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-087-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-087-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-087-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-087-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/relay_sync/dedup/index.ts`.

## Acceptance criteria

- All tests T01–T12 pass in CI.
- Any arrival order of a valid chain converges to the same accepted order (property test).
- No input can make the buffer exceed 50 per author or 5000 total.
