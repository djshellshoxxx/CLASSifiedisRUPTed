# PS-112-10 — import, export, backup and rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_currencies. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-112-10.R01 | Catalog exports as canonical JSON with sorted keys and digest. | MVP |
| PS-112-10.R02 | Catalog rollback publishes the prior version as a new version (history preserved). | MVP |
| PS-112-10.R03 | Import accepts a catalog only if its digest matches; partial imports are refused. | MVP |

## Data / schema
Export: `{"catalog_version":"1.0.0","digest":"sha256 hex","entries":[...]}`.

## Commands / queries / events
Rollback uses `cur.catalog.publish` with dual control.

## States & transitions
Rollback yields a new `published` version ([PS-112-03](workflow_state_machine.md)).

## Validation & errors
Per [PS-112-02](validation_rules.md) and digest check.

## Authorization
Per [PS-112-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Import idempotent by digest.

## Privacy, retention, abuse
Catalog is PUBLIC; no user data exported.

## Observability & budgets
Import and rollback counters.

## Tests
- TEST-PS-112-10-01 integration: export then import yields identical digest.
- TEST-PS-112-10-02 rollback: prior version republished as new version; history intact.
- TEST-PS-112-10-03 negative: digest mismatch refused.

## Acceptance criteria
1. Export round trip is identical in digest.
2. Rollback never deletes a version.

## Assumptions & open decisions
- ASSUMPTION: canonical JSON per RFC 8785 (JCS) is used for digests (library selection PENDING research).
- No Dxx decision directly affects this process.
