# PS-026-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_mixed. **Parent:** [mod_mixed SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-EVT-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-026-10.R01 | Each participant can export their own legs (both sides) as JSON, schema `mixed.leg.v1`, ≤ 1 MB per export. | MVP |
| PS-026-10.R02 | Export never includes counterparties' descriptions, payment references or claim evidence digests beyond the participant's own claims. | MVP |
| PS-026-10.R03 | Backup restore preserves `revision`, `leg_index` order and consent state. Restore never re-sends claims or events. | MVP |
| PS-026-10.R04 | Import of legs is not supported in MVP. Any import attempt returns `SYS.GONE`-class rejection (`SYS.REQUEST_MALFORMED`, reason `not_supported`). | MVP |
| PS-026-10.R05 | Rollback of a release never edits legs. Corrections use new revisions or `DISPUTED` (CTR-COM-001). | MVP |

## Data / schema
Export envelope: `{ "schema_id": "mixed.leg.export", "schema_version": "1.0.0", "cyc_id", "revision", "legs": [...], "exported_at" }`. Export signature not included in MVP (ASSUMPTION).

## Commands / queries / events
Export is a query with action `cyc.export` (PS-026-05). Emits `mixed.leg.exported` with count only.

## States & transitions
Not applicable. Restore is a whole-aggregate operation under a maintenance lock.

## Validation & errors
Exports of legs under legal hold return `SYS.CONFLICT` (PS-026-07). Corrupt backup (digest mismatch) → `SYS.INTERNAL` with restore halted.

## Authorization
Export: participants only. Restore: `ope` with dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Restore is idempotent by backup digest. Partial restore is rolled back to the pre-restore snapshot. Offline clients keep their own export only as a local file; no sync.

## Privacy, retention, abuse
Export files are FINANCIAL_EVIDENCE and carry a warning in the UI. Export links expire in 15 min. Abuse: export rate limit 5 per day per cycle.

## Observability & budgets
Restore duration ≤ 30 min for 1 million legs (ASSUMPTION). Metric: `mixed_export_total`, `mixed_restore_total{result}`.

## Tests
- TEST-PS-026-10-01 (integration): export → restore round trip yields identical leg digests.
- TEST-PS-026-10-02 (negative): export by non-participant returns `SYS.NOT_FOUND`.
- TEST-PS-026-10-03 (negative): import request returns rejection with reason `not_supported`.
- TEST-PS-026-10-04 (fault): corrupted backup halts restore and leaves state unchanged.

## Acceptance criteria
1. Round-trip digest test passes.
2. Restore never produces a second `clm_` for an existing claim.
3. Rollback runbook has no step that edits legs in place.

## Assumptions & open decisions
- ASSUMPTION: no signed export in MVP.
- PROVISIONAL: retention and portability defaults follow D07 default (unapproved). Portability keys per D10 (OPEN). See [DECISIONS.md](../../../DECISIONS.md).
