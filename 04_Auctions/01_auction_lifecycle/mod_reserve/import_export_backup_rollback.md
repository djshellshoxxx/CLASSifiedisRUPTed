# PS-035-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_reserve. **Parent:** [mod_reserve SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-035-10.R01 | Seller exports own reserve history for own auctions (JSON, `auction.reserve` 1.0.0, ≤ 64 KB). | MVP |
| PS-035-10.R02 | Export is available only before purge (PS-035-07 R02). After purge, the export returns `SYS.GONE`. | MVP |
| PS-035-10.R03 | Backup restore preserves reserve state, `set_at_revision` and history order; restore never re-emits events. | MVP |
| PS-035-10.R04 | Reserve import is not supported. Requests are rejected with `SYS.REQUEST_MALFORMED` (reason `not_supported`). | MVP |
| PS-035-10.R05 | Rollback never raises or lowers a reserve value. Corrections are new history rows by the seller only, while OPEN. | MVP |

## Data / schema
Export envelope: `{ "schema_id": "auction.reserve.export", "schema_version": "1.0.0", "auc_id", "history": [...] }`.

## Commands / queries / events
Export is a query under `auc.read` (self). Emits `auction.reserve.exported` with count only.

## States & transitions
Not applicable. Restore runs under maintenance lock; restored states are not re-evaluated against bids (bids are restored by F04.S01.M02).

## Validation & errors
Digest mismatch → `SYS.INTERNAL`, halted. Restore order violation (reserve restored before bids) → `SYS.CONFLICT`.

## Authorization
Export: seller. Restore: operator with dual control.

## Failure, idempotency, concurrency, offline
Restore idempotent by digest. Restore ordering: auctions, then bids, then reserve state re-checked for MET consistency.

## Privacy, retention, abuse
Exports are PRIVATE_PERSONAL; link valid 15 min; rate limit 5 per day. Export contains values, so the UI warns the seller.

## Observability & budgets
Restore ≤ 10 min for 1 million reserve rows (ASSUMPTION). Metrics: `reserve_exports_total`, `reserve_restore_total{result}`.

## Tests
- TEST-PS-035-10-01 (integration): export → restore yields identical history.
- TEST-PS-035-10-02 (negative): export after purge returns `SYS.GONE`.
- TEST-PS-035-10-03 (negative): import request rejected with `not_supported`.
- TEST-PS-035-10-04 (fault): restore that leaves a MET inconsistency is detected and halted.

## Acceptance criteria
1. Round-trip test passes.
2. Restore consistency check passes in fault suite.
3. Rollback runbook has no step that edits reserve values.

## Assumptions & open decisions
- ASSUMPTION: no signed export in MVP.
- PROVISIONAL: D07 retention (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
