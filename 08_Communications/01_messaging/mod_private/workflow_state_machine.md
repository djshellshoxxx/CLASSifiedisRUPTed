# PS-060-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_private. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision, envelope), CTR-CAP-001 (R05 relation rules), CTR-ERR-001, CTR-PRV-001 (RET-PRIV).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-060-03.R01 | Thread states: `requested` (contact pending), `open`, `closed` (by a participant), `blocked` (by a participant), `archived` (retention). | MVP |
| PS-060-03.R02 | Eligibility for a new thread: a relation exists between the pair (open or closed ≤ 30 days ago exchange in F02–F05, or accepted contact request). | MVP |
| PS-060-03.R03 | Message states: `queued` (sender device), `sent` (server committed), `delivered` (relay to recipient device), `read` (only if recipient opted in), `deleted_for_all`, `purged`. | MVP |
| PS-060-03.R04 | Delete-for-all allowed to sender within 24 h of `sent`; after that only delete-for-me. | MVP |
| PS-060-03.R05 | Block is one-way per participant, immediate, and stops new messages in both directions for that pair. | MVP |
| PS-060-03.R06 | Read receipts disabled by default; enabling is per account and per thread. | MVP |

## Data / schema
`thread_state` enum closed: `requested`, `open`, `closed`, `blocked`, `archived`. `message_state` enum closed: `queued`, `sent`, `delivered`, `read`, `deleted_for_all`, `purged`.

## Commands / queries / events
`RequestContact`, `AcceptContact`, `StartThread`, `SendMessage`, `MarkRead`, `DeleteForMe`, `DeleteForAll`, `CloseThread`, `Block`; events `messaging.thread_opened`, `messaging.message_sent`, `messaging.thread_blocked`, `messaging.message_deleted`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `RequestContact` | R02 false; rate ok | thread `requested` | notify recipient generically |
| `requested` | `AcceptContact` | recipient is requested party | `open` | event `thread_opened` |
| `requested` | `Block` | — | `blocked` | sender notified nothing |
| (none) | `StartThread` | R02 true | `open` | event `thread_opened` |
| `open` | `CloseThread` | participant | `closed` | sends rejected; history kept |
| `open` / `closed` | `Block` | — | `blocked` | both directions stop |
| `open` | `DeleteForAll` | sender, ≤ 24 h | message `deleted_for_all` | attachments purged (mod_attachments) |
| any | retention | RET-PRIV | `archived` → purge | bodies removed |

## Validation & errors
Codes in [validation_rules.md](validation_rules.md); `PRIVMSG.THREAD_CLOSED` (false), `PRIVMSG.DELETE_WINDOW_CLOSED` (false).

## Authorization
Transitions by participants (own actions) and `sys_` for retention and relation changes (PS-060-05).

## Failure, idempotency, concurrency, offline
- Sends: client key per message; duplicate returns original `msg_id`.
- Block racing with send: block wins; the send returns `PRIVMSG.NOT_ELIGIBLE`.
- Relation loss (exchange cancelled after thread opened) does not close thread; eligibility is checked only for new threads and contact requests.

## Privacy, retention, abuse
Blocks stored as owner-only rows (RET-ACC). Message bodies purged at RET-PRIV; deletion-for-all removes body for both sides at next sync (ASSUMPTION: within 24 h).

## Observability & budgets
`privmsg_transition_total{from,to}`; delivery lag p95 ≤ 3 s online.

## Tests
- TEST-PS-060-03-01 (unit): transition table complete.
- TEST-PS-060-03-02 (integration): delete-for-all after 24 h rejected.
- TEST-PS-060-03-03 (concurrency): block vs send race.
- TEST-PS-060-03-04 (integration): exchange cancellation keeps existing thread open.

## Acceptance criteria
1. Only listed transitions occur.
2. Block is immediate and bidirectional.
3. Delete-for-all window enforced.
4. Read receipts off by default.

## Assumptions & open decisions
- ASSUMPTION: 30-day post-exchange eligibility window.
- ASSUMPTION: contact request acceptance is explicit; no implicit acceptance.
- PROVISIONAL (D08 default, unapproved): offline queue until relay acknowledgment.
