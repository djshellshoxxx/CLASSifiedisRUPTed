# PS-076-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07, R11), CTR-SCH-001 (R07, R08), CTR-EVT-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-076-10.R01 | Subject export includes all consent records and their status history at their classes (PSEUDONYMOUS). | MVP |
| PS-076-10.R02 | Backup restore never resurrects a withdrawn or expired consent: restored state is reconciled against the event log before serving reads. | MVP |
| PS-076-10.R03 | Import of consent records from another node or migration is accepted only with a signed source record and `source = migration`; otherwise rejected. | MVP |
| PS-076-10.R04 | Rollback of a schema version never rewrites stored consent events (CTR-SCH-001 R07). | MVP |

## Data / schema
Export file: JSON, one record per line, schema `consent.export@1.0.0` (PENDING registry ID). Fields as in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Export is requested through the data-export flow owned by 10_Privacy/01_data_controls/mod_export (full ID). This module supplies records only.

## States & transitions
Restore reconciliation: restored record `revision` < log `revision` → replay events; never downgrade status.

## Validation & errors
| Code | Retryable | When |
|---|---|---|
| CONSENT.IMPORT_UNSIGNED | false | import without source signature |
| CONSENT.RESTORE_CONFLICT | false | restored state older than log (reconciled, logged) |

## Authorization
Export: subject (`consent.export`). Import: `sys_` migration principal only. Restore: `ope` with dual control.

## Failure, idempotency, concurrency, offline
Export is idempotent per (subject, export_request_id). Import is idempotent per `consent_id` + revision.

## Privacy, retention, abuse
Export files expire 7 days after download (ASSUMPTION). Backups follow platform backup schedule; restore does not extend retention.

## Observability & budgets
Metric `consent_restore_reconciled_total`. Export generation p95 ≤ 5 s for 10,000 records (ASSUMPTION).

## Tests
- TEST-PS-076-10-01 (restore): backup taken before withdrawal, restored, withdrawn state holds.
- TEST-PS-076-10-02 (import): unsigned import rejected.
- TEST-PS-076-10-03 (export): export contains no other subject's records.
- TEST-PS-076-10-04 (rollback): downgrade of schema leaves event bytes unchanged.

## Acceptance criteria
1. Restore test passes in 100% of runs.
2. Export shows only the requesting subject's data.
3. Rollback never rewrites stored events.

## Assumptions & open decisions
- ASSUMPTION: export expiry 7 days; export budget.
- PROVISIONAL (D07 default, unapproved) for retention defaults.
- PROVISIONAL (D10 default, unapproved): user-controlled keys govern signed import sources.
