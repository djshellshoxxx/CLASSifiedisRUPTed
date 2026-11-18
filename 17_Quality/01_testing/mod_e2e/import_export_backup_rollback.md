# PS-134-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_e2e. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-134-10.R01 | FixtureSet exported as versioned JSON; re-import yields identical content_hash | MVP |
| PS-134-10.R02 | Fixture rollback to prior version completes in <= 5 min and reverts scenarios that reference the version | MVP |
| PS-134-10.R03 | Run records exported without artifacts; artifacts never exported outside CI | MVP |
| PS-134-10.R04 | Scenario registry backed up nightly; restore tested quarterly | MVP |

## Data / schema
Export: `{schema_v: 1, fixture_set_id, version, content_hash, personas[], scenarios_ref[]}`. Import checks hash before accepting.

## Commands / queries / events
`e2e.ExportFixtureSet(id, version)` read; `e2e.ImportFixtureSet(file)` write, idempotent by hash; rollback via import of prior version.

## States & transitions
Fixture version: current -> superseded on import of newer version; prior version remains retrievable.

## Validation & errors
`E2E.FIXTURE_HASH_MISMATCH` (non-retryable), `E2E.IMPORT_INVALID` (non-retryable; row numbers only).

## Authorization
Import and rollback: QA Lead. Export: QA Lead and CI identity.

## Failure, idempotency, concurrency, offline
Import of same file is a no-op. Rollback refused while runs reference the fixture set in `running` state.

## Privacy, retention, abuse
Exports contain synthetic personas only; the PII linter runs on every import (PS-134-07).

## Observability & budgets
Import p95 <= 10 s for 200 personas (ASSUMPTION); rollback <= 5 min.

## Tests
- TEST-PS-134-10-01 (unit): export then import yields identical content_hash.
- TEST-PS-134-10-02 (integration): rollback reverts scenario references; prior run records unchanged.
- TEST-PS-134-10-03 (unit): import with altered persona fails hash check.

## Acceptance criteria
1. Round-trip hash equality for all fixture sets in use.
2. Rollback drill recorded before first release gate use (future).
3. No artifact in any export.

## Assumptions & open decisions
- ASSUMPTION: fixture sets are small (under 1 MB each).
- D07 PROVISIONAL (D07 default, unapproved): fixture versions retained for 1 year.
