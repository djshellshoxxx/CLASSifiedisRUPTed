# PS-115-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_install. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-115-10.R01 | No export or import; the module holds no user data beyond the cooldown key. | MVP |
| PS-115-10.R02 | Backups contain no install state. | MVP |
| PS-115-10.R03 | Rollback: deploy previous build; the manifest is versioned with the build and icons are immutable per build. | MVP |
| PS-115-10.R04 | If the manifest changes name or icons, the change is marked as a new app identity in release notes; installed copies keep old metadata until reinstall (browser behavior). | MVP |

## Data / schema
Manifest versions retained with build manifests (90 days).

## Commands / queries / events
None.

## States & transitions
Rollback changes manifest with build; installed copies update per browser rules.

## Validation & errors
Not applicable.

## Authorization
Release pipeline only.

## Failure, idempotency, concurrency, offline
Rollback idempotent per build.

## Privacy, retention, abuse
No user data affected.

## Observability & budgets
Rollback ≤ 30 min in release cycle.

## Tests
- TEST-PS-115-10-01 (contract): no export or backup entries from this module.
- TEST-PS-115-10-02 (integration): rollback serves previous manifest and icons.
- TEST-PS-115-10-03 (integration): manifest change flagged in release checklist.
- TEST-PS-115-10-04 (negative): no import route exists.

## Acceptance criteria
1. Rollback drill recorded (not yet run).
2. Manifest versioned per build.
3. No backup contents from module.

## Assumptions & open decisions
- ASSUMPTION: manifest identity changes are rare and reviewed.
- No Dxx applies.
