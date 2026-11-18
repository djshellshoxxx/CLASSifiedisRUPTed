# PS-135-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_integration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-FED-001, CTR-EVT-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-135-10.R01 | Fixture sets are imported only from the versioned fixture repository with digest verification. | MVP |
| PS-135-10.R02 | Golden archives of prior-version events (CTR-SCH-001 R09) are kept for every supported version. | MVP |
| PS-135-10.R03 | Run history export is counts and outcomes only, no fixture content. | MVP |
| PS-135-10.R04 | Rollback of a fixture change is a new fixture version; old digests remain reproducible. | MVP |

## Data / schema
Archive manifest: `fixture_set_id`, `version`, `sha256`, `schema_versions`.

## Commands / queries / events
Import emits `integration_fixture.imported`.

## States & transitions
N/A.

## Validation & errors
Digest mismatch: INTEGR.FIXTURE_DIGEST_MISMATCH.

## Authorization
Import requires `integration_fixture.administer`.

## Failure, idempotency, concurrency, offline
Import idempotent on digest.

## Privacy, retention, abuse
Golden archives contain synthetic data only; lint applies.

## Observability & budgets
Counter `integration_fixture_import_total{result}`.

## Tests
- TEST-PS-135-10-01: import with bad digest rejected.
- TEST-PS-135-10-02: golden archive replay for each supported version.

## Acceptance criteria
1. Zero fixture imports without digest match.
2. Golden replay passes for all supported versions.

## Assumptions & open decisions
- ASSUMPTION: golden archives for last three MINOR versions.
- D07 (archive retention): PROVISIONAL (D07 default, unapproved).
