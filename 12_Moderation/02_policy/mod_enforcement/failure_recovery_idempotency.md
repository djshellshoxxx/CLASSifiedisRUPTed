# PS-096-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_enforcement. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R08), CTR-ERR-001, CTR-CAP-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-096-06.R01 | Apply is idempotent on (applier, `enf.apply`, key) per CTR-EVT-001 R03. | MVP |
| PS-096-06.R02 | Effect dispatch to the owning module is at-least-once; consumers dedupe on `(enf_id, revision)`. | MVP |
| PS-096-06.R03 | If the effect service is unavailable, the action remains `active` with `effect_status = pending`, retried with backoff 1 s → 10 min cap (ASSUMPTION). After 1 h `failed`, an operator alert fires. | MVP |
| PS-096-06.R04 | Expiry and reversal are idempotent: a second `enf.expired` or `enf.reversed` for the same revision is a no-op returning the original result. | MVP |
| PS-096-06.R05 | Concurrent `enf.reverse` and `enf.expired` on one action: the first committed revision wins; the other returns `EVT.REVISION_CONFLICT` and must re-read. | MVP |

## Data / schema
Outbox rows: `event_id`, `enf_id`, `revision`, `target_type`, `target_id`, `effect` (`apply`, `remove`), `status`, `attempts`. Idempotency rows as in PS-091-06.

## Commands / queries / events
Each transition is one transaction: check revision, write `enf_event`, update `enf_action`, insert outbox. Effect is applied by the owning module, not by this module.

## States & transitions
Recovery from `effect_status = failed`: operator re-dispatch (new outbox row, same revision); no state change.

## Validation & errors
Retry-safe: `ENFORCE.EFFECT_UNAVAILABLE` (503, retryable true) on writes only before commit. `EVT.REVISION_CONFLICT` not retryable without re-read.

## Authorization
Authorization re-evaluated on each retry; a revoked grant denies it.

## Failure, idempotency, concurrency, offline
- Timeouts: 2 s server; client retries use the same key, max 5 attempts.
- Offline: clients cannot apply actions; the moderator console requires connectivity. No offline queue (D08 not applicable to moderation writes, ASSUMPTION).
- Owning-module outage: action is still authoritative; hidden state is enforced by the owning module's read path once it recovers. Until then the owner's read path must fail closed (hidden) — ASSUMPTION, documented in F12 review.

## Privacy, retention, abuse
Outbox rows contain IDs and codes only.

## Observability & budgets
Metrics `enforce_effect_pending_total`, `enforce_effect_failed_total`; alert on any `failed` older than 1 h.

## Tests
- `TEST-PS-096-06-01` integration: owning module down 30 min → action active, effect pending, applied once after recovery.
- `TEST-PS-096-06-02` integration: duplicate effect delivery → single state change at consumer.
- `TEST-PS-096-06-03` integration: reverse vs expire race → one winner, other `EVT.REVISION_CONFLICT`.
- `TEST-PS-096-06-04` negative: owning module down → public read path returns hidden content, not content.

## Acceptance criteria
1. No action is lost across restarts or owner outages.
2. Zero double effects in fault-injection suite.
3. Fail-closed hide verified for listing and message targets.

## Assumptions & open decisions
- ASSUMPTION: fail-closed read behavior for hidden content is required; owning modules (F01, F08) confirm.
- D08 (PWA offline writes), PROVISIONAL default: pending queue applies to user writes only, not moderation (unapproved).
