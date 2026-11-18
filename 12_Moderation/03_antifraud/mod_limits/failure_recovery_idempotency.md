# PS-098-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_limits. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03), CTR-CAP-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-098-06.R01 | Policy commands are idempotent per CTR-EVT-001 R03. | MVP |
| PS-098-06.R02 | Owning modules cache the last-known-good active policy for ≤ 1 h. If the policy service is unreachable beyond that, new creations fail closed with `LIMITS.POLICY_UNAVAILABLE` (retryable true). | MVP |
| PS-098-06.R03 | Quota check and the owner's write are serialized per scope by the owning module (advisory lock or conditional insert), so two concurrent creations cannot both pass a limit of N-1. | MVP |
| PS-098-06.R04 | Check responses are not cached across calls; each create re-checks. | MVP |
| PS-098-06.R05 | Activation is one transaction: retire predecessor, insert activation event, update active pointer, outbox. | MVP |

## Data / schema
Active-policy pointer cache: `(quota_key, scope, jurisdiction) → lim_id, version, limit_value, fetched_at`. Cache is non-authoritative.

## Commands / queries / events
Check is read-only; decision record written after response (async), with retry until written. Missing `dec_` after 60 s is an alert (`LIMITS.DECISION_LOG_LAG`, internal).

## States & transitions
Rollout steps are idempotent: advancing to an already reached step returns the original result.

## Validation & errors
`LIMITS.POLICY_UNAVAILABLE` only for writes that need a check; reads of `limits.get_active` return the cached value with `stale: true` after 1 h.

## Authorization
Authorization re-evaluated per call.

## Failure, idempotency, concurrency, offline
- Timeouts: check 200 ms; owner module retries check once; then `POLICY_UNAVAILABLE` as above.
- Offline: quota checks run server-side only; offline creations are queued by the PWA (D08) and checked on relay acknowledgement, so a queued listing may be rejected later with `LIMITS.QUOTA_EXCEEDED`. The client must show this result as a pending-to-rejected transition.
- Race: two activations for the same key → loser `EVT.REVISION_CONFLICT`.

## Privacy, retention, abuse
Cache holds policy values only, no account data.

## Observability & budgets
Metric `limits_policy_cache_age_seconds`; alert at 45 min of cache age in any owner module.

## Tests
- `TEST-PS-098-06-01` integration: 10 concurrent creations at N-1 → exactly one passes.
- `TEST-PS-098-06-02` integration: policy service down 90 min → owner uses cache for 60 min, then fails closed.
- `TEST-PS-098-06-03` offline: queued listing over quota rejected on acknowledgement; client shows rejected state.
- `TEST-PS-098-06-04` integration: duplicate activation → single active policy.

## Acceptance criteria
1. No over-limit creation under concurrency test.
2. Fail-closed behavior verified after cache expiry.
3. Offline queued items reconcile to a terminal state.

## Assumptions & open decisions
- ASSUMPTION: 1 h cache and 200 ms check timeout are defaults for F15 review.
- D08 (PWA offline writes), PROVISIONAL default: pending queue until relay acknowledgement (unapproved).
