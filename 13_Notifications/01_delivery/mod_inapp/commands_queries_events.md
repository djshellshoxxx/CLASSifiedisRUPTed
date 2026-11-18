# PS-103-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_inapp. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-103-04.R01 | Producer command `ntf.create` (sys_ only) is idempotent on (recipient, template, source). | MVP |
| PS-103-04.R02 | Recipient commands `inbox.mark_read`, `inbox.dismiss` require `op_id` (client operation ID, ULID) for idempotency. | MVP |
| PS-103-04.R03 | `inbox.list` and `inbox.sync` return at most 50 items per page; sync returns items with `inbox_revision` greater than the cursor. | MVP |
| PS-103-04.R04 | Events are `ntf.<past-tense verb>` (CTR-EVT-001 R10); payloads carry IDs and states only, never `params`. | MVP |
| PS-103-04.R05 | p95 latency: `inbox.list` ≤ 200 ms, `inbox.sync` ≤ 300 ms, `mark_read` ≤ 150 ms. | MVP |

## Data / schema
| Command / query | Body or params | Result / event |
|---|---|---|
| `ntf.create` (sys_) | `recipient_ref`, `template_key`, `params`, `source_ref` | `ntf.queued` or `ntf.suppressed` |
| `inbox.list` (acc_) | `limit ≤ 50`, `cursor?` | page of items (template key, params, state, timestamps) |
| `inbox.sync` (acc_) | `since_revision` | changed items and `next_revision` |
| `inbox.mark_read` (acc_) | `ntf_ids[]` (≤ 50), `op_id` | `ntf.read` per item |
| `inbox.mark_all_read` (acc_) | `op_id`, `up_to_revision` | `ntf.read` per item |
| `inbox.dismiss` (acc_) | `ntf_id`, `op_id` | `ntf.dismissed` |
| `ntf.deliver` (internal, push-ack or sync) | `ntf_id` | `ntf.delivered` |

## Commands / queries / events
Example:
```http
POST /v1/inbox/mark-read
Idempotency-Key: 0190f6a0-3d4e-7f5a-9b6c-8d7e6f5a4b3c

{"ntf_ids": ["ntf_01JA40...", "ntf_01JA41..."], "op_id": "01JA42..."}

200 {"updated": 2, "unread_count": 5, "inbox_revision": 118}
```
Payload of `ntf.read`: `ntf_id`, `recipient_ref`, `inbox_revision`. `max_data_class` = PSEUDONYMOUS.

## States & transitions
Event per transition in [PS-103-03](workflow_state_machine.md).

## Validation & errors
Codes in [PS-103-02](validation_rules.md).

## Authorization
Capabilities in [PS-103-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Retry and offline operation IDs per [PS-103-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Events never contain `params`. Push previews are a separate channel (`mod_push`) and are governed by CTR-PRV-001 R10.

## Observability & budgets
Span `inapp.<command>` with `request_id`, code, duration, page size.

## Tests
- `TEST-PS-103-04-01` contract: schemas validate; event payloads contain no `params`.
- `TEST-PS-103-04-02` integration: `mark_read` with same `op_id` returns same result.
- `TEST-PS-103-04-03` integration: `inbox.sync` returns only items above `since_revision`.
- `TEST-PS-103-04-04` latency: list, sync, mark_read p95 budgets met under load.

## Acceptance criteria
1. Every command and event documented with idempotency and errors.
2. Paging limits enforced (50).
3. No event or response from event stream includes params beyond the recipient's own list.

## Assumptions & open decisions
- ASSUMPTION: `mark_all_read` uses revision bound to avoid marking items that arrived after the user's view.
- D01 (federated protocol), PROVISIONAL default: in-app notifications are never federated (unapproved).
