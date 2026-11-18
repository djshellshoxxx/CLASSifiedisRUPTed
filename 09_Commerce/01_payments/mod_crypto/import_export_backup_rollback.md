# PS-068-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_crypto (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R08), CTR-PRV-001 (R06, R07), CTR-FED-001 (R03). **Decisions:** D07, D09 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-068-10.R01 | No import of verification records from any third party; adapter registry import allowed only with two signatures from registered operators. | MVP |
| PS-068-10.R02 | Owner export includes owner claims, original signed bytes, and external references; excludes raw provider responses. | MVP |
| PS-068-10.R03 | Registry export is operator-only and public-data-only. | MVP |
| PS-068-10.R04 | Rollback that disables an adapter keeps prior verification records and states. | MVP |
| PS-068-10.R05 | Backup and restore preserve verification digests; restore replays redactions. | MVP |

## Data / schema
Export manifest: `schema_version`, `claim_count`, `sha256`, `generated_at`.

## Commands / queries / events
`clm.exported` (count only).

## States & transitions
Export lifecycle as PS-067-10.

## Validation & errors
`SYS.RATE_LIMITED` on export frequency.

## Authorization
Owner export only for own claims.

## Failure, idempotency, concurrency, offline
Idempotent export by export ID.

## Privacy, retention, abuse
Export files deleted 24 h after generation.

## Observability & budgets
Export p95 ≤ 10 s for 500 claims (ASSUMPTION).

## Tests
- TEST-PS-068-10-01 (contract): export excludes raw provider bodies.
- TEST-PS-068-10-02 (integration): disabled adapter leaves prior records readable.
- TEST-PS-068-10-03 (integration): restore reapplies redactions.
- TEST-PS-068-10-04 (unit): import with one signature refused.

## Acceptance criteria
1. Export matches R02.
2. Rollback changes no claim state.
3. Restore preserves digests.

## Assumptions & open decisions
- ASSUMPTION: export limit 1 per 24 h.
- D07, D09 (PROVISIONAL, unapproved).
