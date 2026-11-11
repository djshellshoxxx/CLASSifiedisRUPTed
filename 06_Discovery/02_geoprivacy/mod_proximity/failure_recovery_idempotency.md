# PS-049-06 — Failure recovery and idempotency: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-06.R01** The query is side-effect free except for ephemeral counters, so retries with the same request are safe and are not double counted.
- **PS-049-06.R02** A rate-limit store failure never skips limits - the query-volume classes fall back to the F12.S03.M03 in-memory half-rate limit, and the center-change class fails closed with RATE_LIMITED for 30 seconds.
- **PS-049-06.R03** Cursors are bound to the center cell, radius and filter hash so they cannot be reused to widen an area.

## Specification

- **idempotency:** Queries are read-only; counters increment once per accepted request; a retry within 60 s with the same Idempotency-Key and the same request hash (center, radius, filters, cursor) is not counted again, while the same key with a different hash is counted and returns IDEMPOTENCY_KEY_REUSED.
- **concurrency:** RateLimitPort increments atomically per key and window; concurrent requests may overshoot a limit by at most the number of in-flight requests (bounded by 4 per key).
- **retries:** Clients retry only RATE_LIMITED after retryAfterMs and DEPENDENCY_UNAVAILABLE with base 500 ms, cap 30 s, full jitter, max 6 attempts.
- **offline:** The vault runs local proximity search on the local index offline; relay search is skipped and the UI says so.
- **partial failure:** If the index read fails after counters incremented, the request still counts; the caller sees DEPENDENCY_UNAVAILABLE and the retry with the same key and request hash is allowed once per minute without a second increment. The center-change class is configured failMode closed in RatePolicy; the query classes keep the F12.S03.M03 read default.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T09 | chaos | PS-049-06.R01, PS-049-06.R02, PS-049-06.R03 | limiter store down; index read fails after increment; same Idempotency-Key with the same body and with a different center; IPv6 caller rotating /64 addresses inside one /48; 24 h window spanning a salt rotation; cursor reused for a wider radius | query classes fall back to half rate and center_new fails closed with RATE_LIMITED for 30 s; no double count for the same body; different center counted and IDEMPOTENCY_KEY_REUSED; one /48 bucket; window still counts after rotation; cursor rejected |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S01.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M03, F12.S01.M01, F12.S03.M01, F12.S03.M02, F12.S03.M03, F15.S04.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
