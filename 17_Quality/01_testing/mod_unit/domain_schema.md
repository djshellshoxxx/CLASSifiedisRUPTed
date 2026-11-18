# PS-137-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_unit. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-137-01.R01 | One manifest row per `test_id`; `test_id` unique across repository (0 duplicates on CI check) | MVP |
| PS-137-01.R02 | Row stores owning module path, repo-relative test file, `req_ids` (>=1 `PS-ID.Rnn`) | MVP |
| PS-137-01.R03 | Coverage snapshot stores line and branch percent per module, 2 decimals, from exactly one CI run | MVP |
| PS-137-01.R04 | Every non-passing test excluded from the gate has exactly one QuarantineRecord | MVP |

## Data / schema
```
TestManifestEntry {
  test_id: string        // TEST-PS-<nnn>-<nn>-<mm>; unique; CHECK regex
  ps_id: string          // PS-<nnn>-<nn>; derived from test_id
  module_path: string    // e.g. 17_Quality/01_testing/mod_unit
  test_file: string      // repo-relative; must exist at CI time
  req_ids: string[]      // minItems 1; each PS-<nnn>-<nn>.R<nn>
  status: enum(unmapped|mapped|quarantined|retired)
  revision: int          // >=1; optimistic concurrency token
  updated_at: timestamptz UTC
}
CoverageSnapshot {
  run_id: id             // CTR-ID-001 (format OPEN)
  module_path: string
  line_pct: numeric(5,2) // 0.00..100.00
  branch_pct: numeric(5,2)
  ci_commit: char(40)
  recorded_at: timestamptz UTC
}
QuarantineRecord {
  test_id: string
  reason: text           // 20..500 chars, no personal data
  requested_by: role
  approved_by: role      // != requested_by
  requested_at, expires_at: timestamptz; expires_at <= requested_at + 14 days
}
```
Provenance: `run_id`, `ci_commit` and `recorded_at` come from the CI service identity only. Manifest rows are git-tracked; the database mirror is derived.

## Commands / queries / events
See PS-137-04 for signatures. Schema version field `schema_v: 1` on every event payload per CTR-SCH-001.

## States & transitions
Defined in PS-137-03. Field `status` is the only lifecycle field.

## Validation & errors
Rules in PS-137-02. Schema violations return `UNIT.SCHEMA_INVALID`.

## Authorization
Field-level writes restricted per PS-137-05. `approved_by` is an actor reference, not free text.

## Failure, idempotency, concurrency, offline
Not applicable to offline use: manifest is produced in CI only. Concurrency via `revision`; see PS-137-06.

## Privacy, retention, abuse
No personal data permitted in any column (CTR-PRV-001 class: public-engineering). Retention in PS-137-07.

## Observability & budgets
Row counts by `status` emitted per CI run. Snapshot write p95 <= 200 ms (ASSUMPTION).

## Tests
- TEST-PS-137-01-01 (unit): regex rejects `TEST-PS-137-1-01` and accepts `TEST-PS-137-01-01`.
- TEST-PS-137-01-02 (unit): `expires_at` more than 14 days after `requested_at` is rejected.
- TEST-PS-137-01-03 (integration): duplicate `test_id` across two files fails the manifest build.

## Acceptance criteria
1. Schema matches fields above; no extra untyped columns.
2. Every entry resolves `module_path` to an existing directory.
3. `req_ids` values exist in the owning module's SPEC.md.
4. Duplicate `test_id` count is 0 on the main branch.

## Assumptions & open decisions
- ASSUMPTION: TEST-ID format follows the `TEST-<PS-ID>-<nn>` rule in BRIEF with a two-digit test number.
- CTR-ID-001 identifier format is OPEN; `run_id` type is a placeholder until decided.
- D07 PROVISIONAL (D07 default, unapproved): retention of snapshots and quarantine records per PS-137-07.
