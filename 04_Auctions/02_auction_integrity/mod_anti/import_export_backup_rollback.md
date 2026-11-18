# PS-036-10 — import export backup rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_anti. **Parent:** [mod_anti SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-036-10.R01 | Public export of an auction's schedule and extension log (JSON, `auction.schedule` 1.0.0, ≤ 64 KB). Available to anyone after close. | MVP |
| PS-036-10.R02 | Policy export: published `anti_policy` records, all versions, for audit. | MVP |
| PS-036-10.R03 | Backup restore preserves extension logs and `effective_end` exactly; restore never re-evaluates bids or re-emits events. | MVP |
| PS-036-10.R04 | Import of schedules or policies is not supported in MVP. Requests return `SYS.REQUEST_MALFORMED` (reason `not_supported`). | MVP |
| PS-036-10.R05 | Rollback of a release never changes a policy version or a published extension; corrections are new policy versions for future auctions only. | MVP |

## Data / schema
Export envelope: `{ "schema_id": "auction.schedule.export", "schema_version": "1.0.0", "auc_id", "log": [...] }`.

## Commands / queries / events
Export is a query (`auc.read`). Emits `auction.schedule.exported` with count only.

## States & transitions
Not applicable. Restore runs under maintenance lock and then runs the replay check (PS-036-06 R01).

## Validation & errors
Restore replay mismatch → `SYS.INTERNAL`, restore halted.

## Authorization
Export: public for closed auctions. Restore: operator with dual control.

## Failure, idempotency, concurrency, offline
Restore idempotent by digest. Replay check is mandatory after restore.

## Privacy, retention, abuse
Public exports contain no account identifiers. Export rate limit 20 per day per IP (ASSUMPTION).

## Observability & budgets
Restore ≤ 10 min for 10 million log rows (ASSUMPTION). Metrics: `antisnip_exports_total`, `antisnip_restore_total{result}`.

## Tests
- TEST-PS-036-10-01 (integration): export → restore → replay check passes; identical `effective_end`.
- TEST-PS-036-10-02 (negative): exported log contains no account identifiers.
- TEST-PS-036-10-03 (negative): import request rejected with `not_supported`.
- TEST-PS-036-10-04 (fault): corrupted log detected by replay check; restore halted.

## Acceptance criteria
1. Round-trip and replay checks pass.
2. Export privacy scan passes.
3. Rollback runbook has no step that edits published extensions.

## Assumptions & open decisions
- ASSUMPTION: no signed exports in MVP.
- PROVISIONAL: D07 retention (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
