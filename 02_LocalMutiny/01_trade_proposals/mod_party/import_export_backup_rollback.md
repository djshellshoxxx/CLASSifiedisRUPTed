# PS-014-10 — import, export, backup and rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-014-10.R01 | Owner export returns the owner's own slots with `schema_version`; counterparty `acc_` and `prf_` are redacted. | MVP |
| PS-014-10.R02 | No MVP import. Federated slot import is deferred until D01 is decided. | MVP |
| PS-014-10.R03 | Kill switch `party.enabled` blocks invite and accept within 60 s; decline and withdraw stay available. | MVP |
| PS-014-10.R04 | Backups encrypted; restore reapplies deletions issued after backup (CTR-PRV-001 R06). | MVP |

## Data / schema
Export: `{schema_version, exported_at, owner_acc_ref, slots: [...]}`, with `region_cell_id` only for the owner's own slots.

## Commands / queries / events
Export is a query with `export` capability; export event carries counts only.

## States & transitions
With kill switch off: invite and accept return `PARTY.DISABLED` (not retryable). Existing invitations expire normally.

## Validation & errors
`PARTY.DISABLED` added for this rollback path.

## Authorization
Export: owner only. Kill switch: `ope_` with change record.

## Failure, idempotency, concurrency, offline
Export idempotent per request ID from a consistent snapshot. Migrations expand-then-contract (CTR-SCH-001).

## Privacy, retention, abuse
Exports never include counterparty identifiers.

## Observability & budgets
Export ≤ 30 s for 10,000 slots (ASSUMPTION). Kill switch propagation ≤ 60 s.

## Tests
- TEST-PS-014-10-01 (integration): export redacts counterparty `acc_` and `prf_`.
- TEST-PS-014-10-02 (integration): kill switch blocks invite within 60 s; decline still works.
- TEST-PS-014-10-03 (restore): post-backup deletion reapplied.

## Acceptance criteria
1. Export fixture has zero counterparty identifiers.
2. Restore reapplies 100% of post-backup deletions.

## Assumptions & open decisions
- ASSUMPTION: no slot federation in MVP.
- D01 OPEN: federated protocol deferred. D10 PROVISIONAL (Dxx default, unapproved): user-controlled keys for export decryption.
