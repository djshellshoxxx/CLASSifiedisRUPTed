# PS-119-06 — Failure recovery and idempotency: Storage

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M03 Storage](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/storage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-119-06.R01** Writes are serialized per vault or relay (SQLite BEGIN IMMEDIATE with WAL and busy_timeout 5000; IndexedDB one readwrite transaction per commit), and a busy database maps to DEPENDENCY_UNAVAILABLE.
- **PS-119-06.R02** A failed IndexedDB commit restores the in-memory working set so the vault state equals the last committed state.
- **PS-119-06.R03** Consumer failures are retried with backoff and dead-lettered after 8 attempts, and a duplicate delivery is acknowledged without re-running side effects.
- **PS-119-06.R04** The SQLite adapter option walAutocheckpoint 0 runs PRAGMA wal_autocheckpoint=0 on every relay connection it opens, and while F15.S03.M02 is the checkpointer registered through registerCheckpointer the adapter never checkpoints by itself (no wal_checkpoint pragma, no checkpoint on close before the F15.S02.M01 shutdown sequence ran the pre-checkpoint hook) and exposes its writer connection through writerConnection() for node:sqlite backup().

## Specification

- **idempotency:** Inbox rows make consumers idempotent per (consumer, eventId); blob put is idempotent by content address; restore of an identical record is a no-op; requeue of an already requeued event is refused with CONFLICT_STATE so replay_count counts each replay once.
- **concurrency:** Single writer per store with a transaction mutex; optimistic concurrency by revision for records; leases with compare-and-set and fencing for local reservations; no distributed lock (IDM-8). On a relay the registered checkpointer is the only connection that checkpoints; backup() steps run on the writer connection between transactions.
- **retries:** The dispatcher uses full jitter, base 500 ms, cap 30 s and dead-letters after 8 attempts; requeued dead letters get 8 new attempts and return to dead after 7 days without delivery or when their consumer is disabled.
- **offline:** The vault works with no relay: commits are local, consumers run locally and F15.S01.M01 OutboxEntry records stay in the vault until its sender delivers them; nothing is lost when a relay is unreachable.
- **partial failure:** A handler exception, an err result or a failed IndexedDB write rolls back every table touched; SQLite COMMIT failure triggers ROLLBACK before the error is rethrown. An IndexedDB upgrade that fails after the pre-upgrade snapshot leaves the snapshot and the old database intact.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-119-09.T04 | integration | PS-119-01.R02, PS-119-03.R01, PS-119-04.R03, PS-119-06.R03, PS-119-09.R02 | two aggregates with a failing first delivery, duplicate delivery, eight failures, requeue; pending query semantics per adapter | per-aggregate order kept; duplicate skipped; dead letter at attempt 8; requeued events delivered |
| TEST-PS-119-09.T07 | integration | PS-119-06.R01 | pragmas on a file database; another connection holds BEGIN IMMEDIATE | journal_mode wal, busy_timeout 5000 by default; DEPENDENCY_UNAVAILABLE through storage and bus |
| TEST-PS-119-09.T08 | integration | PS-119-06.R02 | reopen an IndexedDB vault; inject a QuotaExceededError on commit | data and outbox sequence survive reopen; failed commit leaves no trace; next commit persists |
| TEST-PS-119-09.T20 | integration | PS-119-06.R04 | open a relay file database with walAutocheckpoint 0 and a registered recording checkpointer, write 20 000 rows, open a second connection, close the store, then take node:sqlite backup() of writerConnection() | PRAGMA wal_autocheckpoint is 0 on both connections; WAL salts unchanged by storage; no checkpoint before the pre-checkpoint hook; backup copy passes integrity_check with every committed row |

## Dependencies

Module depends on: F15.S03.M01, CTR-ID-001, CTR-SCH-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-FLG-001, CTR-OBS-001, CTR-TST-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
