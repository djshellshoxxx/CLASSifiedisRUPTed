# PS-013-10 — import, export, backup and rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_offer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-013-10.R01 | Owner export returns own offer revisions as JSON with `schema_version`; counterparty lines are omitted (CTR-PRV-001 R11). | MVP |
| PS-013-10.R02 | MVP has no import. Federated offer import is deferred until D01 is decided; no import path exists in MVP. | MVP |
| PS-013-10.R03 | Kill switch `offer.enabled` (feature flag) blocks new drafts and submits within 60 s; reads, locks and withdrawals stay available. | MVP |
| PS-013-10.R04 | Backups are encrypted; restore replays deletions issued after backup time (CTR-PRV-001 R06). | MVP |

## Data / schema
Export file: `{schema_version, exported_at, owner_acc_ref, offers: [ofr revisions]}`. Export contains no `par_` IDs of other parties.

## Commands / queries / events
Export is a query with `export` capability; export event carries counts only.

## States & transitions
Kill switch off: new `draft` and `submitted` transitions refused with `OFFER.DISABLED` (not retryable). Existing `submitted` offers expire normally.

## Validation & errors
`OFFER.DISABLED` added to PS-013-02 table for this rollback path. Export request for other users' data returns `SYS.NOT_FOUND`.

## Authorization
Export: owner only. Kill switch: `ope_` with change record.

## Failure, idempotency, concurrency, offline
Export is idempotent per request ID and runs from a consistent snapshot. Rollback forward-only: schema migrations follow CTR-SCH-001 expand-then-contract.

## Privacy, retention, abuse
Export and backups carry the same classes as live data; restored backups exclude expired notes.

## Observability & budgets
Export ≤ 30 s for 10,000 revisions (ASSUMPTION). Kill switch propagation ≤ 60 s.

## Tests
- TEST-PS-013-10-01 (integration): export excludes counterparty lines.
- TEST-PS-013-10-02 (integration): kill switch blocks submits within 60 s; reads still succeed.
- TEST-PS-013-10-03 (restore): deletion issued after backup is reapplied on restore.

## Acceptance criteria
1. Export fixture contains zero counterparty `lst_` IDs outside the owner's own offers.
2. Restore test reapplies 100% of post-backup deletions.

## Assumptions & open decisions
- ASSUMPTION: no offer federation or import in MVP.
- D01 OPEN: federated record protocol; deferred. D10 PROVISIONAL (Dxx default, unapproved): user-controlled keys for export decryption.
