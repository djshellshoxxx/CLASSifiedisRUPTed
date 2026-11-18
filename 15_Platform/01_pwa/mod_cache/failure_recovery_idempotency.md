# PS-114-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_cache. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-114-06.R01 | Storage quota exceeded: evict LRU non-pinned entries until write succeeds; if still failing, skip caching (page still works). | MVP |
| PS-114-06.R02 | Corrupted entry (hash or parse failure on read) is deleted and refetched. | MVP |
| PS-114-06.R03 | Service worker update failure keeps the previous active build. | MVP |
| PS-114-06.R04 | The cache never holds writes; pending writes live in the D08 PROVISIONAL pending queue, not in cache storage. | MVP |

## Data / schema
Pinned entries: shell assets for active build (not evictable).

## Commands / queries / events
Activation idempotent by build_id.

## States & transitions
See workflow_state_machine.

## Validation & errors
`CACHE.QUOTA_EXCEEDED` and `CACHE.CORRUPT_ENTRY` are local codes; not user-visible except as stale-data notice.

## Authorization
Not applicable.

## Failure, idempotency, concurrency, offline
- Multiple tabs share cache; activation waits for all tabs to close the old build or uses skipWaiting only after user accepts update.
- Browser clears storage: app falls back to network; no crash.
- Offline with no cache: shows offline page with retry.

## Privacy, retention, abuse
Eviction and purge delete data fully.

## Observability & budgets
Local counters; no network telemetry.

## Tests
- TEST-PS-114-06-01 (integration): quota fill evicts LRU and keeps shell.
- TEST-PS-114-06-02 (integration): corrupt entry refetched once.
- TEST-PS-114-06-03 (chaos): failed build install keeps previous build.
- TEST-PS-114-06-04 (offline): no cache plus offline shows offline page with retry control.

## Acceptance criteria
1. Quota behavior verified.
2. No writes stored in cache (scan).
3. Offline page accessible (a11y check).

## Assumptions & open decisions
- ASSUMPTION: LRU policy.
- D08 PROVISIONAL (D08 default, unapproved).
