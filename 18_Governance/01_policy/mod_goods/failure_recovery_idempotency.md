# PS-144-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-144-06. **Owner:** [18_Governance/01_policy/mod_goods](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_goods. **Consumers:** F01 listings (retry and fail-closed behavior), F12 moderation (referral delivery), F15 platform (outbox and backups). **Upstream:** F07 identity, F10 privacy, F16 security. See [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
**Business outcome.** A retried request never creates a second decision, rule, category or event. A dependency outage never causes a listing to be published without a recorded decision. Partial failures end in a recoverable, visible state.

**Exclusions.** Infrastructure failover design (F15). Offline client queues (DECISIONS.md D08 governs the client; this module accepts only server-acknowledged writes).

## Retry policy
| Caller | Retry on | Schedule | Max attempts |
|---|---|---|---|
| F01 calling EvaluateGoods | GOODS_DEPENDENCY_UNAVAILABLE, GOODS_RATE_LIMITED, GOODS_INTERNAL_ERROR, timeout | Exponential, base 500 ms, factor 2, full jitter, cap 10 s; honor `Retry-After` | 5 |
| Reviewer console commands | Same retryable codes; GOODS_VERSION_CONFLICT after re-read | Same schedule | 3 |
| Outbox dispatcher to consumers | Any transport failure | Base 1 s, factor 2, cap 5 min | Until referral window closes (7 days) |

Non-retryable codes (validation, authorization, state) are never retried with the same payload.

## Timeouts
| Operation | Timeout | Behavior on timeout |
|---|---|---|
| EvaluateGoods, client view | 2 s | Caller treats as GOODS_DEPENDENCY_UNAVAILABLE and keeps the listing unpublished |
| Command, client view | 5 s | Caller re-sends with the same idempotency_key |
| Rule lookup from mod_jurisdictions reference | 300 ms | Use cached reference if fresh (≤ 15 min); else fail |
| Database transaction | 1 s | Rollback; no partial write |
| Review lease | 24 h | Case returns to `OPEN` |
| Idempotency record | 72 h | Replay window closes; later reuse is treated as new |
| Outbox dispatch loop | 5 s per batch | Re-queued |

## Idempotency
- Scope: `(actor_ref, command_name, idempotency_key)`.
- Stored per request: canonical payload hash (SHA-256 of canonical JSON, sorted keys), response body, status code, `created_at`. Retention 72 h (A-goods-10).
- Same scope and same hash: return the stored response with `replayed: true`. No new write, no new event.
- Same scope and different hash: GOODS_IDEMPOTENCY_KEY_REUSED.
- Same scope while the first request is still running: GOODS_IDEMPOTENCY_IN_PROGRESS; caller retries.
- The idempotency record and the business write commit in one transaction, so a crash leaves either both or neither.

## Concurrency
| Conflict | Mechanism | Result |
|---|---|---|
| Two writers update the same record | `expected_version` compare-and-set | Loser gets GOODS_VERSION_CONFLICT; re-reads and retries |
| Overlapping rule ranges | Serializable check or exclusion constraint on (category_id, jurisdiction_scope, effective range) for `SCHEDULED` and `ACTIVE` | Loser gets GOODS_RULE_OVERLAP |
| Two reviewers claim one case | Compare-and-set on `assigned_reviewer_ref` and `lease_expires_at` | Loser gets GOODS_REVIEW_LEASE_HELD |
| Two evaluations for one subject | Independent decisions, each idempotent per key | Consumers use the latest `evaluated_at` for that subject |

## Partial failure scenarios
| Scenario | Detection | Recovery | Visible state |
|---|---|---|---|
| Decision committed, event publish fails | Outbox row not marked sent | Dispatcher retries; consumers dedupe on `event_id` | Decision exists; F01 reads it directly |
| REFER handoff to mod_prohibited fails | Referral outbox row pending | Retry up to 7 days; then alert to F12 | Case `REFERRED`, referral status `PENDING` |
| Activation committed, scheduler crashes before tick | Sweep finds `SCHEDULED` past `effective_from` | Next sweep (≤ 30 s) activates | Rule briefly `SCHEDULED`; decisions use `ACTIVE` rules only |
| mod_jurisdictions reference unavailable | Lookup timeout | Use cache up to 15 min; then refuse evaluations | Evaluations return GOODS_DEPENDENCY_UNAVAILABLE |
| Database failover mid-command | Connection error | Idempotent retry returns stored response or executes once | No duplicate |
| Restore from backup (see import_export_backup_rollback.md) | Restore marker | Outbox re-sent with original `event_id`; consumers dedupe | No duplicate effects |

## Fail-closed behavior
- If EvaluateGoods cannot complete, F01 keeps the listing unpublished. The module never returns `ALLOW` by default (A-goods-05 and A-goods-09).
- Read-only policy views (GetEffectiveGoodsRules) may serve cache up to 15 min old and mark `stale: true`.
- Reviewer console shows a read-only banner when the module is unavailable; no decision is queued locally.

## Replay and forgery
- Service-to-service calls carry signed tokens with a 5-minute replay window (F16). Replays within the window are caught by the idempotency key; replays outside are refused by token expiry.
- Decision rows are not user-supplied evidence; external receipts are not accepted by this module.

## Assumptions
- **A-goods-09.** Fail-closed publication and 15-minute reference cache are concrete defaults. Cache TTL is configuration.
- **A-goods-10.** Idempotency records are kept 72 h. The outbox provides at-least-once delivery; consumers must dedupe on `event_id`.

## Open decisions
- **OD-GOODS-06.** Whether referral window should be 7 days or match mod_prohibited SLA. Default: 7 days until that SLA is published.
- Related: [DECISIONS.md](../../../DECISIONS.md) D08 governs offline client queues; not changed here.
