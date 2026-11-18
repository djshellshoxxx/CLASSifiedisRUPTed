# PS-078-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_export (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (backup disclosure row, R06), CTR-SCH-001 (R07 upcast on read), PENDING CTR-PORT-001 (package format, owner F10 with F11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-078-10.R01 | This module is export-only. Importing a package into a node is owned by `11_Federation/01_protocol/mod_portable` (F11.S01.M01); profile content by F07.S02.M01 `mod_portable`. Consumers reference these by full ID. | MVP |
| PS-078-10.R02 | Export packages are not included in backups; backups of the source store are governed by F15.S03.M02 (`mod_backups`). | MVP |
| PS-078-10.R03 | A package is generated from a consistent snapshot (read at one revision per aggregate, documented as snapshot time). | MVP |
| PS-078-10.R04 | Rollback of a generator version never invalidates a `ready` package; the manifest carries `format_version`, and readers upcast on read. | MVP |
| PS-078-10.R05 | Packages generated before a later deletion may still contain deleted data; the subject is informed in the download screen that the package reflects the snapshot time. | MVP |

## Data / schema
Manifest: `format_version`, `snapshot_at`, `subject_pseudonym_scope`, `files[]` (`path`, `sha256`, `bytes`, `data_class`).

## Commands / queries / events
None beyond PS-078-04.

## States & transitions
Rollback: `ready` packages are unaffected; `generating` jobs restart on the previous generator version.

## Validation & errors
Unknown `format_version` MAJOR on read → `SCH.UNKNOWN_VERSION` (400, ops).

## Authorization
Restore of source data is operator-only with dual control (F15.S03.M02).

## Failure, idempotency, concurrency, offline
Snapshot read is repeatable; a deletion during generation is applied to the next export, not mid-package (documented).

## Privacy, retention, abuse
Package never enters backups (R02) so deletion does not need backup replay for packages.

## Observability & budgets
`export_snapshot_age_seconds` p95 ≤ 15 min (ASSUMPTION).

## Tests
- TEST-PS-078-10-01 (integration): package not present in backup manifest.
- TEST-PS-078-10-02 (rollback): generator v-1 reads package produced by v; manifest hashes still verify.

## Acceptance criteria
1. TEST-PS-078-10-01 and -02 pass.
2. Import route absent from this module's API (static route check).
3. Snapshot-time text present on download screen (UI check).

## Assumptions & open decisions
- PENDING: CTR-PORT-001 package format and ownership.
- PROVISIONAL (D10 default): user-controlled keys; recovery documented before import is specified in F11.
