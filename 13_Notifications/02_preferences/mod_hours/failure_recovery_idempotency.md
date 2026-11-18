# PS-105-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_hours. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-105-06.R01 | Replace-all writes are atomic: either the full new set is committed or none is. | MVP |
| PS-105-06.R02 | DST handling: a local time that does not exist (spring gap) is moved forward to the first valid instant; an ambiguous time (fall overlap) uses the first occurrence. | MVP |
| PS-105-06.R03 | Evaluation uses server clock with max skew 2 s (NTP-synced hosts); clients never decide gating. | MVP |
| PS-105-06.R04 | Deferral timers survive restart; on restart, timers past due re-evaluate immediately. | MVP |
| PS-105-06.R05 | Evaluation is idempotent per (`ntf_id`, window revision). | MVP |

## Data / schema
Window revision is stored in `delivery_window.revision`. Evaluation key = `ntf_id` + revision. Records retained 7 days.

## Commands / queries / events
- `set_windows` returns the merged set and revision. Replay returns same result.
- Events emitted after commit only.

## States & transitions
Deferred items persist with `defer_until`; see workflow_state_machine.

## Validation & errors
`SYS.CONFLICT` on stale revision (retryable true after re-read). `HOURS.TZ_UNKNOWN` on tzdata mismatch after upgrade: existing rows are kept and flagged for re-validation, not silently moved.

## Authorization
Evaluation uses grant valid at evaluation time (see authorization_capabilities).

## Failure, idempotency, concurrency, offline
- Concurrency: two devices edit windows; second write with stale revision gets SYS.CONFLICT; client shows merged view.
- Offline: client may edit a draft locally; submission goes to the D08 pending queue until acknowledged. Local draft is not gating.
- Failure of evaluator: notification stays `evaluated`, retried; after 3 failures sent to `dropped` with reason `EVALUATOR_UNAVAILABLE` only for `activity` (ASSUMPTION).

## Privacy, retention, abuse
Local drafts hold windows in device storage; cleared on logout (PS-104-07 pattern shared with mod_cache).

## Observability & budgets
Counter `hours_evaluator_errors_total`. Alert if backlog older than 2 h.

## Tests
- TEST-PS-105-06-01 (unit): spring-forward gap time resolves to first valid instant.
- TEST-PS-105-06-02 (unit): fall-back ambiguous time uses first occurrence.
- TEST-PS-105-06-03 (integration): kill during deferral; restart delivers exactly once.
- TEST-PS-105-06-04 (offline): edit offline, reconnect, stale revision yields SYS.CONFLICT and merged view.

## Acceptance criteria
1. DST cases in fixtures for at least three zones (Europe/Berlin, America/New_York, Australia/Sydney).
2. No duplicate delivery in restart test.
3. Atomic replace verified by fault injection.

## Assumptions & open decisions
- ASSUMPTION: 2 s clock skew bound; 3 evaluator failures before drop.
- D08 PROVISIONAL (D08 default, unapproved): pending queue for offline edits.
