# PS-114-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_cache. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-114-08.R01 | Cache-hit page shell render: first contentful paint p75 ≤ 1.5 s on mid-range phone (ASSUMPTION). | MVP |
| PS-114-08.R02 | Shell precache ≤ 5 MB; data cache quota 50 MB. | MVP |
| PS-114-08.R03 | Telemetry (opt-in only) carries route template and hit/miss, no URLs. | MVP |
| PS-114-08.R04 | Local debug log is cleared on logout. | MVP |

## Data / schema
Opt-in counters: `cache_hit_total{route_template}`, `cache_miss_total{route_template}`, `cache_evictions_total`.

## Commands / queries / events
None.

## States & transitions
Counters tied to transitions in workflow_state_machine.

## Validation & errors
Rejection counters by local code.

## Authorization
Telemetry is opt-in and aggregated.

## Failure, idempotency, concurrency, offline
Offline counters buffered locally, sent only after consent.

## Privacy, retention, abuse
No per-user counters.

## Observability & budgets
Service worker startup ≤ 50 ms added on hit path.

## Tests
- TEST-PS-114-08-01 (performance): FCP budget on throttled profile with warm cache.
- TEST-PS-114-08-02 (unit): telemetry payload contains no URLs or query strings.
- TEST-PS-114-08-03 (integration): logout clears debug log.
- TEST-PS-114-08-04 (performance): service worker startup overhead ≤ 50 ms.

## Acceptance criteria
1. Budgets verified (not yet run).
2. Telemetry scan passes.
3. Opt-in default off verified.

## Assumptions & open decisions
- ASSUMPTION: telemetry off by default.
- No Dxx applies.
