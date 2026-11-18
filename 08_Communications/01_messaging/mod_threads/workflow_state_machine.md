# PS-061-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_threads. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision, envelope), CTR-CAP-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-061-03.R01 | Thread states: `open`, `archived`, `locked`. Initial state `open`. | MVP |
| PS-061-03.R02 | `archived` is set by a participant or by context closure; it blocks new messages but keeps read access. | MVP |
| PS-061-03.R03 | `locked` is set only by a dispute hold (`dsp_`) or a moderation case (`cas_`); it blocks sends and redactions for both parties. | MVP |
| PS-061-03.R04 | Message states: `sent`, `redacted`. Terminal for `redacted`. | MVP |
| PS-061-03.R05 | Client-side `pending_local` exists only on the device (D08) and is never a server state. | MVP |
| PS-061-03.R06 | Every transition appends one event with a new `revision` (CTR-EVT-001 R02). | MVP |

## Data / schema
State is stored on the thread and message records in [PS-061-01](domain_schema.md). No separate state table.

## Commands / queries / events
Transitions are triggered by commands in [PS-061-04](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | thread.opened | 2 distinct participants; not blocked (PS-061-02 R05) | open | notify counterparty (generic) |
| open | thread.archived | participant request, or context closed | archived | none |
| archived | thread.unarchived | participant request; not locked | open | none |
| open, archived | thread.locked | `dsp_` open or `cas_` decision with `case` scope | locked | notify both (generic) |
| locked | thread.unlocked | hold released or case closed | prior state (open or archived) | none |
| sent | message.redacted | author, or case-scoped moderator; thread not locked by hold for author | redacted | body nulled; digest retained |
| open | message.sent | participant; thread open | open | notify counterparty (generic) |

Forbidden transitions return `THREADS.THREAD_NOT_OPEN`. `redacted` → `sent` is forbidden.

## Validation & errors
State guards return codes from [PS-061-02](validation_rules.md).

## Authorization
Actor per transition as in [PS-061-05](authorization_capabilities.md). `thread.locked` by system principal `sys_` for dispute holds only.

## Failure, idempotency, concurrency, offline
Each transition is conditional on `expected_revision`. Concurrent archive and send: second writer receives `EVT.REVISION_CONFLICT` and must re-read. Lock wins over in-flight sends: a send committed after lock is rejected at commit.

## Privacy, retention, abuse
Lock and unlock events carry IDs only. Redaction keeps the envelope and a body digest so hold evidence remains verifiable (CTR-PRV-001 R12).

## Observability & budgets
Metric `threads_transition_total{from,event,to}`. Alert on any `locked` → `open` without a matching `dsp_` or `cas_` closure.

## Tests
- TEST-PS-061-03-01 (unit): every row of the table; every other pair returns `THREADS.THREAD_NOT_OPEN` or `EVT.REVISION_CONFLICT`.
- TEST-PS-061-03-02 (integration): concurrent send and lock; exactly one commits; no message commits after lock.
- TEST-PS-061-03-03 (property): revision sequence has no gaps for any thread across 10,000 random transitions.

## Acceptance criteria
1. Transition table matches implementation (TEST-PS-061-03-01).
2. No send commits to a `locked` thread (TEST-PS-061-03-02).

## Assumptions & open decisions
- ASSUMPTION: `archived` threads remain readable for the retention period in PS-061-07.
- OPEN: whether an archived thread can be reopened after 90 days (default: no; new thread required).
