# PS-052-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_pseudonyms. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02 revision, R03 idempotency), CTR-ERR-001 (R03 retryable, offline rules), CTR-ID-001 (client-generated IDs), CTR-PRV-001 (RET-EPH for queues).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-052-06.R01 | Create, change, label and retire are atomic with their event and handle-reservation rows (single transaction or outbox). | MVP |
| PS-052-06.R02 | Duplicate delivery of any command with same key returns original result; no second row or event. | MVP |
| PS-052-06.R03 | Concurrent handle claims: exactly one succeeds; the other returns `PSEUD.HANDLE_TAKEN` with no partial row. Tested with 50 parallel claims. | MVP |
| PS-052-06.R04 | Client timeout 5 s; server retries are not automatic beyond CTR-EVT-001 rules; client retry limited to retryable codes, max 5 attempts, exponential backoff with jitter. | MVP |
| PS-052-06.R05 | Offline create queue entries persist until relay ack; queue cleared on logout or account switch (CTR-PRV-001). | MVP |
| PS-052-06.R06 | Account deletion saga is resumable; each step is idempotent. | MVP |

## Data / schema
Idempotency record: `key`, `actor_ref`, `command`, `request_digest` (SHA-256 of JCS body), `result_ref`, `created_at`. Retention 7 days (RET-OPS, CTR-EVT-001 R03). Outbox row: `event_id`, `payload_digest`, `published_at`, retained until acknowledged, then purged (RET-EPH).

## Commands / queries / events
Retry behavior applies to all four commands in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| `pending_ack` (client only) | relay accepts | ack received | `acknowledged` | remove from queue |
| `pending_ack` | non-retryable error | code non-retryable | `not_applied` | show user message key; keep for user dismissal |
| `pending_ack` | retryable error | attempts < 5 | `pending_ack` | backoff |
| `pending_ack` | attempts = 5 | — | `not_applied` | show retry prompt |

## Validation & errors
Failed offline items follow CTR-ERR-001 offline rule: never silently discarded; `not_applied` with `message_key`.

## Authorization
Retries are re-authorized server-side; queued items do not carry capabilities.

## Failure, idempotency, concurrency, offline
- Revision conflict → `EVT.REVISION_CONFLICT`; client re-reads and resubmits with new `expected_revision` (new idempotency key).
- Relay outage: queue grows up to 200 items or 7 days, then oldest items move to `not_applied` with `err.pseud.queue_full` (ASSUMPTION).
- Partial failure after commit but before ack: retry returns the stored result (R02).
- Handle taken while offline: item becomes `not_applied` with `PSEUD.HANDLE_TAKEN`; user may choose another handle.
- Timeouts: server processing budget 300 ms p95; saga step timeout 10 s.

## Privacy, retention, abuse
Queue entries hold local `prf_id` and handle only while pending (RET-EPH). Purged on logout and account switch. Idempotency records hold digests, not bodies.

## Observability & budgets
Metrics: `pseud_outbox_lag_seconds` (p95 ≤ 5 s), `pseud_queue_not_applied_total{code}`, `pseud_saga_step_retry_total`. Logs: `prf_id`, `event_id`, code only.

## Tests
- TEST-PS-052-06-01 (integration): crash after insert before ack; restart publishes once.
- TEST-PS-052-06-02 (concurrency): 50 parallel claims on one handle yield one success.
- TEST-PS-052-06-03 (offline): queued create with taken handle moves to `not_applied`, not discarded.
- TEST-PS-052-06-04 (property): replaying any command sequence yields the same final state.

## Acceptance criteria
1. Atomicity verified by fault injection between insert and event publish.
2. Exactly one winner in 50-way handle race.
3. No offline item is dropped without a user-visible state.
4. Saga resumes after induced failure at each step.

## Assumptions & open decisions
- ASSUMPTION: queue limits 200 items / 7 days.
- PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay acknowledgment.
- ASSUMPTION: idempotency key TTL 7 days (CTR-EVT-001 R03).
