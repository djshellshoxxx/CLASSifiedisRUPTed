# F15.S02.M03 — Storage

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S02](../SPEC.md). **Process IDs:** PS-119-01…PS-119-10. **Code:** `packages/kernel/src/storage`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The kernel storage port used by every module in the vault and on relays (ADR-0016). One unit-of-work API (transaction(fn) committing on ok, rolling back on err or exception) over a single row model with three adapters that pass one contract suite: IndexedDB for the browser vault, node:sqlite (WAL, BEGIN IMMEDIATE, busy_timeout 5000) for relays, and memory for tests. It provides typed repositories with optimistic concurrency and up to four indexed fields, the local transactional outbox with an at-least-once dispatcher and per-consumer inbox, dead letters, local leases, the per-destination sync outbox for signed statements (IDM-7), content-addressed media blobs with reference counting, and forward-only recorded migrations (CTR-SCH-001).

## Responsibilities

- Persist StoredRecord rows keyed (tenantId, type, id) with revision compare-and-set and index queries with opaque cursors.
- Commit records, outbox events, inbox entries, idempotency records, leases, sync-outbox entries and blob references atomically.
- Deliver local outbox events to registered consumers in (aggregate, revision) order with inbox dedupe, full-jitter backoff and dead letters after 8 attempts.
- Queue signed statements per destination and track prepared, transport_acknowledged, peer_accepted and failed states.
- Store MediaBlob bytes by content address (blob:sha256-<base64url>, at most 5 MiB) and delete a blob with its last referencing record.
- Provide local leases (acquire compare-and-set, renew, release, expiry, fencing counter) inside one vault or relay (IDM-3, IDM-8).
- Apply and record forward-only migrations and refuse to start when a recorded kernel migration checksum differs.

## Not responsible for

- The idempotency rules and dispatch pipeline (F15.S02.M02); storage only persists IdempotencyRecord rows.
- Statement signing, verification and peer acknowledgement validation (F11.S01.M02, F16.S02.M03); storage records the verified result.
- The PWA outbox UI, conflict prompts and persistence requests (F15.S01.M01).
- Metadata stripping of media (F10.S02.M03) and encryption of private media (F08.S01.M03); storage receives prepared bytes.
- Relay backups and restore drills (F15.S03.M02, F15.S03.M03); dead-letter replay as an operator command (F15.S03.M03).

## User stories

- As a feature developer, I declare a repository with a zod schema and indexes and get get, put with expectedRevision, remove and paginated index queries that behave the same in the vault, on a relay and in tests.
- As a vault user, my edits are either fully saved with their events and outgoing statements or not saved at all, even if the browser refuses the write.
- As a vault user who removes a listing, its photos are deleted from my device unless another of my records still uses them.
- As a relay operator, a consumer that keeps failing parks its events in dead letters instead of blocking other aggregates.

## Edge cases

- Two transactions update the same record with the same expectedRevision; the second gets CONFLICT_REVISION with params.currentRevision.
- The IndexedDB write fails (quota exceeded) after the handler succeeded; the working set is restored and the command fails without partial state.
- The SQLite database is locked by another process for longer than busy_timeout; DEPENDENCY_UNAVAILABLE (retryable) is returned.
- A consumer fails on event revision 2 of an aggregate; revision 3 of that aggregate waits while other aggregates continue.
- The same event is delivered twice after a crash between handler commit and acknowledgement; the inbox row makes the second delivery a no-op.
- A relay is unreachable for a week; prepared statements back off up to 30 s per attempt and fail with EXPIRED after 7 days.
- Two listings share one photo; deleting the first keeps the blob and deleting the second deletes it.
- A plaintext P2 blob is offered to relay storage; it is rejected because a relay stores only P0 blobs and ciphertext.

## UX and accessibility



Headless kernel module. The PWA reads sync-outbox states to show local committed, sent to relay (transport acknowledged) and accepted by peer, never more certainty than the reached state (IDM-7).

## Owned data

- `StoredRecord` (classrup.platform.stored_record/v1, P3, RET-STANDARD)
- `OutboxEvent` (classrup.platform.outbox_event/v1, P2, RET-SHORT)
- `InboxEntry` (classrup.platform.inbox_entry/v1, P1, RET-SHORT)
- `MediaBlob` (classrup.platform.media_blob/v1, P0, RET-STANDARD)

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F15.S03.M01, CTR-ID-001, CTR-SCH-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-FLG-001, CTR-OBS-001, CTR-TST-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-119-01 | [Domain schema](domain_schema.md) | 4 |
| PS-119-02 | [Validation rules](validation_rules.md) | 4 |
| PS-119-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-119-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-119-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-119-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-119-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-119-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-119-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-119-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/kernel/src/storage/index.ts`.

## Acceptance criteria

- All tests T01–T17 pass in CI for memory, SQLite and IndexedDB adapters.
- No failure path leaves records, events, sync entries or blob references inconsistent (T02, T08, T17).
- A poison event never blocks other aggregates and lands in dead letters after 8 attempts (T04, T10).
