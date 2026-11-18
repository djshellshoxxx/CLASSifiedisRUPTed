# PS-111-10 — import, export, backup and rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_wcag. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-111-10.R01 | Conformance records export as a versioned report (JSON and PDF) for audit. | MVP |
| PS-111-10.R02 | Records are append-only; corrections are new records. | MVP |
| PS-111-10.R03 | Backups include all records and evidence digests; restore keeps append-only history. | MVP |

## Data / schema
Report JSON: `{"report_version":"1.0.0","app_version":"...","records":[...]}`.

## Commands / queries / events
Export is a read query; no command.

## States & transitions
Not applicable.

## Validation & errors
Import is not supported in MVP; a report is not an input.

## Authorization
Export by engineering and QA roles.

## Failure, idempotency, concurrency, offline
Restore never removes a record; it re-applies events in order.

## Privacy, retention, abuse
Reports contain no personal data.

## Observability & budgets
Report generation time ≤ 5 s for one app version (ASSUMPTION).

## Tests
- TEST-PS-111-10-01 integration: report contains every record for a version.
- TEST-PS-111-10-02 restore: backup-restore keeps history identical.

## Acceptance criteria
1. Report reproduces record contents byte-for-byte in canonical form.
2. No record is deleted by restore.

## Assumptions & open decisions
- ASSUMPTION: PDF rendering uses a reviewed library (selection PENDING research).
- No Dxx decision directly affects this process.
