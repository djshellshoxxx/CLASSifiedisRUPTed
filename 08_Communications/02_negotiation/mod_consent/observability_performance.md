# PS-062-08 — observability performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_consent. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R09 logs), CTR-ERR-001 (R10), CTR-EVT-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-062-08.R01 | `cns.give` server commit p95 ≤ 300 ms, p99 ≤ 800 ms (ASSUMPTION). | MVP |
| PS-062-08.R02 | `cns.status` p95 ≤ 100 ms. | MVP |
| PS-062-08.R03 | Logs contain consent ID, proposal ID, codes and timings only; never terms digest, amounts or party IDs beyond pseudonymous refs. | MVP |
| PS-062-08.R04 | Lock-versus-withdraw conflicts are counted per day and alerted at > 0 committed-after-lock events. | MVP |

## Data / schema
Metrics: `consent_command_total{cmd,outcome}`, `consent_command_latency_ms{cmd}`, `consent_stale_total`, `consent_lock_conflict_total`, `consent_queue_rejected_total{reason}`.

## Commands / queries / events
Event lag `consent_event_lag_ms` p95 ≤ 2 s to subscribers (F02, F13).

## States & transitions
Dashboard shows counts per state from [PS-062-03](workflow_state_machine.md).

## Validation & errors
Rejections counted by code, not by party.

## Authorization
Denial counters per [PS-062-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Alert on stale-rejection rate > 5% of queued consents per day (ASSUMPTION).

## Privacy, retention, abuse
Traces carry opaque IDs. Retention RET-OPS 30 days.

## Observability & budgets
| Budget | Target |
|---|---|
| cns.give p95 | ≤ 300 ms |
| cns.status p95 | ≤ 100 ms |
| Committed-after-lock events | 0 |
| Stale-queued rejection | ≤ 5%/day (monitor) |

## Tests
- TEST-PS-062-08-01 (performance): load at 2× expected peak; budgets met.
- TEST-PS-062-08-02 (logs): fixture terms digest and amount never appear in logs.
- TEST-PS-062-08-03 (alert): synthetic committed-after-lock event fires alert.

## Acceptance criteria
1. Budgets met (TEST-PS-062-08-01).
2. Log redaction verified (TEST-PS-062-08-02).

## Assumptions & open decisions
- ASSUMPTION: budgets are targets, not measured.
- D08 (PWA offline writes): PROVISIONAL (D08 default, unapproved); queue metrics depend on it.
