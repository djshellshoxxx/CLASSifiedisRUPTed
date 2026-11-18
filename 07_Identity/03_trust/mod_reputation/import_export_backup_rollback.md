# PS-058-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_reputation. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R11 export; RET-LEGAL), CTR-SCH-001 (migrations), CTR-CAP-001, CTR-FED-001 (no federation in MVP).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-058-10.R01 | Owner export returns own counters, band history not included, and input summaries as `reputation.export` 1.0.0. | MVP |
| PS-058-10.R02 | Export excludes counterparty identifiers and other subjects' data. | MVP |
| PS-058-10.R03 | Backups encrypted; include counters, applied-input table, pair windows. | MVP |
| PS-058-10.R04 | Restore triggers full recompute and compares to backed-up counters; mismatch blocks cutover. | MVP |
| PS-058-10.R05 | Rules-version change requires recompute of all profiles in a staged job, not in place. | MVP |
| PS-058-10.R06 | Import of reputation from another platform. | Future (blocked on D01 and D10; not permitted in MVP) |

## Data / schema
`reputation.export`: `export_id` (opaque), `generated_at`, `counters`, `input_summary[]` (`source`, `count`, `period`), `schema_version`.

## Commands / queries / events
`RequestReputationExport` (owner, idempotent); event `reputation.export_ready` with `export_id` only.

## States & transitions
`queued` → `ready` (24 h) → `expired`.

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `REPUTE.EXPORT_RATE_LIMIT` | true | `err.repute.export_rate_limit` |
| `REPUTE.RESTORE_DRIFT` | false | `err.repute.restore_drift` |

## Authorization
Export: `reputation.read_own`. Restore: operator with dual control.

## Failure, idempotency, concurrency, offline
Export idempotent per `export_id`. Restore staged; drift check before cutover. Rules changes staged and versioned; rollback by reverting rules version and recompute.

## Privacy, retention, abuse
Export file deleted at 24 h. Backups 35 days (ASSUMPTION); legal hold per RET-LEGAL.

## Observability & budgets
`repute_export_total{result}`; staged recompute progress as aggregate.

## Tests
- TEST-PS-058-10-01 (contract): export schema validates.
- TEST-PS-058-10-02 (integration): export excludes counterparties.
- TEST-PS-058-10-03 (integration): restore drift blocks cutover.
- TEST-PS-058-10-04 (integration): rules-version rollback restores prior bands.

## Acceptance criteria
1. Export matches fixtures.
2. Restore drift check enforced.
3. Rules changes never applied in place.
4. Backup drill recorded.

## Assumptions & open decisions
- ASSUMPTION: backup retention 35 days.
- PROVISIONAL (D10 default, unapproved): no portability in MVP.
- PROVISIONAL (D07 default, unapproved): per-category retention.
