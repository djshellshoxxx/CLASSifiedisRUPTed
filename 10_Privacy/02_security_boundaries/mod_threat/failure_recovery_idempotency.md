# PS-082-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_threat. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-082-06.R01 | Writes are all-or-nothing; a failed mitigation link leaves prior state. | MVP |
| PS-082-06.R02 | Expiry timer jobs are idempotent per (threat_id, expiry_at). | MVP |
| PS-082-06.R03 | If the register store is unavailable, `threat.query_register` returns `SYS.UNAVAILABLE` (retryable), never partial data. | MVP |

## Data / schema
Revision fields per [domain_schema.md](domain_schema.md).

## Commands / queries / events
Retries apply to all commands in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Recovery replays events; expiry reversion per PS-082-03.R03.

## Validation & errors
| Code | Retryable | When |
|---|---|---|
| SYS.UNAVAILABLE | true | store down |
| EVT.REVISION_CONFLICT | false | concurrent update |
| THREAT.ACCEPTANCE_EXPIRED | false | accepted risk past expiry used in a decision |

## Authorization
Retries re-authorize.

## Failure, idempotency, concurrency, offline
Concurrency via `expected_revision`. No offline writes.

## Privacy, retention, abuse
Recovery logs carry IDs and codes only.

## Observability & budgets
Metric `threat_timer_runs_total{outcome}`; timer lag ≤ 24 h (ASSUMPTION).

## Tests
- TEST-PS-082-06-01 (idempotency): timer rerun does not double-notify.
- TEST-PS-082-06-02 (fault): store outage yields no partial register.
- TEST-PS-082-06-03 (concurrency): two mitigation updates, one revision wins.

## Acceptance criteria
1. No partial reads under fault.
2. Timer idempotent.
3. Concurrency conflict returns 409.

## Assumptions & open decisions
- ASSUMPTION: timer lag bound.
