# PS-015-10 — import, export, backup and rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_two. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-015-10.R01 | Owner export returns the owner's cycles (status, timestamps, size) with `schema_version`; counterparties' IDs redacted. | MVP |
| PS-015-10.R02 | No MVP import; cycle federation deferred until D01 is decided. | MVP |
| PS-015-10.R03 | Kill switch `cycle.enabled` blocks new proposals within 60 s; accept, withdraw, lock and expiry keep running so open cycles resolve. | MVP |
| PS-015-10.R04 | Backups encrypted; restore reapplies post-backup deletions (CTR-PRV-001 R06). | MVP |

## Data / schema
Export: `{schema_version, exported_at, owner_acc_ref, cycles: [...]}`.

## Commands / queries / events
Export is a query with `export` capability.

## States & transitions
Kill switch off: `cycle.propose` refused with `TWO.DISABLED` (not retryable).

## Validation & errors
`TWO.DISABLED` added for rollback path.

## Authorization
Export: owner only. Kill switch: `ope_` with change record.

## Failure, idempotency, concurrency, offline
Forward-only migrations (expand-then-contract, CTR-SCH-001).

## Privacy, retention, abuse
Exports redact counterparties.

## Observability & budgets
Export ≤ 30 s for 10,000 cycles (ASSUMPTION).

## Tests
- TEST-PS-015-10-01 (integration): export redacts counterparties.
- TEST-PS-015-10-02 (integration): kill switch blocks proposals; open cycles still lock.
- TEST-PS-015-10-03 (restore): post-backup deletion reapplied.

## Acceptance criteria
1. Export fixture has zero counterparty identifiers.
2. Kill switch test passes with open cycles resolving.

## Assumptions & open decisions
- ASSUMPTION: no cycle import in MVP.
- D01 OPEN; D10 PROVISIONAL (Dxx default, unapproved): user-controlled export keys.
