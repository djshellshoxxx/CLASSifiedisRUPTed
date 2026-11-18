# PS-064-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_coordination. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-CAP-001 (R05), CTR-ERR-001, CTR-PRV-001 (RET-LOC).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-064-03.R01 | States: `proposed`, `agreed`, `cancelled`, `expired`, `completed`, `no_show_reported`, `disputed`. | MVP |
| PS-064-03.R02 | Either participant may reschedule up to 3 times; each proposal requires counterparty acceptance. | MVP |
| PS-064-03.R03 | `completed` is recorded only by mutual confirmation or 2 h after window end without an objection. | MVP |
| PS-064-03.R04 | A no-show report is recorded as a neutral event; it does not change exchange state by itself and is not an input to reputation without F12 review. | MVP |
| PS-064-03.R05 | Precise point disclosure is valid only in `agreed` and expires at the earlier of meetup `window_end + 2 h` or 24 h after disclosure. | MVP |
| PS-064-03.R06 | Cancellation at any time before `completed` is allowed for either party; cancellation within 2 h of window start is recorded with timing flag. | MVP |

## Data / schema
`meetup_state` enum closed: `proposed`, `agreed`, `cancelled`, `expired`, `completed`, `no_show_reported`, `disputed`.

## Commands / queries / events
`ProposeMeetup`, `AcceptMeetup`, `ProposeReschedule`, `AcceptReschedule`, `CancelMeetup`, `ConfirmCompleted`, `ReportNoShow`, `ShareMeetupPoint`, `RevokeMeetupPoint`; events `meetup.proposed`, `meetup.agreed`, `meetup.cancelled`, `meetup.completed`, `meetup.no_show_reported`, `meetup.point_disclosed`, `meetup.point_expired`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `ProposeMeetup` | PS-064-02 passes; thread participant | `proposed` | event `meetup.proposed` |
| `proposed` | `AcceptMeetup` | counterparty only | `agreed` | event `meetup.agreed` |
| `proposed` / `agreed` | `CancelMeetup` | participant | `cancelled` | disclosures revoked |
| `agreed` | `ProposeReschedule` | count < 3 | `proposed` (new window) | prior window kept as history |
| `agreed` | `ConfirmCompleted` | both confirm, or 2 h after end with no objection | `completed` | event `meetup.completed` |
| `agreed` | `ReportNoShow` | after window_start + 15 min | `no_show_reported` | neutral event |
| `no_show_reported` | objection within 24 h | — | `disputed` | F12 review opened |
| `agreed` | timeout | no proposal and window_end passed | `expired` | disclosures expired |

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `COORD.STATE_INVALID` | false | `err.coord.state_invalid` |
| `COORD.RESCHEDULE_LIMIT` | false | `err.coord.reschedule_limit` |
| `COORD.DISCLOSURE_EXPIRED` | false | `err.coord.disclosure_expired` |

## Authorization
Participants only for their own actions; `sys_` for timeouts and expiries (PS-064-05).

## Failure, idempotency, concurrency, offline
- Compare-and-set on revision for every transition.
- Concurrent accept and cancel: first committed wins.
- Timeouts idempotent per meetup and window.

## Privacy, retention, abuse
Point disclosure and place text removed at RET-LOC. No-show reports are PSEUDONYMOUS events with no location.

## Observability & budgets
`coord_transition_total{from,to}`; expiry job lag ≤ 5 min.

## Tests
- TEST-PS-064-03-01 (unit): transition table complete.
- TEST-PS-064-03-02 (integration): reschedule limit at 3.
- TEST-PS-064-03-03 (integration): point disclosure expires at min(end + 2 h, 24 h).
- TEST-PS-064-03-04 (concurrency): accept vs cancel race.

## Acceptance criteria
1. Only listed transitions occur.
2. Disclosure expiry matches rule within 5 min.
3. No-show reports do not change exchange state.
4. Reschedule count enforced.

## Assumptions & open decisions
- ASSUMPTION: 2 h post-window completion default; 15 min no-show threshold; 24 h objection window.
