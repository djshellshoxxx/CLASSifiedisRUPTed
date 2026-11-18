# PS-104-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_push. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-104-06.R01 | Delivery is at-least-once to the provider. Clients deduplicate on `ntf_id`. No exactly-once claim is made. | MVP |
| PS-104-06.R02 | Connect timeout 5 s; request timeout 10 s per provider call. | MVP |
| PS-104-06.R03 | Retry delays after failure: 1 min, 5 min, 30 min, 2 h, each ±20% jitter (ASSUMPTION). | MVP |
| PS-104-06.R04 | Circuit breaker per push-service host: opens at ≥ 50% failures over 60 s with ≥ 20 calls; half-open probe after 60 s. | MVP |
| PS-104-06.R05 | Queued attempts survive process restart; on restart attempts past TTL become `expired` without a send. | MVP |

## Data / schema
Idempotency records: dispatch key = `ntf_id` + `psb_id` (one attempt row per `attempt_no`). Registration key = sha256(account, device, endpoint). Records retained 7 days (CTR-EVT-001 R03).

## Commands / queries / events
- `push.dispatch_notification` is safe to repeat: second call for same key finds existing `pda_` and does not create a new attempt.
- Events emitted only on committed transitions; a crash between provider call and commit can produce a duplicate provider send, which R01 accepts.

## States & transitions
Retry scheduling and expiry follow [workflow_state_machine.md](workflow_state_machine.md) rows marked retry_scheduled.

## Validation & errors
Provider 429/503 maps to `PUSH.PROVIDER_UNAVAILABLE` (retryable true). Provider 400/401/413 maps to `PUSH.PROVIDER_REJECTED` (retryable false). 404/410 maps to subscription expiry, not an error response to the user.

## Authorization
Retries reuse the original dispatch decision; no re-authorization is needed unless the grant expired, in which case the attempt is failed.

## Failure, idempotency, concurrency, offline
- Concurrency: subscription writes use `expected_revision`; dispatcher reads committed revision before send.
- Partial failure: if commit fails after 201, the next attempt may duplicate; accepted by R01.
- Offline: server-side only. Client keeps no push queue; on app start the client re-checks subscription status via query.
- Load shedding: when queue lag > 60 s, dispatcher drops `activity` category first.

## Privacy, retention, abuse
Retry records hold no payload. Provider error bodies are discarded after classification.

## Observability & budgets
Counters `push_retries_total{attempt_no}`, `push_circuit_state{host}`. Queue lag p95 ≤ 30 s at 99.9% of normal load.

## Tests
- TEST-PS-104-06-01 (integration): provider 503 three times then 201 yields `sent` at attempt 4 with correct delays.
- TEST-PS-104-06-02 (integration): process kill during `retry_scheduled` resumes on restart without duplicate attempt rows.
- TEST-PS-104-06-03 (property): total attempts per ntf_id never exceed 5.
- TEST-PS-104-06-04 (chaos): circuit opens under simulated 60% 5xx and recovers after half-open probe succeeds.

## Acceptance criteria
1. Retry schedule matches R03 within ±25% in test clock.
2. No attempt row is created twice for the same key.
3. Circuit behavior verified in chaos test before MVP gate.

## Assumptions & open decisions
- ASSUMPTION: retry schedule and breaker thresholds.
- No D-ID directly applies; D08 does not affect server dispatch.
