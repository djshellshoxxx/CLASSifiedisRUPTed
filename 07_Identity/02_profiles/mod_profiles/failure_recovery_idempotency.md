# PS-056-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_profiles. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03, offline), CTR-PRV-001 (RET-EPH for queues; cache purge at logout).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-056-06.R01 | Profile patch, visibility change and disclosure grant each commit atomically with their event (single transaction or outbox). | MVP |
| PS-056-06.R02 | Duplicate delivery of any write returns original result; no second event. | MVP |
| PS-056-06.R03 | Concurrent patches on the same revision: exactly one commits; others receive `EVT.REVISION_CONFLICT`. | MVP |
| PS-056-06.R04 | Client retries only retryable codes, max 5 attempts, exponential backoff with jitter; client timeout 5 s. | MVP |
| PS-056-06.R05 | Offline profile edits held in a local pending queue until relay acknowledgment; cleared on logout. | MVP |
| PS-056-06.R06 | Freeze and purge jobs are idempotent and resumable. | MVP |

## Data / schema
Idempotency record as in mod_pseudonyms PS-052-06 (7-day retention). Pending-queue entry: `profile_patch_id`, `prf_id`, `patch_digest`, `expected_revision`, `status`. Purged on ack (RET-EPH). Queue entries containing private values are encrypted at rest on device (ASSUMPTION).

## Commands / queries / events
Retry behavior applies to `UpdateProfile`, `SetFieldVisibility`, `DisclosePrivateField`, `RevokeDisclosure`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| `pending` (device) | relay ack | — | `acknowledged` | remove local queue entry |
| `pending` | non-retryable error | — | `not_applied` | user sees message key; value kept until user dismisses |
| `pending` | retryable error | attempts < 5 | `pending` | backoff |
| `pending` | `PROF.PROFILE_FROZEN` received | — | `not_applied` | private values deleted from device |

## Validation & errors
Non-retryable codes never auto-retry. `not_applied` items are visible to user; never silently discarded (CTR-ERR-001).

## Authorization
Re-authorized on every server attempt; queue items carry no capabilities.

## Failure, idempotency, concurrency, offline
- Revision conflict: client re-reads profile, shows diff, resubmits with new key.
- Disclosure grant racing with revocation: last write by server timestamp wins; revocation is never overridden by an earlier grant replay (ASSUMPTION).
- Relay outage: queue limit 100 patches or 7 days, then oldest become `not_applied` (ASSUMPTION).
- Server crash after commit: retry returns stored result.

## Privacy, retention, abuse
Device queue purged on logout and account switch. Private values in queue removed when `PROFILE_FROZEN` returns. Replay storms rate-limited per `prf_` (30 writes per minute, ASSUMPTION).

## Observability & budgets
`prof_outbox_lag_seconds` p95 ≤ 5 s; `prof_queue_not_applied_total{code}`. No values in metrics.

## Tests
- TEST-PS-056-06-01 (integration): crash between commit and ack; one event published.
- TEST-PS-056-06-02 (concurrency): 20 parallel patches; one commit per revision.
- TEST-PS-056-06-03 (offline): patch queued while `prf_` retired becomes `not_applied` with private values deleted.
- TEST-PS-056-06-04 (property): replay of any write sequence yields same final profile.

## Acceptance criteria
1. Atomicity verified by fault injection.
2. No duplicate events under replay.
3. Offline queue never drops items silently.
4. Private values removed from device when profile frozen.

## Assumptions & open decisions
- ASSUMPTION: queue limit 100 items or 7 days.
- ASSUMPTION: 30 writes per minute per `prf_`.
- PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay acknowledgment.
