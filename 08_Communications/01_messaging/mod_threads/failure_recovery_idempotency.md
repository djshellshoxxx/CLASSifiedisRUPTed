# PS-061-06 — Failure recovery and idempotency: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-06.R01** Create is idempotent on the derived threadId, so a retry or a concurrent create on another vault returns the same thread with existing true; the signed thread-open statement is queued through F11.S02.M01 on the F15.S01.M01 outbox and goes through prepared, transport acknowledged and peer accepted.
- **PS-061-06.R02** Roster updates from events are idempotent through the consumer inbox (CTR-EVT-001 EVT-3) and order-insensitive.
- **PS-061-06.R03** Archiving and message purge scheduling happen in one IndexedDB transaction so a thread is never archived without a purge schedule.

## Specification

- **idempotency:** Vault commands are idempotent on the derived threadId; the thread-open statement is deduplicated by cid on receipt and two statements for the same threadId merge their participant claims only when both are entitled.
- **concurrency:** expectedRevision on archive and request handling; each command is one IndexedDB transaction; two vaults creating the same thread concurrently derive the same threadId and generation, so there is nothing to supersede; superseding happens only after a local archive and a higher generation, and in-flight messages are then re-homed; no distributed lock is used.
- **retries:** The thread-open statement uses the F15.S01.M01 outbox timers (CTR-IDM-001 IDM-4 backoff base 500 ms, cap 30 s, 6 attempts; unsent entries expire 7 days after creation after a day-6 prompt); local event consumers retry up to 8 times then dead-letter locally.
- **offline:** All commands work offline; create shows the thread as saved on this device until the thread-open statement is transport acknowledged; derivation needs no network.
- **partial failure:** If the context record is not yet in the vault create returns NOT_FOUND and stores nothing; an inbound statement for an unknown context becomes a request with reason context_missing; if the relay is down the thread works locally with delivery status unknown; consumer failures leave the roster unchanged and retry.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T04 | integration | PS-061-03.R03, PS-061-06.R03 | archive thread | one comms.thread.archived event and purge schedule exist in the same transaction |
| TEST-PS-061-09.T06 | integration | PS-061-04.R03, PS-061-06.R02, PS-061-09.R03 | replay mutiny.party.joined, party.left and block events in shuffled and duplicated order | final roster identical to ordered replay |
| TEST-PS-061-09.T08 | integration | PS-061-06.R01, PS-061-01.R05 | create twice and concurrent creates from vaults A and B for one pair while offline | both derive the same threadId and generation, one thread after exchange, nothing superseded, existing true on repeat |
| TEST-PS-061-09.T09 | e2e | PS-061-06.R01, PS-061-03.R01 | A blocks B while a direct thread is active | A's vault archives with reason blocked and drops B's later messages; B's vault state, responses and sync states are identical to an unblocked control run |
| TEST-PS-061-09.T18 | integration | PS-061-03.R04, PS-061-06.R01 | A archives the listing thread, opens a new one (generation 2) while B has a message in flight for generation 1 | B's vault archives generation 1 with reason superseded; the in-flight message is re-homed into generation 2 and shown |

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, F02.S01.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
