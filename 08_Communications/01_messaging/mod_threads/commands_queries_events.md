# PS-061-04 — commands queries events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_threads. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001, CTR-ID-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-061-04.R01 | Every state-changing command takes `idempotency_key` (16–128 chars) and `expected_revision` (null for create). | MVP |
| PS-061-04.R02 | Command schema version `1.0.0`; a MINOR-newer request with unknown optional fields is accepted and the fields ignored. | MVP |
| PS-061-04.R03 | List queries return at most 50 items with opaque cursors; no offset parameters (CTR-ID-001 R06). | MVP |
| PS-061-04.R04 | Each command emits exactly the events listed below, all with one `correlation_id`. | MVP |

## Data / schema
Command envelopes (JSON, abbreviated):
```json
{"cmd":"msg.send","args":{"thread_id":"thr_…","body_text":"…","attachment_ids":["att_…"],"supersedes_id":null},"expected_revision":4,"idempotency_key":"…"}
{"cmd":"att.init","args":{"mime":"image/jpeg","size_bytes":240113,"sha256":"…"},"idempotency_key":"…"}
{"cmd":"att.complete","args":{"attachment_id":"att_…"},"idempotency_key":"…"}
```
Response on success: `{"message_id":"msg_…","revision":5,"recorded_at":"…"}`.

## Commands / queries / events
| Command | Events emitted | Idempotent | Errors (see PS-061-02) |
|---|---|---|---|
| thr.open (args: counterparty `acc_`, context) | thread.opened | yes | SEND_NOT_PERMITTED, SYS.NOT_FOUND |
| msg.send | message.sent | yes | BODY_INVALID, THREAD_NOT_OPEN, ATTACHMENT_*, FIRST_CONTACT_LIMIT, EVT.REVISION_CONFLICT |
| msg.redact (`msg_`) | message.redacted | yes | THREAD_NOT_OPEN, SYS.FORBIDDEN |
| att.init | none (pending row) | yes | ATTACHMENT_TOO_LARGE, ATTACHMENT_TYPE_MISMATCH |
| att.complete | attachment.stored or attachment.rejected | yes | ATTACHMENT_TYPE_MISMATCH |
| thr.archive | thread.archived | yes | THREAD_NOT_OPEN |
| thr.lock (system or case-scoped mod) | thread.locked | yes | SYS.FORBIDDEN |
| thr.unlock | thread.unlocked | yes | SYS.FORBIDDEN |

Queries: `thr.list(cursor, limit ≤ 50)`; `msg.page(thread_id, before_revision, limit ≤ 50)`. Queries emit no events.

Event type regex follows CTR-EVT-001 R10. `max_data_class`: `PRIVATE_PERSONAL` for `message.*` and `attachment.*`; `PSEUDONYMOUS` for `thread.*`. Payloads carry IDs, revisions and digests only, never `body_text`.

## States & transitions
Command-to-transition mapping is in [PS-061-03](workflow_state_machine.md).

## Validation & errors
Validation order: schema → participant → state → content → rate limit. See [PS-061-02](validation_rules.md).

## Authorization
Per command in [PS-061-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope and replay rules per CTR-EVT-001 R03. Replay after 7 days returns `EVT.IDEMPOTENCY_KEY_REUSED` only if the digest differs.

## Privacy, retention, abuse
Payloads exclude body text (above). Event subscribers receive `message.sent` with `message_id` and `revision` only; they fetch content through an authorized query.

## Observability & budgets
Per-command metrics: `threads_command_total{cmd,outcome}`, latency histogram per command.

## Tests
- TEST-PS-061-04-01 (contract): each command's request and response match the JSON shapes above (schema validation in CI).
- TEST-PS-061-04-02 (contract): event payloads contain no `body_text` field (grep-based check plus schema).
- TEST-PS-061-04-03 (integration): duplicate `msg.send` with same key returns the original `message_id` and creates no second event.

## Acceptance criteria
1. All command, query and event rows are covered by contract tests.
2. No event payload includes message content (TEST-PS-061-04-02).

## Assumptions & open decisions
- ASSUMPTION: list page size 50; cursor is an opaque HMAC-signed token.
- PENDING CTR-SCH-001 registration of `thread.v1`, `message.v1`, `attachment.v1` (owner F15 for registry).
