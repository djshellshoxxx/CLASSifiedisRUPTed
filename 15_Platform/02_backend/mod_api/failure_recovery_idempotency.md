# PS-117-06 — Failure recovery and idempotency: API and command bus

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M02 API and command bus](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/bus` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-117-06.R01** The same key with the same request hash within 24 h replays the stored status and body (Idempotent-Replay true over HTTP); the same key with a different hash returns IDEMPOTENCY_KEY_REUSED; failed commands store nothing.
- **PS-117-06.R02** A handler error result or exception rolls back records, outbox events, F15.S01.M01 OutboxEntry records and the idempotency record together; exceptions map to INTERNAL and are logged with the correlation ID.
- **PS-117-06.R03** Concurrent dispatches with the same key are serialized by the storage transaction so the handler runs at most once.
- **PS-117-06.R04** Of the common codes only RATE_LIMITED, DEPENDENCY_UNAVAILABLE and INTERNAL are retryable, port codes keep the retryability their owner defines (SECURITY_READ_ONLY_MODE is retryable with retryAfterMs 300000), and every retryAfterMs is rendered as the HTTP Retry-After header in whole seconds.

## Specification

- **idempotency:** Idempotency-Key (UUIDv7) required on idempotent commands; record keyed (tenantId, actor, command, key) with the request hash; 24 h validity; replay returns the stored status and normalized JSON body.
- **concurrency:** All transactions of one vault or relay are serialized (single writer); the lookup, handler and record write happen in one transaction so a racing duplicate sees the stored record.
- **retries:** Clients retry only retryable codes and network failures with full-jitter backoff (base 500 ms, cap 30 s, 6 attempts, IDM-4), honouring retryAfterMs; replays are safe because of the idempotency record.
- **offline:** In the vault the bus needs no network: commands commit locally and statements wait as F15.S01.M01 OutboxEntry records; the PWA outbox replays relay commands with their original keys after reconnect, and a read-only relay keeps them pending until its Retry-After passes.
- **partial failure:** No step outside the transaction can leave partial state: events are written to the outbox in the same transaction and published to the EventSink only after commit; a failed audit write is logged and does not change the command result.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-117-09.T10 | integration | PS-117-01.R01, PS-117-06.R01 | same key and body twice, then changed body, then other actor | replay with original 201 and body; IDEMPOTENCY_KEY_REUSED; other actor executes |
| TEST-PS-117-09.T11 | integration | PS-117-06.R02 | handler returns err, then throws after writing records, an event and an OutboxEntry record through a stub F15.S01.M01 OutboxPort | no records, outbox rows, OutboxEntry records or idempotency record; INTERNAL with no message; error log with correlationId |
| TEST-PS-117-09.T12 | integration | PS-117-06.R03 | five concurrent dispatches with one key | handler runs once; one fresh result and four replays |
| TEST-PS-117-09.T17 | unit | PS-117-06.R04 | fixed-window limit exceeded; busy dependency; read-only port refusal rendered over HTTP | RATE_LIMITED with retryAfterMs 45 000 and Retry-After 45; only three common codes retryable; DEPENDENCY_UNAVAILABLE retryable; SECURITY_READ_ONLY_MODE retryable with Retry-After 300 |

## Dependencies

Module depends on: F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-ERR-001, CTR-EVT-001, CTR-IDM-001, CTR-CAP-001, CTR-FLG-001, CTR-SCH-001, CTR-OBS-001, CTR-PRV-001, CTR-TST-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
