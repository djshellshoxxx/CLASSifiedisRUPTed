# PS-105-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_hours. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-PRV-001, CTR-SCH-001. Prefix `dwn_` is PENDING CTR-ID-001 registration.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-105-01.R01 | Delivery windows are recurring weekly rules in the account's local time zone (IANA name from profile). | MVP |
| PS-105-01.R02 | Max 14 windows per account per channel (`push`, `email`, `inapp`). | MVP |
| PS-105-01.R03 | A window stores weekday set (1–7), start and end as minutes from local midnight (0–1440, 15-minute steps), and `crosses_midnight` derived. Zero-length windows are invalid. | MVP |
| PS-105-01.R04 | Zone is never derived from IP address or precise location (D05 PROVISIONAL). | MVP |
| PS-105-01.R05 | Windows are PRIVATE_PERSONAL data; they never appear in events, metrics or provider payloads. | MVP |
| PS-105-01.R06 | "No windows configured" means no restriction (ASSUMPTION). | MVP |

## Data / schema
```json
delivery_window  (dwn_, class ulid, PENDING CTR-ID-001)
{
  "dwn_id": "dwn_<26>", "account_id": "acc_<26>", "channel": "push|email|inapp",
  "weekdays": [1,2,3,4,5], "start_min": 480, "end_min": 1320,
  "tz": "Europe/Berlin", "revision": 3, "updated_at": "<RFC 3339>", "schema_version": "1.0.0"
}
```
Constraints: `start_min` < `end_min` after midnight normalization; `weekdays` unique and non-empty; `tz` must be in the pinned tzdata set (validation_rules); unique (`account_id`, `channel`, `weekdays`, `start_min`).

Derived, not stored: `window_decision` (`deliver`, `defer_until`, `drop`) per `ntf_` evaluation.

Provenance: rows are written only by the owning account; `sys_` reads them through the gating path.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Replace-all writes use `expected_revision`. See [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Windows reveal sleep and work patterns. Retention per [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Count-only metrics. See [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-105-01-01 (unit): window with `start_min` = `end_min` is rejected.
- TEST-PS-105-01-02 (unit): window 22:00–02:00 is stored with `crosses_midnight`=true and evaluates correctly on both sides.
- TEST-PS-105-01-03 (property): 15 windows on one channel are rejected.
- TEST-PS-105-01-04 (contract): no event schema contains `weekdays`, `start_min` or `end_min`.

## Acceptance criteria
1. Schema validates for every row type in the example set.
2. Window content absent from all events and logs (automated scan).
3. Derived decisions reproducible from stored rows and pinned tzdata version.

## Assumptions & open decisions
- ASSUMPTION: 15-minute granularity and 14-window cap.
- D05 PROVISIONAL (D05 default, unapproved): zone is user-chosen, not inferred.
- Retention: D07 default, PROVISIONAL (D07 default, unapproved).
