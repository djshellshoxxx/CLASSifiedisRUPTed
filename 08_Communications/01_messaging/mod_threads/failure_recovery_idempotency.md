# PS-061-06 — Failure recovery and idempotency: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-06.R01** Create is idempotent on context plus participant pair so a retry returns the existing thread with existing true; the signed thread-open statement is queued in the sync outbox and goes through prepared, transport acknowledged and peer accepted.
- **PS-061-06.R02** Roster updates from events are idempotent through the consumer inbox (CTR-EVT-001 EVT-3) and order-insensitive.
- **PS-061-06.R03** Archiving and message purge scheduling happen in one IndexedDB transaction so a thread is never archived without a purge schedule.

## Specification

- **idempotency:** Vault commands are idempotent on the natural key (context, sorted participant pair); the thread-open statement is deduplicated by cid on receipt.
- **concurrency:** expectedRevision on archive; each command is one IndexedDB transaction; two vaults creating the same pair thread concurrently produce two thread-open statements and the lower threadId (bytewise) is kept by both after exchange, the other is archived as superseded; no distributed lock is used.
- **retries:** The sync outbox retries the thread-open statement with backoff base 1 s, factor 2, cap 15 min for 14 days; local event consumers retry up to 8 times then dead-letter locally.
- **offline:** All commands work offline; create shows the thread as saved on this device until the thread-open statement is transport acknowledged.
- **partial failure:** If the context record is not yet in the vault create returns NOT_FOUND and stores nothing; if the relay is down the thread works locally with delivery status unknown; consumer failures leave the roster unchanged and retry.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T04 | integration | PS-061-03.R03, PS-061-06.R03 | archive thread | one comms.thread.archived event and purge schedule exist in the same transaction |
| TEST-PS-061-09.T06 | integration | PS-061-04.R03, PS-061-06.R02 | replay mutiny.party.joined, party.left and block events in shuffled and duplicated order | final roster identical to ordered replay |
| TEST-PS-061-09.T08 | integration | PS-061-06.R01, PS-061-01.R04 | create twice and concurrent creates from both vaults A and B for one pair | one thread after exchange, lowest threadId kept, other archived superseded, existing true on repeat |
| TEST-PS-061-09.T09 | e2e | PS-061-06.R01, PS-061-03.R01 | block added while direct thread active | thread archived for both, blocked party shown archived without reason |

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
