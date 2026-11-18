# PS-047-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_relevance. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11), CTR-FED-001 (no federation), CTR-SCH-001 (R07).

**Decision labels:** D07 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-10.R01 | Public export of model summaries (weights, status, scope); no user data. | MVP |
| PS-047-10.R02 | No model import from peers or files; models enter only via PS-047-03 workflow. | MVP |
| PS-047-10.R03 | Backups restore model history; shadow comparison rows restored as aggregates. | MVP |
| PS-047-10.R04 | Forward-only schema; upcast on read. | MVP |
| PS-047-10.R05 | Flag `relevance.enabled` off serves the baseline order (recency only) with `model_status = DISABLED`. | MVP |

## Data / schema
Export: `export_id`, `schema_version`, `models[]` (summary), `sha256`.

## Commands / queries / events
`ranking_model.export` query (public summary).

## States & transitions
Export changes no state.

## Validation & errors
`RELEV.IMPORT_NOT_ALLOWED` (403).

## Authorization
Public summary export; full model export operator-only with dual control.

## Failure, idempotency, concurrency, offline
Export idempotent per snapshot ID.

## Privacy, retention, abuse
No user-level data in exports.

## Observability & budgets
`relevance_export_total`; p95 ≤ 5 s (ASSUMPTION).

## Tests
- TEST-PS-047-10-01 (contract): public export contains no per-user data.
- TEST-PS-047-10-02 (negative): import attempt rejected.
- TEST-PS-047-10-03 (backup): restored shadow rows are aggregates only.
- TEST-PS-047-10-04 (rollback): flag off serves recency-only baseline with DISABLED status.

## Acceptance criteria
1. Exports have no user-level data.
2. No import path exists.
3. Rollback serves a flagged baseline.

## Assumptions & open decisions
- ASSUMPTION: baseline order is recency-only.
- PROVISIONAL (D07 default, unapproved).
