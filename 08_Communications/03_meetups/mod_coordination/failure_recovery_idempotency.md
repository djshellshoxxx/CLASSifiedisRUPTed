# PS-064-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_coordination. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03, offline), CTR-PRV-001 (RET-EPH, RET-LOC), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-064-06.R01 | Every transition and its event commit atomically (transaction or outbox). | MVP |
| PS-064-06.R02 | Duplicate commands return original result. | MVP |
| PS-064-06.R03 | Expiry of point disclosures is enforced at read time and by a sweep job within 5 min; both must agree. | MVP |
| PS-064-06.R04 | Point sharing is online-only; on connection loss the client shows failure and does not queue the point. | MVP |
| PS-064-06.R05 | Timeout jobs (expire, complete) are idempotent and resumable. | MVP |
| PS-064-06.R06 | Client retries only retryable codes, max 5 attempts, backoff with jitter. | MVP |

## Data / schema
Disclosure table as in [domain_schema.md](domain_schema.md). Timeout job table: `meetup_id`, `job_type`, `due_at`, `done_at`.

## Commands / queries / events
Retry rules apply to all commands in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Timeouts per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Non-retryable codes shown immediately; no silent drop.

## Authorization
Re-authorized per attempt; sweep jobs run as `sys_`.

## Failure, idempotency, concurrency, offline
- Expiry sweep failure: read-time check still denies expired points.
- Accept and cancel race: first commit wins (PS-064-03).
- Time zone or DST shift: stored in UTC; display only.

## Privacy, retention, abuse
Points deleted at expiry (not merely hidden). Place text and disclosure rows removed at RET-LOC.

## Observability & budgets
`coord_expiry_lag_seconds` p95 ≤ 5 min; `coord_point_read_expired_total` should be zero after sweep.

## Tests
- TEST-PS-064-06-01 (integration): sweep disabled; read-time check still blocks expired point.
- TEST-PS-064-06-02 (fault): crash after transition before event; event published once.
- TEST-PS-064-06-03 (offline): point share attempt offline shows failure, nothing queued.
- TEST-PS-064-06-04 (DST): window stored and displayed correctly across transition.

## Acceptance criteria
1. Expiry enforced by read check even if sweep fails.
2. No queued point exists on any device.
3. Atomicity under fault injection.
4. DST fixtures pass.

## Assumptions & open decisions
- ASSUMPTION: sweep interval 5 min.
- PROVISIONAL (D08 default, unapproved): point sharing excluded from offline queue (stricter than default).
