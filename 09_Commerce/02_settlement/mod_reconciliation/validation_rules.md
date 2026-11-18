# PS-072-02 — validation rules and finding types

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_reconciliation (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (state table, R10, R12), CTR-ERR-001. **Decisions:** D04 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-072-02.R01 | Finding type `FINAL_WITHOUT_ADAPTER` is raised for every `FINAL` claim with no `clm.verified` and `clm.finalized` record. Target count: 0. | MVP |
| PS-072-02.R02 | `STATE_VERSION_GAP` when a claim's `state_version` is not contiguous. | MVP |
| PS-072-02.R03 | `DUPLICATE_TX` when two claims share (chain, tx_hash) (CTR-COM-001 R10). | MVP |
| PS-072-02.R04 | `STALE_PENDING` for offline-queued claims not acknowledged within 7 days. | MVP |
| PS-072-02.R05 | `ORPHAN_CLAIM` when `trx_` does not exist or is closed. | MVP |
| PS-072-02.R06 | `ADAPTER_GAP` when no adapter result exists for a claim in `EXTERNALLY_VERIFIED` for longer than the polling budget. | MVP |

## Data / schema
Finding-type enum: `FINAL_WITHOUT_ADAPTER`, `STATE_VERSION_GAP`, `DUPLICATE_TX`, `STALE_PENDING`, `ORPHAN_CLAIM`, `ADAPTER_GAP`.

## Commands / queries / events
Applies to `recon.run`.

## States & transitions
A run with `FINAL_WITHOUT_ADAPTER` findings is not `complete` until findings are resolved or dismissed with a case reference.

## Validation & errors
| Condition | Code | Category / HTTP | Retryable |
|---|---|---|---|
| Invalid scope | `SYS.REQUEST_MALFORMED` | validation / 400 | false |
| Run key already running | `SYS.CONFLICT` | conflict / 409 | true |
| Adapter unreachable during run | `RECON.COVERAGE_PARTIAL` (run status, not an HTTP error) | n/a | n/a |
| Dismiss without case reference | `RECON.CASE_REQUIRED` | validation / 400 | false |

## Authorization
Scope limited to the operator's permitted chains and windows.

## Failure, idempotency, concurrency, offline
Rules are pure functions of claim and adapter records at run time; results include the snapshot revision.

## Privacy, retention, abuse
Diagnostics show the rule name and claim ID only.

## Observability & budgets
Counter by finding type. Alert on any `FINAL_WITHOUT_ADAPTER` above 0.

## Tests
- TEST-PS-072-02-01 (unit): one fixture per finding type, each raising exactly that finding.
- TEST-PS-072-02-02 (unit): clean fixture yields zero findings.
- TEST-PS-072-02-03 (unit): dismiss without case reference rejected.
- TEST-PS-072-02-04 (property): rules are deterministic for the same snapshot.

## Acceptance criteria
1. Each finding type has a fixture and a test.
2. No finding is raised on fully verified data.
3. Dismiss path requires a case.

## Assumptions & open decisions
- ASSUMPTION: 7-day stale-pending window.
- D04 (PROVISIONAL default, unapproved).
