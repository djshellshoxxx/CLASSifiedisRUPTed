# F15.S02.M03 — Storage

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S02](../SPEC.md). **Process IDs:** PS-119-01…PS-119-10. **Code:** `packages/kernel/src/storage`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The kernel storage port used by every module in the vault and on relays (ADR-0016). One unit-of-work API (transaction(fn) committing on ok, rolling back on err or exception) over a single row model with three adapters that pass one contract suite: IndexedDB for the browser vault (one database per vault whose version is bumped only for object-store or index changes), node:sqlite (WAL, BEGIN IMMEDIATE, busy_timeout 5000, and the walAutocheckpoint 0 option that leaves checkpoints to the F15.S03.M02 archiver) for relays, and memory for tests. It provides typed repositories with optimistic concurrency and up to four indexed fields, the local transactional outbox with an at-least-once dispatcher and per-consumer inbox, dead letters with replay counters and the list, requeue and purge primitives behind F15.S03.M03 replay, local leases, content-addressed media blobs with reference counting, tenant upload limits and relay-side verifyImageClean (on a relay the ciphertext of encrypted blobs lives in the separate attached store blobs_enc while blob metadata stays in schema main, so F15.S03.M02 backups of main never hold attachment ciphertext), and forward-only recorded migrations (CTR-SCH-001). It is only the persistence primitive of the vault sync outbox: F15.S01.M01 OutboxEntry rows are ordinary records of type platform.outbox_entry written inside the caller's transaction(fn), and storage has no sync outbox table, state machine or sender of its own (N24).

## Responsibilities

- Persist StoredRecord rows keyed (tenantId, type, id) with revision compare-and-set and index queries with opaque cursors.
- Commit records (including F15.S01.M01 OutboxEntry records of type platform.outbox_entry), outbox events, inbox entries, idempotency records, leases and blob references atomically in one transaction(fn).
- Deliver local outbox events to registered consumers in (aggregate, revision) order with inbox dedupe, full-jitter backoff and dead letters after 8 attempts.
- Provide the dead-letter primitives behind F15.S03.M03 replay - list, requeue with replay_count and last_replayed_at kept across requeue and re-dead-lettering, return of a requeued event to dead when its consumer is disabled or after 7 days without delivery, and purge 30 days after dead_at.
- Store MediaBlob bytes by content address (blob:sha256-<base64url>, at most 5 MiB and at most the tenant limit read through the TenantPort that F15.S04.M03 registers), run verifyImageClean on relay receipt, store exactly the received bytes and delete a blob with its last referencing record.
- Provide local leases (acquire compare-and-set, renew, release, expiry, fencing counter) inside one vault or relay (IDM-3, IDM-8).
- Apply and record forward-only migrations, refuse to start when a recorded kernel migration checksum differs, and bump the IndexedDB version only for object-store or index changes with a pre-upgrade snapshot that N-1 code can restore after a VersionError.
- Offer the SQLite adapter option walAutocheckpoint 0 and the writer connection to the registered F15.S03.M02 checkpointer so that only the backup archiver checkpoints the WAL of the relay's main database.
- Keep, in the relay SQLite adapter, the ciphertext of every encrypted MediaBlob in the separate database attached as schema blobs_enc, with metadata rows and holders in schema main, so that F15.S03.M02 can back up schema main without attachment ciphertext.

## Not responsible for

- The idempotency rules and dispatch pipeline (F15.S02.M02); storage only persists IdempotencyRecord rows.
- Statement signing, verification and peer acknowledgement validation (F11.S01.M02, F16.S02.M03); storage has no sync sender, SyncTransport port or recordPeerAck primitive.
- The vault sync outbox - OutboxEntry records, their single state machine, per-destination delivery, peer acknowledgements, the PWA outbox UI, conflict prompts and persistence requests (F15.S01.M01, N24); storage persists those records like any other.
- Metadata stripping and re-encoding of media and the verifyImageClean implementation (F10.S02.M03) and encryption of private media (F08.S01.M03); storage receives prepared bytes, calls the verifier registered on a relay and never re-encodes or substitutes bytes.
- Relay backups, WAL archiving, checkpoints of schema main and restore drills (F15.S03.M02, F15.S03.M03), which never snapshot, archive or checkpoint blobs_enc; dead-letter replay as an operator command and the 3-replay limit (F15.S03.M03).
- Expiring attachment rows whose ciphertext is absent after a relay restore or crash (F08.S01.M03 reconciliation sweep, using blobs.info bytesPresent).
- Bundle-level checks of the vault restore flow (IOX-2) - manifest signature and section hashes, multi-part set linkage by setId and the part-1 manifest hash, and the F10.S01.M04 privacy.deletion.ledger_check guard - which run before any owning module calls repo.restore; repo.restore is a per-record primitive that knows no bundle, manifest or principal.
- Tenant status, tenant limits and LocalSettings (F15.S04.M03 registers TenantPort with storage at composition; no depends_on edge, because F15.S04.M03 depends on this module).
- The canonical relayId, keyId and destination strings (defined by F15.S02.M01; storage treats them as opaque strings, with no depends_on edge because F15.S02.M01 depends on this module).

## User stories

- As a feature developer, I declare a repository with a zod schema and indexes and get get, put with expectedRevision, remove and paginated index queries that behave the same in the vault, on a relay and in tests.
- As a vault user, my edits are either fully saved with their events and outgoing outbox entries or not saved at all, even if the browser refuses the write.
- As a vault user who removes a listing, its photos are deleted from my device unless another of my records still uses them.
- As a relay operator, a consumer that keeps failing parks its events in dead letters instead of blocking other aggregates, and replayed events keep their replay count when they fail again.
- As a relay operator, my WAL archive has no gaps because storage never checkpoints the relay database while the backup archiver is registered.
- As a vault user who rolls the app back after an update, the older app never opens my vault half-way and offers to restore the copy taken before the update.

## Edge cases

- Two transactions update the same record with the same expectedRevision; the second gets CONFLICT_REVISION with params.currentRevision.
- The IndexedDB write fails (quota exceeded) after the handler succeeded; the working set is restored and the command fails without partial state.
- The SQLite database is locked by another process for longer than busy_timeout; DEPENDENCY_UNAVAILABLE (retryable) is returned.
- A consumer fails on event revision 2 of an aggregate; revision 3 of that aggregate waits while other aggregates continue.
- The same event is delivered twice after a crash between handler commit and acknowledgement; the inbox row makes the second delivery a no-op.
- A requeued dead letter's consumer module is disabled before delivery; the event returns to dead with FEATURE_DISABLED and its replay_count and last_replayed_at are kept instead of pausing like a first delivery.
- Two listings share one photo; deleting the first keeps the blob and deleting the second deletes it.
- A plaintext P2 blob is offered to relay storage; it is rejected because a relay stores only P0 blobs and ciphertext.
- A relay tenant has maxUploadBytes 3 MiB and a 4 MiB P0 photo is put; PAYLOAD_TOO_LARGE is returned although the platform maximum is 5 MiB.
- An old client uploads a photo that still carries GPS tags; the relay verifier reports it as not clean, storage returns PRIVACY_METADATA_GPS_PRESENT, stores nothing and never re-encodes the bytes.
- App release N-1 opens a vault that release N upgraded with a new object store; IndexedDB throws VersionError, storage opens nothing and returns UNSUPPORTED_SCHEMA_VERSION with the pre-upgrade snapshot offered for restore.
- A relay is restored from an F15.S03.M02 backup of schema main, so its encrypted attachment blobs have metadata rows but no ciphertext in blobs_enc; get returns NOT_FOUND and info reports bytesPresent false, and F08.S01.M03 expires those attachment rows.
- A relay SQLite adapter is opened without encryptedBlobsPath or the blobs_enc attach fails; encrypted blob puts are refused with INTERNAL and no ciphertext is ever written into schema main, while P0 puts still work.
- Power is lost while a transaction writes an encrypted blob to both database files, and only blobs_enc keeps the change; the orphan sweep deletes the blobs_enc row that has no main.blobs row.

## UX and accessibility



Headless kernel module. Sync states shown in the PWA come from F15.S01.M01 OutboxEntry records, which storage persists like any other record. The only user-facing storage outcome is the restore offer that N-1 code shows after a VersionError on open (copy taken before the update, newer database left untouched).

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
| PS-119-01 | [Domain schema](domain_schema.md) | 6 |
| PS-119-02 | [Validation rules](validation_rules.md) | 6 |
| PS-119-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-119-04 | [Commands, queries and events](commands_queries_events.md) | 8 |
| PS-119-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-119-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 6 |
| PS-119-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-119-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-119-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-119-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 5 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/kernel/src/storage/index.ts`.

## Acceptance criteria

- All tests T01–T26 pass in CI for memory, SQLite and IndexedDB adapters.
- No failure path leaves records, events, OutboxEntry records, dead letters or blob references inconsistent (T02, T08, T17, T18).
- A poison event never blocks other aggregates, lands in dead letters after 8 attempts and keeps its replay_count across requeue and re-dead-lettering (T04, T05, T10).
- Relays store only clean or encrypted media byte-identical to the signed ref within the tenant limit, and storage never checkpoints schema main while the archiver is registered (T19, T20, T25).
- On a relay no attachment ciphertext exists in schema main, its WAL or a backup copy of it (T23, T24, T26).
