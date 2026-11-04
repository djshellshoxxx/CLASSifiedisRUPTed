# PS-119-09 — Contract and acceptance tests: Storage

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M03 Storage](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/storage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-119-09.R01** One storage contract suite runs unchanged against the memory, SQLite and IndexedDB (fake-indexeddb) adapters.
- **PS-119-09.R02** Outbox ordering, inbox dedupe, backoff, dead letters and lease expiry are covered by deterministic tests with an injected clock and random source.
- **PS-119-09.R03** Every requirement of PS-119 is covered by a test whose title starts with its TEST-PS-119-09 identifier.

## Specification

See the module test table below (all processes).

**Fixtures:** storageContractSuite(adapter, factory) in packages/kernel/src/storage/contract-suite.ts; fake clock 2026-11-04T10:00:00.000Z; seeded IDs; sample module F99.S01.M01; fake-indexeddb 6.2.6 IDBFactory per test.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-119-09.T01 | contract | PS-119-01.R01, PS-119-01.R03, PS-119-02.R01, PS-119-02.R02, PS-119-04.R02, PS-119-09.R01 | create, duplicate create, stale update, remove, equality, range, ordered and cursor queries on memory, SQLite and IndexedDB | identical results; CONFLICT_REVISION with currentRevision; NOT_FOUND; VALIDATION_FAILED for bad cursor or limit |
| TEST-PS-119-09.T02 | contract | PS-119-04.R01 | err and exception after writing records, outbox, idempotency, lease and sync rows, then a commit | nothing persists after err or exception; everything persists after ok |
| TEST-PS-119-09.T03 | contract | PS-119-02.R03, PS-119-03.R03, PS-119-05.R03 | acquire, competing acquire, non-holder release, renew, expiry, late renew, re-acquire | PRECONDITION_FAILED, EXPIRED, fence 1 then 2 then 3 |
| TEST-PS-119-09.T04 | integration | PS-119-01.R02, PS-119-03.R01, PS-119-04.R03, PS-119-06.R03, PS-119-09.R02 | two aggregates with a failing first delivery, duplicate delivery, eight failures, requeue; pending query semantics per adapter | per-aggregate order kept; duplicate skipped; dead letter at attempt 8; requeued events delivered |
| TEST-PS-119-09.T05 | contract | PS-119-03.R02, PS-119-04.R04 | FIFO heads per destination, retry_later, transport ack, undeclared transition, peer ack twice, sender with fatal, retryable and 7-day failures | declared states only; CONFLICT_STATE; idempotent ack; failed with VALIDATION_FAILED and EXPIRED |
| TEST-PS-119-09.T06 | unit | PS-119-05.R01, PS-119-05.R02 | tenant B reads, queries, updates and leases tenant A's rows | nothing visible; NOT_FOUND on update; independent leases and records |
| TEST-PS-119-09.T07 | integration | PS-119-06.R01 | pragmas on a file database; another connection holds BEGIN IMMEDIATE | journal_mode wal, busy_timeout 5000 by default; DEPENDENCY_UNAVAILABLE through storage and bus |
| TEST-PS-119-09.T08 | integration | PS-119-06.R02 | reopen an IndexedDB vault; inject a QuotaExceededError on commit | data and outbox sequence survive reopen; failed commit leaves no trace; next commit persists |
| TEST-PS-119-09.T09 | contract | PS-119-07.R02 | idempotency rows before, at and after expiry and an outbox row older than 7 days | expired and old rows purged; current rows kept |
| TEST-PS-119-09.T10 | integration | PS-119-07.R01, PS-119-07.R03, PS-119-08.R03 | consumer fails 8 times for an event with a private name | inbox dead with code only; one warn log with consumer, type and code; no payload text in outbox logs |
| TEST-PS-119-09.T11 | unit | PS-119-08.R01 | delivery failure then success with the clock advanced 5 s | classrup_outbox_lag_ms 5000 then 0; deliveries counted by outcome |
| TEST-PS-119-09.T12 | load | PS-119-08.R02 | 5 000 records, 200 get+put transactions and 100 index queries on SQLite WAL | p95 ≤ 5 ms and ≤ 20 ms |
| TEST-PS-119-09.T13 | integration | PS-119-10.R01 | export 120 records from memory by cursor scan and restore into SQLite, then restore identical and forged copies | identical export; identical restore skipped; forged copy CONFLICT_REVISION |
| TEST-PS-119-09.T14 | integration | PS-119-10.R02, PS-119-10.R03 | reopen a database, run data migrations twice and a failing one, then tamper with a kernel checksum | kernel migrations recorded once; data migrations once; failing one not recorded; PLATFORM_STORE_MIGRATION_DRIFT on open |
| TEST-PS-119-09.T15 | unit | PS-119-09.R03 | traceability scan of kernel test titles | every PS-119 test ID T01–T17 appears in a test title |
| TEST-PS-119-09.T16 | unit | PS-119-03.R01, PS-119-03.R02 | compare inboxMachine and syncMachine with this file's InboxEntry and SyncOutboxEntry machines | identical initial, terminal and transition rows |
| TEST-PS-119-09.T17 | contract | PS-119-01.R04, PS-119-02.R04, PS-119-04.R05, PS-119-05.R02, PS-119-07.R04 | put, dedupe, oversize, bad type, plaintext P2 on relay, shared photos across two listings, rollback, last removal, encrypted detach, orphan sweep, privacy lowering on each adapter | content address format; refcounts 2 then 1; blob deleted with last holder; shred true; relay rejects plaintext P2 |

## Acceptance criteria

- All tests T01–T17 pass in CI for memory, SQLite and IndexedDB adapters.
- No failure path leaves records, events, sync entries or blob references inconsistent (T02, T08, T17).
- A poison event never blocks other aggregates and lands in dead letters after 8 attempts (T04, T10).

## Dependencies

Module depends on: F15.S03.M01, CTR-ID-001, CTR-SCH-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-FLG-001, CTR-OBS-001, CTR-TST-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
