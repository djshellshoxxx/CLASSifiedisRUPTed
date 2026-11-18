# PS-114-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_cache. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-114-03.R01 | Build states: `installing` → `active` → `redundant`. Only one build is `active` per origin. | MVP |
| PS-114-03.R02 | Entry states: `fresh` (before expires_at), `stale` (served while revalidating), `evicted`, `purged`. | MVP |
| PS-114-03.R03 | A build becomes `active` only when all precache entries verify (PS-114-02.R04). | MVP |
| PS-114-03.R04 | Purge is terminal for the entry and cannot be undone. | MVP |

## Data / schema
Transitions read manifest hashes, entry `expires_at` and quota totals.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | new build installed | manifest verified | installing → active | previous build → redundant; old caches deleted |
| installing | verification fails | none | (discarded) | keep previous active build |
| fresh | `expires_at` reached | none | stale | background revalidate |
| stale | revalidate 200 | cacheable | fresh | replace body |
| stale | revalidate fails | none | stale | serve stale only while offline |
| any | quota exceeded on write | none | evicted (LRU) | evict oldest non-pinned entries first |
| any | logout, account switch or session revoked | none | purged | delete all data entries |
| any | "clear data" (mod_install) | user confirmed | purged | delete all entries |

## Validation & errors
`CACHE.MANIFEST_MISMATCH` during install keeps previous build (no user-facing error beyond update notice).

## Authorization
Not applicable on server; purges are local.

## Failure, idempotency, concurrency, offline
Purge is idempotent. Build switch is atomic: shell and data caches switch together by build_id.

## Privacy, retention, abuse
Purged entries are deleted from storage, not only marked.

## Observability & budgets
Local counters for evictions and purges. Build switch ≤ 2 s on mid-range phone.

## Tests
- TEST-PS-114-03-01 (unit): every transition covered.
- TEST-PS-114-03-02 (integration): logout purges all data entries and keeps shell.
- TEST-PS-114-03-03 (integration): interrupted install keeps previous active build.
- TEST-PS-114-03-04 (offline): stale public data served offline, marked stale.

## Acceptance criteria
1. Atomic build switch verified.
2. Logout purge complete in test (no residual entries).
3. Stale serving verified offline.

## Assumptions & open decisions
- ASSUMPTION: LRU eviction order.
- D08 PROVISIONAL governs writes, not cache (see failure file).
