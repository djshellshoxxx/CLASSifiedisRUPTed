# PS-099-06 — Failure recovery and idempotency: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-06.R01** consume is atomic per key so concurrent requests never exceed the configured burst.
- **PS-099-06.R02** Policy writes are idempotent per CTR-IDM-001 and use expectedRevision.
- **PS-099-06.R03** Store outages follow the policy fail mode, open for reads at half rate, closed for sensitive classes.

## Specification

- **idempotency:** Policy set replays by Idempotency-Key for 24 h; consume is not idempotent by design and a retried request spends tokens again, which clients avoid by honoring retryAfterMs.
- **concurrency:** In-memory buckets are updated with a per-key critical section (single-threaded relay event loop or compare-and-swap on persisted rows); persisted updates use UPDATE with a tat monotonic guard and window sub-counter increments in the same statement.
- **retries:** Clients honor retryAfterMs and CTR-IDM-001 backoff with full jitter (base 500 ms, cap 30 s, max 6 attempts).
- **offline:** The vault queues commands in the outbox and local guards are advisory; relay limits apply when the outbox replays, and replay uses jitter to avoid synchronized bursts.
- **partial failure:** If snapshot persistence fails, in-memory limits continue and an alert fires; after restart buckets restart from the last snapshot, which can loosen limits by at most one burst or 5 seconds of arrivals per key; reduced markers are persisted rows and survive restarts; a missed signal event is redelivered by the outbox (EVT-2).

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T09 | chaos | PS-099-06.R01, PS-099-06.R02, PS-099-06.R03 | concurrent consumes on one key; counter store down for reads and for relay.access; restart mid-run | never above burst; reads fail open at half rate; relay.access closed 30 s; loosening ≤ one burst |
| TEST-PS-099-09.T21 | chaos | PS-099-06.R03 | counter store down during proximity searches | read.proximity.query.* allowed at half rate in memory; read.proximity.center_new returns RATE_LIMITED for 30 seconds |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
