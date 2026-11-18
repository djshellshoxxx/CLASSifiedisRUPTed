# PS-064-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_coordination. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001, CTR-SCH-001, CTR-CAP-001 (`meetup.*`), CTR-PRV-001 (LOCATION_PRECISE rules), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-064-04.R01 | All writes carry `idempotency_key` and `expected_revision` (except propose). | MVP |
| PS-064-04.R02 | `ShareMeetupPoint` requires TLS and returns no point in its response. | MVP |
| PS-064-04.R03 | Events never carry `place_text`, coordinates or venue details beyond `venue_ref`. | MVP |
| PS-064-04.R04 | `GetMeetup` returns full details to participants only; a point is returned only to the grantee within the disclosure window. | MVP |
| PS-064-04.R05 | Schema IDs for the seven `meetup.*` events at 1.0.0. | MVP |
| PS-064-04.R06 | Calendar export (ICS) of meetup windows without place. | Future |

## Data / schema
| Command | Payload | Error codes |
|---|---|---|
| `ProposeMeetup` | `thread_id`, `exchange_ref`, `window_start`, `window_end`, `venue_ref?` or `place_text?`, `idempotency_key` | `WINDOW_*`, `VENUE_NOT_LISTED`, `PLACE_*`, `NOT_ELIGIBLE` (from mod_private relation) |
| `AcceptMeetup` / `CancelMeetup` / `ConfirmCompleted` | `meetup_id`, `expected_revision` | `STATE_INVALID`, `SYS.NOT_FOUND` |
| `ProposeReschedule` | `meetup_id`, new window, `expected_revision` | `WINDOW_*`, `RESCHEDULE_LIMIT`, `STATE_INVALID` |
| `ReportNoShow` | `meetup_id` | `STATE_INVALID` |
| `ShareMeetupPoint` | `meetup_id`, `point` | `POINT_INVALID`, `STATE_INVALID` |
| `RevokeMeetupPoint` | `meetup_id` | `SYS.NOT_FOUND` |

Queries: `GetMeetup(meetup_id)`; `ListMeetupsForThread(thread_id)`.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Duplicate proposals with same key return the same `meetup_id`. Point sharing offline is not queued (sensitive; must be online) — ASSUMPTION.

## Privacy, retention, abuse
Events carry IDs and states only. Point sharing never logged.

## Observability & budgets
`coord_cmd_total{command,result}`; no meetup or venue IDs as labels.

## Tests
- TEST-PS-064-04-01 (contract): payloads validate.
- TEST-PS-064-04-02 (integration): duplicate propose returns same ID.
- TEST-PS-064-04-03 (contract): event lint finds no place text or coordinates.
- TEST-PS-064-04-04 (negative): non-grantee `GetMeetup` returns no point field (absent).

## Acceptance criteria
1. Commands, queries and events implemented as listed.
2. Idempotency verified.
3. No point or place text in events or responses to non-grantees.
4. Event lint passes.

## Assumptions & open decisions
- ASSUMPTION: `aggregate_type = meetup` registered in CTR-SCH-001 once prefix assigned.
- PROVISIONAL (D08 default, unapproved): point sharing requires online connection, which is stricter than the default queue.
