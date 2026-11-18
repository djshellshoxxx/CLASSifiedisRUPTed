# PS-048-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_location. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R09), CTR-PRV-001 (R03, R11).

**Decision labels:** Offline writes blocked (D08 PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-048-06.R01 | Location writes are not queued offline in MVP; offline attempt returns local message `err.location.offline`. | MVP |
| PS-048-06.R02 | Client-side resolution works offline using the cached registry geometry (≤ 24 h old). | MVP |
| PS-048-06.R03 | Retries of `location.cell.set` with same key return original result. | MVP |
| PS-048-06.R04 | Concurrent set and withdraw: consent revision wins; loser returns `LOCATION.INVALID_TRANSITION`. | MVP |

## Data / schema
Consent revision integer per account; idempotency records RET-OPS (7 days).

## Commands / queries / events
Retry: 3 attempts with backoff for network errors only; validation errors are not retried.

## States & transitions
See PS-048-03.

## Validation & errors
`SYS.UNAVAILABLE` retryable true; `LOCATION.INVALID_TRANSITION` retryable false.

## Authorization
Retries re-check consent.

## Failure, idempotency, concurrency, offline
If cached geometry older than 24 h, client forces picker mode and labels the fallback.

## Privacy, retention, abuse
Client cache of cell purged on logout and account switch (CTR-PRV-001).

## Observability & budgets
Counter `location_offline_block_total`; no coordinates in telemetry.

## Tests
- TEST-PS-048-06-01 (offline): device resolution works with cached geometry.
- TEST-PS-048-06-02 (integration): duplicate set returns original.
- TEST-PS-048-06-03 (race): withdraw and set concurrently → consent revision decides.

## Acceptance criteria
1. Offline set blocked with local message, nothing queued.
2. Geometry older than 24 h forces picker.
3. Race test deterministic.

## Assumptions & open decisions
- D08 PROVISIONAL.
