# PS-078-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_export (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03), CTR-PRV-001 (offline caches).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-078-06.R01 | Generation is restartable: a crashed attempt leaves no served partial package. | MVP |
| PS-078-06.R02 | Package is written to a temporary key and promoted to `ready` only after manifest verification (all SHA-256 match). | MVP |
| PS-078-06.R03 | Download supports HTTP range requests for resume; a range request does not consume the token until the final byte is served. | MVP |
| PS-078-06.R04 | A failed download (connection reset before final byte) does not change state. | MVP |
| PS-078-06.R05 | Offline: the client never queues an export request; the request requires online reauthentication (no offline command queue for this scope). | MVP |

## Data / schema
`export_job` table: `dsr_id`, `attempt`, `lease_until`, `temp_key`, `last_error_code`. RET-OPS for error codes.

## Commands / queries / events
`export.failed` emitted after attempt 3 with `error_code` from registry only.

## States & transitions
Failure transitions in PS-078-03 (`generating` → `generating` or `failed`).

## Validation & errors
`SYS.UNAVAILABLE` (retryable) for storage outages; `SYS.INTERNAL` (not retryable) for manifest mismatch, with incident.

## Authorization
Generation runs under PS-078-05 R05 grant only.

## Failure, idempotency, concurrency, offline
Retry backoff 30 s, 2 min, 10 min (ASSUMPTION). Lease 15 min. Concurrent generation prevented by lease and unique row constraint. Duplicate download with valid token returns the same bytes if state is `downloaded` and resume requested; otherwise `EXPORT.TOKEN_CONSUMED`.

## Privacy, retention, abuse
Temp keys deleted on failure within 1 h. Failed packages are never retained beyond expiry.

## Observability & budgets
`export_attempts_total{outcome}`; alert if `failed` rate > 1% of requests in 24 h (ASSUMPTION).

## Tests
- TEST-PS-078-06-01 (fault): kill worker at 50% of package write; retry yields complete, verified package.
- TEST-PS-078-06-02 (network): drop connection at 90%; resume with range; token consumed once.

## Acceptance criteria
1. No state `ready` with a manifest mismatch (TEST-PS-078-06-01).
2. Token consumed only after final byte (TEST-PS-078-06-02).
3. Offline request attempt returns a client-side reauth prompt, not a queued command.

## Assumptions & open decisions
- ASSUMPTION: retry schedule and lease above.
- PROVISIONAL (D08 default): exports are not queued offline; the pending queue is for relay-acknowledged commands only.
