# PS-032-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_quotes. **Parent:** [mod_quotes SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-EVT-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-032-10.R01 | Provider exports own quotes; customer exports quotes addressed to them. JSON, schema `svcquote.quote` 1.0.0, ≤ 1 MB per export. | MVP |
| PS-032-10.R02 | Export includes `price_hash` so recipients can verify the price they accepted. | MVP |
| PS-032-10.R03 | Backup restore preserves states, `trx_id` links and `price_hash`; restore never re-sends events or creates `trx_` rows. | MVP |
| PS-032-10.R04 | Quote import is not supported in MVP; requests are rejected with `SYS.REQUEST_MALFORMED` (reason `not_supported`). | MVP |
| PS-032-10.R05 | Rollback of a release never edits ACCEPTED quotes; corrections go through F09 disputes. | MVP |

## Data / schema
Export envelope: `{ "schema_id": "svcquote.quote.export", "schema_version": "1.0.0", "quotes": [...] }`. Scope text included only for the requesting party's own quotes.

## Commands / queries / events
Export is a query under `svq.read`. Emits `svcquote.exported` with count only.

## States & transitions
Not applicable. Restore runs under maintenance lock.

## Validation & errors
Digest mismatch → `SYS.INTERNAL`, restore halted.

## Authorization
Export by parties only. Restore by operator with dual control.

## Failure, idempotency, concurrency, offline
Restore idempotent by backup digest. Offline export is a local file; no sync.

## Privacy, retention, abuse
Exports are FINANCIAL_EVIDENCE with UI warning; links valid 15 min; export rate limit 10 per day.

## Observability & budgets
Restore ≤ 20 min for 1 million quotes (ASSUMPTION). Metrics: `svcquote_exports_total`, `svcquote_restore_total{result}`.

## Tests
- TEST-PS-032-10-01 (integration): export → restore round trip; identical `price_hash` values.
- TEST-PS-032-10-02 (negative): non-party export returns `SYS.NOT_FOUND`.
- TEST-PS-032-10-03 (negative): import request rejected with `not_supported`.
- TEST-PS-032-10-04 (fault): restore does not create duplicate `trx_` rows.

## Acceptance criteria
1. Round-trip test passes with hash equality.
2. Restore audit shows zero new `trx_` or events.
3. Rollback runbook has no in-place ACCEPTED edits.

## Assumptions & open decisions
- ASSUMPTION: no signed exports in MVP.
- PROVISIONAL: D07 retention and D06 signed-statement defaults (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
