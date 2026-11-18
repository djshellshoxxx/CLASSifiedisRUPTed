# PS-114-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_cache. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-114-10.R01 | Cache contents are never exported or imported; they are not user data. | MVP |
| PS-114-10.R02 | Cache is not included in server backups; it is rebuilt from the network. | MVP |
| PS-114-10.R03 | Rollback: deploy previous build; the service worker activates the previous manifest (new cache name by build_id). | MVP |
| PS-114-10.R04 | Emergency kill switch: service worker unregisters itself on next load if flag `pwa_cache_disabled` is set (ASSUMPTION). | MVP |

## Data / schema
Build manifests are versioned artifacts retained for 90 days.

## Commands / queries / events
None.

## States & transitions
Rollback creates build transition `active` to previous build.

## Validation & errors
Kill switch errors: none user-visible.

## Authorization
Release pipeline only.

## Failure, idempotency, concurrency, offline
Kill switch takes effect on next load, not during an active session (ASSUMPTION).

## Privacy, retention, abuse
Kill switch clears all caches on unregister.

## Observability & budgets
Rollback completes within one release cycle (≤ 30 min).

## Tests
- TEST-PS-114-10-01 (contract): export excludes cache data.
- TEST-PS-114-10-02 (integration): rollback restores previous build without stale mixed assets.
- TEST-PS-114-10-03 (integration): kill switch unregisters and clears caches.
- TEST-PS-114-10-04 (negative): cache dump is not included in backup manifest.

## Acceptance criteria
1. Rollback drill recorded (not yet run).
2. Kill switch verified.
3. No cache data in backups.

## Assumptions & open decisions
- ASSUMPTION: kill switch behavior.
- D08 PROVISIONAL (D08 default, unapproved) governs pending writes outside cache.
