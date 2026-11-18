# PS-094-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_flags (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-094-10.R01 | No report records are imported from federated peers or third-party feeds. | MVP |
| PS-094-10.R02 | Reporters may export their own report status history (ids, reasons, dates); never other reporters or target owners' data. | MVP |
| PS-094-10.R03 | Moderator-side export only through mod_evidence legal-process path (PS-093-10). | MVP |
| PS-094-10.R04 | Backups are encrypted; restore re-applies retention purges before serving. | MVP |
| PS-094-10.R05 | Rollback disables intake only; triage and status reads continue. | MVP |

## Export
| Export | Scope | Format | Auth |
|---|---|---|---|
| Reporter history | own `rpt_` | JSON, schema report-export 1.0.0 | owner (CTR-PRV R11) |
| Case export | `cas_` | via PS-093-10 legal path only | ope dual approval |

Exports omit `dedupe_hmac`, other reporters' IDs and target owner identity.

## Backup and restore
- Daily encrypted snapshot; RPO 24 h, RTO 4 h (ASSUMPTION).
- Restore: purges and holds replayed first; dedupe rows older than 24 h dropped.

## Rollback
- Flag `flags.intake_enabled` off → `SYS.UNAVAILABLE` on submit (retryable). Existing reports remain triageable.
- Schema changes after first report are MINOR only.

## Federation
Reports are never federated. Cross-node moderation uses signed blocklist events from enforcement (PS-096), per CTR-FED-001 (OPEN format).

## Validation & errors
Import attempts → `FED.DATA_CLASS_NOT_ALLOWED` at federation boundary. Export of others' data → `SYS.FORBIDDEN`.

## Failure, idempotency, concurrency, offline
Export jobs are idempotent per (principal, date range). Partial exports are never delivered.

## Privacy, retention, abuse
Exports are rate-limited (one per 24 h per reporter). Export access is logged.

## Observability & budgets
`flags_exports_total`; restore duration RTO ≤ 4 h (ASSUMPTION).

## Tests
- TEST-PS-094-10-01 (export): reporter export lacks dedupe_hmac and other reporters' IDs.
- TEST-PS-094-10-02 (restore): purged reports absent after restore.
- TEST-PS-094-10-03 (rollback): intake off returns `SYS.UNAVAILABLE`; triage queue still loads.

## Acceptance criteria
1. Federation lint: no report schema is federated (CTR-FED-001 R03).
2. Rollback leaves existing report count unchanged.

## Assumptions & open decisions
- ASSUMPTION: RPO 24 h, RTO 4 h.
- PROVISIONAL (D10 default, unapproved): user-controlled export; operator-held keys for backups.
- PROVISIONAL (D07 default, unapproved): reporter export retained 7 days then purged.
