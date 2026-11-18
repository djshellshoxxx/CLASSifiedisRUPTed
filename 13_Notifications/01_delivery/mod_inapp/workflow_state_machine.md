# PS-103-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_inapp. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R08), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-103-03.R01 | Only the transitions in the table are reachable. Others → `INAPP.STATE_NOT_ALLOWED`. | MVP |
| PS-103-03.R02 | Delivery to the inbox is visible to the recipient's sync within 2 s of creation (p95, ASSUMPTION). | MVP |
| PS-103-03.R03 | `read` and `dismissed` are recipient-driven and monotonic: `dismissed` is terminal; `read` never reverts to unread. | MVP |
| PS-103-03.R04 | A suppressed notification (preference or block) is recorded but never becomes visible. | MVP |
| PS-103-03.R05 | Undelivered items expire after 30 days; delivered items expire after 90 days (D07 PROVISIONAL). | MVP |

## Data / schema
States: `suppressed`, `queued`, `delivered`, `read`, `dismissed`, `expired`. Stored in `ntf_inapp.inbox_state`.

## Commands / queries / events
See [PS-103-04](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `ntf.suppressed` | recipient preference off for template, or sender blocked (user-to-user templates) | suppressed | none visible |
| (none) | `ntf.queued` | not suppressed; dedupe key new | queued | inbox revision +1 |
| queued | `ntf.delivered` | recipient inbox sync or push-ack received | delivered | `delivered_at` set; visible in inbox |
| queued | `ntf.expired` | 30 days elapsed | expired | removed from queue |
| delivered | `ntf.read` | recipient marks read (or opens) | read | `read_at` set; unread count −1 |
| delivered, read | `ntf.dismissed` | recipient dismisses | dismissed | `dismissed_at` set; hidden from list |
| delivered, read, dismissed | `ntf.expired` | 90 days elapsed | expired | content params cleared; row kept as ID and codes |

`ntf.read` on an already read item is a no-op returning the same state (idempotent).

## Validation & errors
Invalid transitions → `INAPP.STATE_NOT_ALLOWED`.

## Authorization
Only the recipient transitions `read` and `dismissed`. Producers create `queued` or `suppressed` items only.

## Failure, idempotency, concurrency, offline
Concurrent read and dismiss: `dismissed` wins over `read` (monotonic rule). Offline transitions are queued per D08.

## Privacy, retention, abuse
On `expired` after 90 days, `params` is cleared so that archived rows carry no content.

## Observability & budgets
`inapp_transition_total{from,to}`; `inapp_queue_to_delivery_seconds` histogram.

## Tests
- `TEST-PS-103-03-01` unit: exhaustive state × event matrix.
- `TEST-PS-103-03-02` property: `dismissed` is terminal; `read` never reverts.
- `TEST-PS-103-03-03` integration: blocked sender's user-to-user notification is `suppressed` and not visible.
- `TEST-PS-103-03-04` integration: 30-day queued expiry removes the item and clears queue entry.

## Acceptance criteria
1. Table is the sole source of transitions.
2. Suppressed items are never visible in any API response (test corpus).
3. Delivery latency budget met in staging.

## Assumptions & open decisions
- ASSUMPTION: 30-day and 90-day windows are defaults for Platform and F10 review.
- D08 (PWA offline writes), PROVISIONAL default: read and dismiss are queued locally until relay acknowledgement (unapproved).
