# PS-034-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_close. **Parent:** [mod_close SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-EVT-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-034-10.R01 | Winner and seller export their own close records (JSON, `auction.close` 1.0.0, ≤ 128 KB). | MVP |
| PS-034-10.R02 | Public archive export (CSV) for closed auctions: end state, reason, amounts, bidder pseudonyms. No `acc_`, no reserve value. | MVP |
| PS-034-10.R03 | Backup restore preserves close records and `close_hash` values; restore never re-runs close, never re-emits events, never creates `trx_`. | MVP |
| PS-034-10.R04 | Close record import is not supported. Requests are rejected with `SYS.REQUEST_MALFORMED` (reason `not_supported`). | MVP |
| PS-034-10.R05 | Rollback of a release never edits a written close record. Errors are fixed by `auction.close_reversed` (PS-034-06 R05). | MVP |

## Data / schema
Export envelope: `{ "schema_id": "auction.close.export", "schema_version": "1.0.0", "records": [...] }`. Archive CSV header fixed per schema version.

## Commands / queries / events
Exports are queries (`auc.read`, self). Emits `auction.exported` with count only.

## States & transitions
Not applicable. Restore runs under maintenance lock.

## Validation & errors
Digest mismatch on restore → `SYS.INTERNAL`, halted.

## Authorization
Party export for own records; archive export public after close; restore by operator with dual control.

## Failure, idempotency, concurrency, offline
Restore idempotent by backup digest. Exports consistent at a recorded `final_revision`. No offline sync.

## Privacy, retention, abuse
Party exports FINANCIAL_EVIDENCE with UI warning; links valid 15 min; rate limit 5 per day. Archive CSV scanned for `acc_` before publication.

## Observability & budgets
Restore ≤ 15 min for 1 million records (ASSUMPTION). Metrics: `close_exports_total{kind}`, `close_restore_total{result}`.

## Tests
- TEST-PS-034-10-01 (integration): export → restore yields identical `close_hash` values.
- TEST-PS-034-10-02 (negative): archive CSV contains no `acc_` and no reserve value.
- TEST-PS-034-10-03 (negative): import request rejected with `not_supported`.
- TEST-PS-034-10-04 (fault): restore creates no `trx_` and emits no events.

## Acceptance criteria
1. Round-trip test passes.
2. Archive privacy scan passes on 1,000 closed auctions.
3. Rollback runbook has no step that edits a close record.

## Assumptions & open decisions
- ASSUMPTION: no signed export in MVP.
- PROVISIONAL: D07 retention (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
