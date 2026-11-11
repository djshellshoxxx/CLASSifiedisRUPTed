# PS-118-06 — Failure recovery and idempotency: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-06.R01** Startup is repeatable, so migrations, identity creation and lease acquisition are idempotent, and a crash during startup leaves a state from which the next start succeeds.
- **PS-118-06.R02** Event delivery is at least once and consumers are idempotent through the inbox (CTR-EVT-001 EVT-3); the dispatcher can be killed at any point without losing events.
- **PS-118-06.R03** The relay is stateless toward vaults beyond the data it hosts; losing it never loses user-owned private data.

## Specification

- **idempotency:** Identity creation happens inside one transaction that also writes the key file and its revocation certificate atomically (write temp, fsync, rename); rerunning finds the existing identity. Rotation requires an Idempotency-Key (replayed for 24 h by F15.S02.M02) and expectedRevision of the active key; a stale revision gets CONFLICT_REVISION and a rotation within 24 h of the last gets RATE_LIMITED. Revocation is idempotent by keyId: revoking a revoked key returns the stored revocation. Receipt seq increments in the same transaction as the bytes it acknowledges. Event delivery is deduplicated by (consumer, eventId) in the inbox.
- **concurrency:** One relay process per database: the dispatcher lease row (IDM-8, local to this relay) with TTL 30 s prevents a second instance. Within the process, aggregates are delivered sequentially per aggregate.id and with concurrency 8 across aggregates; SQLite writes serialize through BEGIN IMMEDIATE. The unique (relay_id, prev_key_id) index prevents this relay from signing two rotations from one key.
- **retries:** Consumer failures retry with CTR-IDM-001 IDM-4 backoff (base 500 ms, cap 30 s, full jitter); after 8 attempts the event is moved to dead_letter with its error code and replayed by an operator through F15.S03.M03.
- **offline:** The relay may be offline at any time; vault commands and sync outbox entries wait and show status unknown. On start the dispatcher resumes from the first undelivered outbox row. Delivered rows stay 7 days.
- **partial failure:** A crash mid-batch re-delivers the batch after restart and the inbox suppresses duplicate side effects. If the archive write fails the batch is not marked delivered. If a pre-checkpoint hook fails at shutdown the WAL is left untruncated for the next start's archiver. If SQLite is locked (SQLITE_BUSY) commands return DEPENDENCY_UNAVAILABLE (retryable) and readyz fails after 10 s.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T08 | integration | PS-118-04.R03, PS-118-06.R01, PS-118-06.R03 | flaky consumer fails 3 times then succeeds; always-failing consumer; kill -9 mid-batch | ordered at-least-once delivery, dead letter after 8 attempts, no lost events after restart, inbox suppresses duplicates |
| TEST-PS-118-09.T10 | integration | PS-118-06.R02, PS-118-06.R03 | start two processes on one database | second exits with PLATFORM_RELAY_DUPLICATE_INSTANCE; first unaffected |
| TEST-PS-118-09.T15 | chaos | PS-118-06.R02, PS-118-09.R03 | node:sqlite canary on pinned and latest 22.x with SQLITE_BUSY injection | adapter behavior identical, DEPENDENCY_UNAVAILABLE returned, readyz fails after 10 s |
| TEST-PS-118-09.T23 | integration | PS-118-03.R02, PS-118-06.R03 | shutdown with a registered pre-checkpoint hook that succeeds, then one that fails | WAL archived before TRUNCATE in the first case; TRUNCATE skipped and the WAL kept in the second; next start archives it first |
| TEST-PS-118-09.T24 | integration | PS-118-06.R01, PS-118-04.R02, PS-118-02.R04 | rotate replayed with the same Idempotency-Key and body, with the same key and a different body, with a stale expectedRevision, and a second rotation 2 h later | original response replayed; IDEMPOTENCY_KEY_REUSED; CONFLICT_REVISION; RATE_LIMITED |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, F16.S01.M01, F16.S01.M02, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
