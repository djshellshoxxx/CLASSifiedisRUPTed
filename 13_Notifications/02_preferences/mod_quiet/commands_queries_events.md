# PS-108-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_quiet. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-108-04.R01 | `quiet.start` replaces any active period; uses `expected_revision` and `idempotency_key`. | MVP |
| PS-108-04.R02 | `quiet.resume` is idempotent. | MVP |
| PS-108-04.R03 | Events carry IDs, preset enum and absolute times only (no zone, no content). | MVP |
| PS-108-04.R04 | `quiet.get_status` p95 ≤ 50 ms and returns `ends_at` and remaining seconds. | MVP |

## Data / schema
**Commands**

| Command | Actor | Idempotency key | expected_revision | Errors |
|---|---|---|---|---|
| `quiet.start` | user (self) | client key | null if none active, else required | QUIET.PRESET_UNKNOWN, QUIET.UNTIL_INVALID, QUIET.DURATION_TOO_LONG, QUIET.ZONE_REQUIRED, SYS.CONFLICT |
| `quiet.resume` | user (self) | client key | n/a | SYS.NOT_FOUND |

**Queries**: `quiet.get_status` (self).

**Events**

| event_type | aggregate_type | max_data_class |
|---|---|---|
| quiet_period.started | quiet_period | PRIVATE_PERSONAL |
| quiet_period.extended | quiet_period | PRIVATE_PERSONAL |
| quiet_period.ended | quiet_period | PRIVATE_PERSONAL |
| notification.quiet_held | notification | PSEUDONYMOUS |


## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Replay safe. Start offline queued per D08 PROVISIONAL; server time governs `ends_at`.

## Privacy, retention, abuse
Events are internal; they are not sent to other accounts or providers.

## Observability & budgets
Command p95 ≤ 150 ms.

## Tests
- TEST-PS-108-04-01 (contract): event schemas reject zone and content fields.
- TEST-PS-108-04-02 (integration): `quiet.start` replay returns same `qpd_id`.
- TEST-PS-108-04-03 (integration): `quiet.get_status` of another account returns NOT_FOUND.
- TEST-PS-108-04-04 (contract): `notification.quiet_held` class is PSEUDONYMOUS.

## Acceptance criteria
1. Commands, queries and events match tables.
2. No content in events.
3. Replay yields one event set.

## Assumptions & open decisions
- ASSUMPTION: `quiet.start` replacing semantics.
- Prefix `qpd_` PENDING CTR-ID-001.
