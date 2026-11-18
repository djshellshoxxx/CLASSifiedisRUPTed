# PS-123-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_feature (F15.S04.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-123-10.R01 | Catalog export is a versioned JSON snapshot with digest; no personal data. | MVP |
| PS-123-10.R02 | Catalog import is accepted only as a whole snapshot that passes PS-123-02 (no partial import). | MVP |
| PS-123-10.R03 | Rollback restores the previous catalog version; lifecycle events are not reversed (append-only). | MVP |
| PS-123-10.R04 | Catalog is included in platform backup scope (PS-120) as registry data. | MVP |

## Data / schema
Snapshot: `{"catalog_version": SemVer, "features": [...], "digest": "sha256"}`.

## Commands / queries / events
Import and rollback are `sys` operations under release role.

## States & transitions
Rollback creates a new catalog version that equals the previous.

## Validation & errors
`FEATURE.DEFINITION_INVALID` on snapshot failure.

## Authorization
Release role required (PS-123-05).

## Failure, idempotency, concurrency, offline
Import is idempotent on digest.

## Privacy, retention, abuse
Snapshots contain no personal data.

## Observability & budgets
Import completes within 30 s (ASSUMPTION).

## Tests
- TEST-PS-123-10-01 (round trip): export then import yields identical digest.
- TEST-PS-123-10-02 (negative): partial snapshot refused.
- TEST-PS-123-10-03 (rollback): rollback restores previous digest.
- TEST-PS-123-10-04 (backup): restore of PS-120 set restores catalog.

## Acceptance criteria
1. Round trip stable (TEST-01).
2. TEST-PS-123-10-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: catalog is small (< 1 MB).
