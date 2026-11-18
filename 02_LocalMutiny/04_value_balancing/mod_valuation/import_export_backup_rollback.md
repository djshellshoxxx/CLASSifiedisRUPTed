# PS-027-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_valuation. **Parent:** [mod_valuation SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-EVT-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-027-10.R01 | Participants export snapshots for cycles they participate in, JSON, schema `valuation.snapshot` 1.0.0, ≤ 256 KB per export. | MVP |
| PS-027-10.R02 | Export includes the quote IDs and rounding policy version used, so a third party can recompute the hash. | MVP |
| PS-027-10.R03 | Backup restore preserves snapshot rows and hashes exactly. Restore never recomputes a snapshot silently. | MVP |
| PS-027-10.R04 | Snapshot import is not supported in MVP. Import requests are rejected with `SYS.REQUEST_MALFORMED` (reason `not_supported`). | MVP |
| PS-027-10.R05 | Rollback of a release that changes rounding does not alter existing snapshots; they keep their recorded policy version. | MVP |

## Data / schema
Export envelope: `{ "schema_id": "valuation.snapshot.export", "schema_version": "1.0.0", snapshots: [...] }`. Rounding policy version recorded per snapshot.

## Commands / queries / events
Export is a query under `cyc.export`. Emits `valuation.snapshot_exported` with counts only.

## States & transitions
Not applicable. Restore runs under a maintenance lock; snapshot states are restored as recorded.

## Validation & errors
Digest mismatch on restore → `SYS.INTERNAL`, restore halted, state unchanged.

## Authorization
Export: participants. Restore: operator with dual control.

## Failure, idempotency, concurrency, offline
Restore idempotent by backup digest. Partial restore rolls back. No offline sync; local exports are plain files.

## Privacy, retention, abuse
Export files are FINANCIAL_EVIDENCE with a UI warning. Download links expire in 15 min. Export rate limit 10 per day per cycle.

## Observability & budgets
Restore ≤ 30 min for 1 million snapshots (ASSUMPTION). Metrics: `valuation_exports_total`, `valuation_restore_total{result}`.

## Tests
- TEST-PS-027-10-01 (integration): export then restore yields identical hashes.
- TEST-PS-027-10-02 (negative): non-participant export returns `SYS.NOT_FOUND`.
- TEST-PS-027-10-03 (negative): import request rejected with `not_supported`.
- TEST-PS-027-10-04 (fault): corrupted backup halts restore.
- TEST-PS-027-10-05 (regression): rounding policy change leaves old snapshot hashes unchanged.

## Acceptance criteria
1. Round-trip hash test passes.
2. Third-party recomputation script reproduces exported hashes.
3. Rollback runbook has no in-place snapshot edit step.

## Assumptions & open decisions
- ASSUMPTION: no signed export in MVP.
- PROVISIONAL: retention and export defaults per D07 default (unapproved). See [DECISIONS.md](../../../DECISIONS.md) D03, D07.
