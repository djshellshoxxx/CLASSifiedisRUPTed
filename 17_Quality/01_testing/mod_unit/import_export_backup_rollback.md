# PS-137-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_unit. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-137-10.R01 | Manifest export as JSON with `schema_v`; round-trip import yields identical manifest (byte-equal after sort) | MVP |
| PS-137-10.R02 | Import of external JUnit XML reports accepted; unknown fields dropped and counted, not stored | MVP |
| PS-137-10.R03 | Manifest rollback restores a prior git revision in <= 5 min with no orphaned TEST-IDs | MVP |
| PS-137-10.R04 | Coverage snapshots are append-only; correction requires a new run, never an update | MVP |

## Data / schema
Export document: `{schema_v: 1, generated_at, commit, entries: TestManifestEntry[]}`. JUnit import maps `testcase@classname` and `@name` to `test_id` by pattern; unmapped names are reported, not invented.

## Commands / queries / events
Export is a read query `unit.ExportManifest(commit)`. Import is `unit.ImportJUnit(run_id, file)` with idempotency key = SHA-256 of file.

## States & transitions
Rollback: `current_revision` -> `prior_revision` by git revert; manifest rows rebuilt; events not replayed.

## Validation & errors
`UNIT.IMPORT_UNMAPPED` (retryable: no; lists names), `UNIT.EXPORT_SCHEMA_MISMATCH` (non-retryable).

## Authorization
Export: engineering roles. Import and rollback: CI identity or QA Lead.

## Failure, idempotency, concurrency, offline
Import of the same file twice is a no-op (same hash). Rollback is refused while a run is in progress for the same module.

## Privacy, retention, abuse
Exports contain identifiers and paths only. JUnit files may contain stack traces; they are stored for 14 days then deleted (PROVISIONAL, D07 default).

## Observability & budgets
Import of 5,000-case JUnit file p95 <= 10 s (ASSUMPTION); rollback <= 5 min.

## Tests
- TEST-PS-137-10-01 (unit): export then import yields byte-equal manifest.
- TEST-PS-137-10-02 (integration): JUnit file with unknown names reports them and stores none.
- TEST-PS-137-10-03 (integration): rollback to prior commit leaves no TEST-ID without file.

## Acceptance criteria
1. Round-trip test passes for the full manifest.
2. Rollback drill completed once before first gate use (future).
3. No coverage row updated in place (DB constraint or append-only check).

## Assumptions & open decisions
- ASSUMPTION: JUnit XML is the only external report format in MVP.
- D07 PROVISIONAL (D07 default, unapproved): 14-day retention for raw JUnit files.
