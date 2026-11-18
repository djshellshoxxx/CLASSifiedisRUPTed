# PS-068-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_crypto (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R05, R09, R12, R13, state table), CTR-EVT-001 (R02). **Decisions:** D04 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-068-03.R01 | Claim states are exactly the CTR-COM-001 set. | MVP |
| PS-068-03.R02 | `EXTERNALLY_VERIFIED` requires an `adapter.verify` MATCH record. `FINAL` requires `adapter.finality` with confirmations ≥ threshold. | MVP |
| PS-068-03.R03 | A dropped or replaced transaction reverts `EXTERNALLY_VERIFIED` → `CLAIMED` (or `COUNTERPARTY_ATTESTED`) and `FINAL` → `REVERSED`. | MVP |
| PS-068-03.R04 | Each re-read of a transaction status is a state check, even when no change is seen. | MVP |
| PS-068-03.R05 | Adapter enable/disable does not change claim state. | MVP |

## Data / schema
Verification record per PS-068-01; transitions per CTR-COM-001 `clm.state_changed`.

## Commands / queries / events
`clm.verified`, `clm.finalized`, `clm.reorged`, `chain_adapter.disabled`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| `CLAIMED`, `COUNTERPARTY_ATTESTED` | `clm.verified` | adapter MATCH; sig valid | `EXTERNALLY_VERIFIED` | Store raw digest |
| `EXTERNALLY_VERIFIED` | `clm.finalized` | confirmations ≥ threshold; no open dispute; no reorg | `FINAL` | Label names verifier |
| `EXTERNALLY_VERIFIED` | `clm.reorged` | dropped or replaced | `CLAIMED` (or `COUNTERPARTY_ATTESTED`) | Keep prior record |
| `FINAL` | `clm.reorged` | reorg beyond finality policy | `REVERSED` | Notify both parties |
| `EXTERNALLY_VERIFIED` | `adapter.verify` no match | — | unchanged | `COM.*` code recorded |

Any other pair returns `COM.INVALID_TRANSITION`.

## Validation & errors
`COM.FINALITY_PENDING` (retry) while below threshold; `COM.VERIFIER_UNAVAILABLE` on adapter outage (state unchanged).

## Authorization
Adapter writes: `sys_` scoped to verification of one claim.

## Failure, idempotency, concurrency, offline
Poll loop per claim with backoff; duplicate adapter results are idempotent by (claim, adapter, block hash).

## Privacy, retention, abuse
State log holds hashes and enums only.

## Observability & budgets
Counter: `com_reorg_events_total` (CTR-COM-001). Histogram: verify latency.

## Tests
- TEST-PS-068-03-01 (unit): table rows pass; undefined pairs refused.
- TEST-PS-068-03-02 (integration): reorg dropped at 2 confirmations → `CLAIMED`; dropped after `FINAL` → `REVERSED`; both events appended.
- TEST-PS-068-03-03 (property): no path reaches `FINAL` without `clm.verified` and `clm.finalized`.
- TEST-PS-068-03-04 (integration): adapter disabled mid-flight leaves state unchanged.

## Acceptance criteria
1. No `FINAL` without adapter records (CTR-COM-001 acceptance 1).
2. Reorg transitions emit events.
3. Disabling an adapter changes no claim state.

## Assumptions & open decisions
- ASSUMPTION: per-chain confirmation thresholds (values OPEN).
- D04 (PROVISIONAL default, unapproved).
