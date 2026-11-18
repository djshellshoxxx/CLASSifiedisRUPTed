# PS-104-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_push. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-104-03.R01 | A subscription is `active`, `expired` or `revoked`. `expired` and `revoked` are terminal; re-subscribing creates a new `psb_`. | MVP |
| PS-104-03.R02 | An attempt is `queued`, `retry_scheduled`, `sent`, `failed` or `expired`. `sent`, `failed` and `expired` are terminal. | MVP |
| PS-104-03.R03 | An attempt is retried at most 4 times after the first (5 total) and never after its TTL. | MVP |
| PS-104-03.R04 | A subscription with no provider success for 30 consecutive days moves to `expired` (ASSUMPTION). | MVP |
| PS-104-03.R05 | Every transition emits exactly one event (see commands_queries_events). | MVP |

## Data / schema
Transition guards read `push_subscription.status`, `consecutive_failures` and `push_attempt.attempt_no`. State is stored on the row; no derived state is persisted.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `push.register_subscription` accepted | validation passes, count < 10 | subscription `active` | emit `push_subscription.registered` |
| active | provider 201 | none | active | `last_success_at` set, `consecutive_failures`=0 |
| active | provider 404 or 410 | none | `expired` | emit `push_subscription.expired`; stop sending |
| active | provider 5xx, 429 or timeout | `consecutive_failures` < 10 | active | increment failures; attempt goes to retry_scheduled |
| active | 30 days without success | R04 | `expired` | emit `push_subscription.expired` |
| active | `push.revoke_subscription` or device revoked | caller authorized | `revoked` | emit `push_subscription.revoked`; cancel queued attempts |
| queued | dispatch sends | subscription active | sent | emit `notification.push_accepted` |
| queued | dispatch sends, provider 4xx other than 404/410/429 | none | failed | emit `notification.push_failed` (`PUSH.PROVIDER_REJECTED`) |
| queued | dispatch sends, retryable failure | attempt_no < 5 and TTL not elapsed | retry_scheduled | schedule per failure_recovery policy |
| retry_scheduled | timer fires | subscription active, TTL not elapsed | queued | attempt_no+1 |
| queued or retry_scheduled | TTL elapsed or attempt_no = 5 | none | expired | emit `notification.push_failed` (`PUSH.TTL_ELAPSED`) |
| queued or retry_scheduled | subscription becomes expired or revoked | none | expired | emit `notification.push_failed` (`PUSH.SUBSCRIPTION_INACTIVE`) |

Concurrent transitions on one subscription are serialized by `revision` (CTR-EVT-001 R02).

## Validation & errors
Invalid transitions return `PUSH.INVALID_STATE_TRANSITION` (non-retryable). Those are never silent.

## Authorization
Only the owning account or `sys_` dispatcher may cause transitions; see authorization_capabilities.

## Failure, idempotency, concurrency, offline
Timers are durable. A crash mid-transition is recovered by replaying from the last committed revision. Details in failure_recovery_idempotency.

## Privacy, retention, abuse
Transitions record state and codes only. Expired attempts are purged per RET-OPS (30 days).

## Observability & budgets
Gauge `push_subscriptions{status}`; counter `push_transitions_total{from,to}`. Budget: transition commit p95 ≤ 50 ms.

## Tests
- TEST-PS-104-03-01 (unit): each row in the transition table is covered by one test.
- TEST-PS-104-03-02 (property): no sequence of events takes an attempt past attempt_no 5 or past TTL into `sent`.
- TEST-PS-104-03-03 (integration): HTTP 410 sets subscription `expired` and sends no further attempts for that subscription.
- TEST-PS-104-03-04 (integration): revocation cancels all queued attempts for that subscription.

## Acceptance criteria
1. Every transition has an event type and a test.
2. No terminal state has an outgoing transition in code.
3. Revocation takes effect within 60 s in integration environment.

## Assumptions & open decisions
- ASSUMPTION: 10 consecutive failures before expiry; 30-day inactivity expiry.
- Retry timing defined in failure_recovery_idempotency.md.
- D08 not applicable to server-side dispatch; no Dxx blocks this file.
