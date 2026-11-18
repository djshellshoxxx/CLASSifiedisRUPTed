# PS-046-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_fairness. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11), CTR-FED-001 (no federation), CTR-SCH-001 (R07).

**Decision labels:** D07 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-10.R01 | Policy export is public (caps and label). Audit export is aggregated, operator-only. | MVP |
| PS-046-10.R02 | No import of policies from peers or files; policy changes only through PS-046-03 workflow. | MVP |
| PS-046-10.R03 | Backups restore policy history; audit rows restore without seller buckets (keys destroyed). | MVP |
| PS-046-10.R04 | Forward-only schema; upcast on read. | MVP |
| PS-046-10.R05 | Flag `fairness.enabled` off returns unconstrained order with `constraint_status = DISABLED`; promotion labels still shown. | MVP |

## Data / schema
Policy export: `export_id`, `schema_version`, `policies[]`, `sha256`.

## Commands / queries / events
`rank_policy.export` (public), `exposure.export` (aggregated, operator).

## States & transitions
Export changes no state.

## Validation & errors
`FAIRNESS.IMPORT_NOT_ALLOWED` (403).

## Authorization
Public policy export; aggregated audit export for operators with purpose and dual control.

## Failure, idempotency, concurrency, offline
Exports idempotent per snapshot ID.

## Privacy, retention, abuse
No seller-level content in exports.

## Observability & budgets
`fairness_export_total`; p95 ≤ 5 s (ASSUMPTION).

## Tests
- TEST-PS-046-10-01 (contract): public export has no audit data.
- TEST-PS-046-10-02 (negative): import attempt rejected.
- TEST-PS-046-10-03 (backup): restored audit rows contain no seller buckets.
- TEST-PS-046-10-04 (rollback): flag off serves DISABLED status and keeps labels.

## Acceptance criteria
1. No seller-level data in exports.
2. No import path.
3. Labels persist under rollback.

## Assumptions & open decisions
- ASSUMPTION: export windows.
