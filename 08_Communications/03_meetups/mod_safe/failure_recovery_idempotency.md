# PS-066-06 — failure, recovery, idempotency and offline behavior

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_safe (Platform Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03), CTR-SCH-001. **Decisions:** D08 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-066-06.R01 | Idempotency scope (actor, command, key) retained 7 days (CTR-EVT-001 R03). | MVP |
| PS-066-06.R02 | Safe exit is queued locally with top priority and sent before other queued commands when online. | MVP |
| PS-066-06.R03 | A safe exit received after a terminal state is stored as an audit note (`meetup_plan.safe_exit_late`) with no state change. | MVP |
| PS-066-06.R04 | Timer jobs run at least once; each is idempotent by `(meetup_plan_id, timer_kind, scheduled_for)`. | MVP |
| PS-066-06.R05 | API timeout 3 s; client retries with exponential backoff (base 1 s, factor 2, jitter ±20%), max 5 attempts. | MVP |
| PS-066-06.R06 | The active plan is cached on the client for at most 24 h (window end plus 1 h). Cache holds venue text and window only, never codes. | MVP |

## Data / schema
Outbox row: `command_id`, `command_type`, `payload_digest`, `priority` (`safety` > `normal`), `attempts`, `next_attempt_at`. Timer row: `timer_kind`, `scheduled_for`, `status`.

## Commands / queries / events
Retries reuse the original `idempotency_key`; a new key is never generated for a retry.

## States & transitions
Outbox states: `pending`, `sent`, `acknowledged`, `failed_permanent`. A command moves to `failed_permanent` only on a non-retryable code.

## Validation & errors
`SYS.UNAVAILABLE` and `SYS.RATE_LIMITED` are retryable; `SAFE.INVALID_TRANSITION` and `SAFE.OUTSIDE_WINDOW` (after window) are not. Permanent failures show the user a local message and keep the plan visible.

## Authorization
Retries reuse original authorization; no token is cached beyond the session lifetime.

## Failure, idempotency, concurrency, offline
- Relay outage: outbox persists across app restarts; no data loss on app kill.
- Server outage: check-in and safe exit remain available locally; the user is told the counterparty may not see the update until sync.
- Clock skew: server time decides window checks; client shows a warning when device clock differs by more than 2 min.
- Replay: duplicate delivery returns the original result (PS-066-04).

## Privacy, retention, abuse
Outbox rows are deleted on acknowledgment or after 7 days, whichever is first. Payloads store digests, not handles or codes.

## Observability & budgets
Metric: outbox age p95 (target < 60 s online; ASSUMPTION). Metric: permanent failures per day.

## Tests
- TEST-PS-066-06-01 (integration): kill app after queueing safe exit; restart sends it once.
- TEST-PS-066-06-02 (integration): relay down 10 min; queued check-in sent on recovery with original key.
- TEST-PS-066-06-03 (property): duplicate delivery of any command yields one state change.
- TEST-PS-066-06-04 (integration): timer delivered twice produces one transition.

## Acceptance criteria
1. No queued safety command is discarded while the plan is open.
2. Retries never change the idempotency key.
3. Client cache never contains a code value (test scan of local store).

## Assumptions & open decisions
- ASSUMPTION: 7-day outbox retention; 24 h cache ceiling.
- D08 (PROVISIONAL default, unapproved): local pending queue until authenticated relay acknowledgment.
