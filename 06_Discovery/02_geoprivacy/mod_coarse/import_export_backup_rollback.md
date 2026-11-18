# PS-047-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_coarse. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R02, R07, R08), CTR-PRV-001 (R11); PENDING CTR-DSC-001.

**Decision labels:** Registry import governed by D05 PROVISIONAL (unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-10.R01 | Registry versions are exported as signed JSON bundles with SHA-256 digest. | MVP |
| PS-047-10.R02 | Import of a registry bundle requires digest match and dual approval; partial import is rejected. | MVP |
| PS-047-10.R03 | Rollback reactivates the prior registry version; publication flags recomputed within one window. | MVP |
| PS-047-10.R04 | User data export excludes registry and publication flags (not personal). | MVP |
| PS-047-10.R05 | Backups include registry versions (RET-AUD); recompute state is rebuilt after restore. | MVP |

## Data / schema
Bundle: `registry_version`, `cells[]`, `digest`, `created_at`. Migrations pure and idempotent (CTR-SCH-001 R07).

## Commands / queries / events
`cell.propose` via bundle import is not allowed; bundle import uses `registry.import` (ope_ dual).

## States & transitions
Import: `received → verified → approved → active | rejected`.

## Validation & errors
Digest mismatch → `COARSE.REGISTRY_INVALID`.

## Authorization
Dual `ope_` approval (PS-047-05).

## Failure, idempotency, concurrency, offline
Import idempotent by digest.

## Privacy, retention, abuse
Bundles contain no counts and no justifications.

## Observability & budgets
Metric `coarse_rollbacks_total`; alert on rollback.

## Tests
- TEST-PS-047-10-01 (integration): export → import round trip equals digest.
- TEST-PS-047-10-02 (integration): tampered bundle rejected.
- TEST-PS-047-10-03 (integration): rollback restores flags within one window.

## Acceptance criteria
1. Round-trip digest equality.
2. Tampered bundle rejected with specified code.
3. Rollback verified.

## Assumptions & open decisions
- D05 PROVISIONAL.
