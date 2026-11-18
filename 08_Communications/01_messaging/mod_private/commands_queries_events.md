# PS-060-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_private. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, envelope), CTR-ERR-001, CTR-SCH-001, CTR-CAP-001 (`message.*`, `thread.*`), CTR-ID-001, CTR-PRV-001 (R10 previews).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-060-04.R01 | Every write carries `idempotency_key` (26-char ULID); thread writes carry `expected_revision`. | MVP |
| PS-060-04.R02 | `SendMessage` p95 ≤ 300 ms server-side; response returns `msg_id` and `revision`. | MVP |
| PS-060-04.R03 | Event payloads carry IDs, states and revisions; never body text, sender names or previews. | MVP |
| PS-060-04.R04 | Push payload is generic text ("New message"); body only if the device opted in (CTR-PRV-001 R10). | MVP |
| PS-060-04.R05 | Query `ListThreads` (paged, 20 per page) and `ListMessages` (cursor, 50 per page) return participant-visible data only. | MVP |
| PS-060-04.R06 | Schema IDs `messaging.thread_opened`, `messaging.message_sent`, `messaging.thread_blocked`, `messaging.message_deleted` at 1.0.0. | MVP |
| PS-060-04.R07 | Typing indicators and presence. | Future (excluded for metadata reasons; re-open only with D05/D10 decisions) |

## Data / schema
| Command | Payload | Error codes |
|---|---|---|
| `RequestContact` | `recipient_prf_id`, `idempotency_key` | `NOT_ELIGIBLE`, `CONTACT_LIMIT`, `RATE_LIMITED` |
| `AcceptContact` | `thread_id`, `expected_revision` | `NOT_ELIGIBLE`, `THREAD_CLOSED` |
| `StartThread` | `counterparty_prf_id` | `NOT_ELIGIBLE` |
| `SendMessage` | `thread_id`, `body`, `attachment_ids?`, `idempotency_key` | `BODY_*`, `THREAD_CLOSED`, `NOT_ELIGIBLE`, `RATE_LIMITED`, `ATTACH.NOT_AVAILABLE` |
| `MarkRead` | `thread_id`, `msg_id` | `SYS.NOT_FOUND` |
| `DeleteForMe` / `DeleteForAll` | `msg_id`, `expected_revision` | `DELETE_WINDOW_CLOSED` |
| `CloseThread` / `Block` | `thread_id`, `expected_revision` | `SYS.NOT_FOUND` |

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Participant actions only (PS-060-05).

## Failure, idempotency, concurrency, offline
- Duplicate send with same key returns original message; different body with same key → `EVT.IDEMPOTENCY_KEY_REUSED`.
- Offline sends queued (D08 PROVISIONAL), ordered per thread; attachments must be `available` before send.

## Privacy, retention, abuse
Events carry no sender identity beyond `prf_` of the participant pair and no body. `actor_ref` is `acc_` in audit only.

## Observability & budgets
`privmsg_cmd_total{command,result}`; no thread or message IDs as labels.

## Tests
- TEST-PS-060-04-01 (contract): payloads validate.
- TEST-PS-060-04-02 (integration): duplicate send returns same `msg_id`; one event.
- TEST-PS-060-04-03 (contract): event lint: no body, no sender name.
- TEST-PS-060-04-04 (contract): push payload contains only generic text by default.

## Acceptance criteria
1. Commands, queries and events implemented as listed.
2. Idempotency verified.
3. Event and push payloads contain no content.
4. Pagination limits enforced.

## Assumptions & open decisions
- ASSUMPTION: `aggregate_type = thread` and `message` registered in CTR-SCH-001.
- PROVISIONAL (D08 default, unapproved): offline queue.
