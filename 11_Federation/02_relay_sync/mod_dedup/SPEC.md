# F11.S02.M02 — Federated dedup

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S02](../SPEC.md). **Process IDs:** PS-087-01…PS-087-10. **Code:** `packages/federation/src/relay_sync/dedup`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Pure decision library, used by vaults and relays through F11.S01.M02, that implements cid deduplication, chain placement per chain key (author, signer key, stream) and the 24 h gap buffer of CTR-FED-001 FED-3. Chains are a tool for detecting equivocation and ordering delivery, never a gate on acceptance: a receiver with no head anchors at the first verified envelope it sees at any seq, gaps are buffered at most 24 h and then released with a gap flag, and a fork is only a collision of two cids at one (author, signer key, stream, seq) or a prev that contradicts a stored neighbour. Given a verified envelope and the stored view of its chain it returns exactly one decision: duplicate, anchor, next, backfill, buffer, reanchor, fork or held_on_fork. Buffer capacity is capped per author, per source and per tenant with a bounded share for freshly anchored authors. It stores nothing; buffered envelopes are rows of FederatedRecord owned by F11.S01.M02. A hash chain shows that records belong to one signer's sequence, not that the author is honest.

## Responsibilities

- Decide per envelope between duplicate (cid known), anchor (no head for the chain key), next (seq = head+1 and prev = head cid), backfill (a free slot below the head or anchor that agrees with stored neighbours), buffer (anchored chain, gap 1..100), reanchor (gap over 100: accepted with chainGap, missing range fetched), fork (two cids at one seq, or prev contradicting a stored neighbour) and held_on_fork (chains from a candidate of an open conflict).
- Bound the gap buffer: window 24 h, at most 100 missing seq numbers ahead of head, 50 buffered envelopes per author with history and 5 per freshly anchored author, 500 per source (peer relay, device key or mailbox source) and 5000 per tenant or vault, of which freshly anchored authors use at most 1000; evict from the offending source first.
- Compute the drain order when a missing predecessor arrives so buffered envelopes are released in ascending seq with prev verified at each step.
- Report which buffered envelopes have expired and must be released with chainGap after one catch-up fetch, and which seq ranges to fetch; nothing is dropped for a gap.
- Treat predecessors that are older than their type's maxAge, or tombstoned, as continuity stubs (cid, seq, prev only), so record age limits never block a chain.

## Not responsible for

- Persisting envelopes, buffer rows or heads (F11.S01.M02).
- Signature verification and cid computation (F11.S01.M03).
- Quarantine, conflict records, review and freeze after a fork decision (F11.S02.M03).
- Fetching missing envelopes from the relays listed in the author's portable document (F11.S02.M01 pull catch-up).
- Commitment conflicts between different chains or devices of one principal (F11.S01.M02 promise index and F11.S02.M03).

## User stories

- As a user whose relay delivers listing updates out of order, I see them applied in the author's order without manual action.
- As a buyer whose vault has never seen this seller, I receive the seller's statements in our thread and they are accepted even though the seller signed many statements before.
- As a relay operator, I can see that an envelope was held for a missing predecessor and when it will be released.
- As a developer, I can run a property test that any permutation of a valid chain converges to the same accepted order at a fresh receiver.

## Edge cases

- The same envelope arrives from two relays; the second decision is duplicate and nothing changes.
- A fresh vault with no head for (S, k1, thr:A) receives S's envelope at seq 37; the decision is anchor and it is accepted.
- Envelope seq 9 arrives when head is 6 and seq 8 is already buffered; it is buffered, and draining waits for seq 7.
- Gap of 101 or more seq numbers on an anchored chain; the envelope is not buffered, the decision is reanchor with reason FEDERATION_GAP_TOO_LARGE (accepted with chainGap) and the missing range is listed for catch-up.
- A freshly anchored author floods 6 future seq numbers; the 6th is refused with FEDERATION_BUFFER_FULL while authors with history keep their share.
- 200 Sybil authors arriving from one peer fill that peer's 500-row source cap; their oldest rows are evicted first and envelopes from other sources are still buffered.
- Envelope seq 7 with prev pointing to a different cid than the stored seq 6; decision fork prev_mismatch, never accepted silently.
- An open conflict holds two candidates at seq 7; seq 8 chaining from either candidate is held_on_fork without the 24 h release until resolution.
- Clock changes on the device between buffering and sweep; expiry uses the stored bufferedUntil and an injected monotonic-checked clock.

## UX and accessibility



Headless pure library; vault diagnostics show 'waiting for earlier update' for buffered statements using messageKey federation.status.buffered, and 'held: conflicting statements' for held_on_fork using federation.status.held.

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
| PS-087-01 | [Domain schema](domain_schema.md) | 4 |
| PS-087-02 | [Validation rules](validation_rules.md) | 5 |
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

- All tests T01–T16 pass in CI.
- Any arrival order of a valid chain converges to the same accepted set at a fresh receiver, and a stranger's statement at any seq is accepted (property and integration tests).
- No input can make the buffer exceed its per-author, per-source or total caps, and a Sybil flood from one source cannot refuse another source's envelopes.
