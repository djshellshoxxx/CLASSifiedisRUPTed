# PS-102-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_email (Platform Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03), CTR-SCH-001.

**Decision labels:** Retry schedule and circuit-breaker thresholds are PROVISIONAL (D07 default, unapproved). Offline queueing: not applicable; D08 applies to the client only.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-102-06.R01 | `eml.send` dedupe key (`ntf_id`, `channel`, `template_version`): at most one provider submission per key. | MVP |
| PS-102-06.R02 | Retries: exponential backoff 1 min, 5 min, 30 min, 2 h; maximum 5 attempts. Only soft bounces and provider 5xx are retryable. | MVP |
| PS-102-06.R03 | Provider call timeout 10 s; circuit breaker opens after 50% failures in 5 minutes and half-opens after 60 s. | MVP |
| PS-102-06.R04 | Verification consumption is a conditional update (`used_at IS NULL`); exactly one of two concurrent verifies succeeds. | MVP |
| PS-102-06.R05 | Unique active binding per (`acc_`, HMAC); concurrent binds return the same `eml_` after conflict resolution. | MVP |
| PS-102-06.R06 | Provider outage: queue retained until `expires_at` (72 h), then `EXPIRED`; no silent drop. | MVP |

## Data / schema
Idempotency records retained 7 days (CTR-EVT-001 R03). Queue table `eml_outbox` with `status`, `attempt_no`, `next_attempt_at`, `lock_token`.

## Commands / queries / events
`eml.send` emits `email_delivery.sent` only after provider acceptance. Commands that fail validation emit nothing.

## States & transitions
Retry transitions per PS-102-03 (RETRY_WAIT, QUEUED, EXPIRED).

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| EMAIL.RATE_LIMITED | true | rate / 429 | Bind or send over limit |
| SYS.UNAVAILABLE | true | availability / 503 | Provider circuit open |
| EVT.IDEMPOTENCY_KEY_REUSED | false | conflict / 409 | Same key, different digest |

## Authorization
Retries reuse original authorization; no re-check after acceptance.

## Failure, idempotency, concurrency, offline
- Crash after provider acceptance and before commit: next attempt would duplicate. Mitigation: provider idempotency header carries `dlv_` ID; reconciliation job matches `provider_message_id` within 24 h.
- Webhook arrives before `SENT` commit: buffered and applied after commit by revision.
- Concurrency: binding changes lock by `email_id`.
- Offline client: not applicable.

## Privacy, retention, abuse
Outbox rows hold no body text; purged on acceptance (RET-EPH).

## Observability and budgets
Queue age p95 ≤ 60 s to provider acceptance (ASSUMPTION). Duplicate-send counter must equal zero in CI.

## Tests
- TEST-PS-102-15 (integration): kill after provider accept, before commit; reconcile yields one `dlv_`.
- TEST-PS-102-16 (property): 1,000 concurrent verifies on one token → exactly one success.
- TEST-PS-102-17 (integration): provider 503 storm opens breaker; queue drains after recovery with no loss.
- TEST-PS-102-18 (integration): 72 h queued message → `EXPIRED` event.

## Acceptance criteria
1. Zero duplicate sends in fault-injection suite.
2. Breaker and retry values match this file.
3. No outbox row is lost across restart.

## Assumptions & open decisions
- ASSUMPTION: provider supports an idempotency header or message ID lookup.
- D07 and D08 (PROVISIONAL, unapproved; D08 applies to client, not server queue).
