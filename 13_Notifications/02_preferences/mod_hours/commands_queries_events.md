# PS-105-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_hours. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-105-04.R01 | `hours.set_windows` is a replace-all command with `expected_revision` and `idempotency_key`. | MVP |
| PS-105-04.R02 | `hours.evaluate` is internal (`sys_`) and returns a decision without content; p95 ≤ 5 ms. | MVP |
| PS-105-04.R03 | Events carry `dwn_id`, revision, counts and decision codes only. No weekday, time or zone values. | MVP |
| PS-105-04.R04 | No public or cross-account query for windows exists. | MVP |

## Data / schema
**Commands**

| Command | Actor | Idempotency key | expected_revision | Errors |
|---|---|---|---|---|
| `hours.set_windows` | user (self) | client key, ≤ 64 chars | required | HOURS.TZ_UNKNOWN, HOURS.WEEKDAY_INVALID, HOURS.TIME_RANGE_INVALID, HOURS.WINDOW_LIMIT, SYS.CONFLICT |
| `hours.evaluate` | sys (dispatcher) | `ntf_id` + window revision | n/a | SYS.FORBIDDEN |

**Queries**: `hours.get_windows` (self only; returns current set and revision).

**Events**

| event_type | aggregate_type | max_data_class |
|---|---|---|
| delivery_window.updated | delivery_window | PRIVATE_PERSONAL |
| notification.window_deferred | notification | PSEUDONYMOUS |
| notification.window_dropped | notification | PSEUDONYMOUS |
| notification.window_released | notification | PSEUDONYMOUS |

Event payload example: `{"ntf_id":"ntf_…","defer_until_bucket":"hour","reason_code":"OUTSIDE_WINDOW"}`. `defer_until` is bucketed to the hour to limit schedule inference.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Duplicate `set_windows` with same key and digest returns original revision. See failure_recovery_idempotency.

## Privacy, retention, abuse
Events are PSEUDONYMOUS only by bucketing and omission; this avoids leaking schedule via the event bus.

## Observability & budgets
Command p95 ≤ 200 ms; evaluate p95 ≤ 5 ms.

## Tests
- TEST-PS-105-04-01 (contract): event schemas reject any field named `weekdays`, `start_min`, `end_min` or `tz`.
- TEST-PS-105-04-02 (integration): replay of `set_windows` returns same revision.
- TEST-PS-105-04-03 (integration): `hours.evaluate` from non-sys principal returns SYS.FORBIDDEN.
- TEST-PS-105-04-04 (contract): `defer_until` appears only in hour-bucket form.

## Acceptance criteria
1. Five events and two commands implemented per table.
2. Schedule content absent from event bus traces (scan).
3. Evaluate budget met in load test (to be run).

## Assumptions & open decisions
- ASSUMPTION: hour bucketing of `defer_until`.
- Prefix `dwn_` PENDING CTR-ID-001.
