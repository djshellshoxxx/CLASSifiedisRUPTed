# PS-049-06 — Failure recovery and idempotency: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-06.R01** The query is side-effect free except for ephemeral counters, so retries are safe.
- **PS-049-06.R02** A counter store failure fails closed with DEPENDENCY_UNAVAILABLE rather than skipping limits.
- **PS-049-06.R03** Cursors are bound to the center cell, radius and filter hash so they cannot be reused to widen an area.

## Specification

- **idempotency:** Queries are read-only; counters increment once per accepted request keyed by request id, so a client retry with the same Idempotency-Key header is not double counted within 60 s.
- **concurrency:** Counters use atomic increments per key and window; concurrent requests may overshoot a limit by at most the number of in-flight requests (bounded by 4 per key).
- **retries:** Clients retry only RATE_LIMITED after retryAfterMs and DEPENDENCY_UNAVAILABLE with base 500 ms, cap 30 s, full jitter, max 6 attempts.
- **offline:** The vault runs local proximity search on the local index offline; relay search is skipped and the UI says so.
- **partial failure:** If the index read fails after counters incremented, the request still counts; the caller sees DEPENDENCY_UNAVAILABLE and the retry is allowed once per minute without a second increment.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T02 | unit | PS-049-02.R02, PS-049-02.R03, PS-049-06.R01 | radius 1 km, 6-character center, missing center, anonymous at L2 center | DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_CENTER_TOO_PRECISE, DISCOVERY_CENTER_REQUIRED respectively; no index read |
| TEST-PS-049-09.T09 | chaos | PS-049-06.R01, PS-049-06.R02, PS-049-06.R03 | counter store down; index read fails after increment; same Idempotency-Key retried | fail closed with DEPENDENCY_UNAVAILABLE; no double count within 60 s; cursor reuse for wider radius rejected |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
