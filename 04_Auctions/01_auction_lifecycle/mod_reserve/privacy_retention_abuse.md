# PS-035-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_reserve. **Parent:** [mod_reserve SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-035-07.R01 | Reserve value and history are PRIVATE_PERSONAL (seller's private minimum). `reserve_status` is PUBLIC. | MVP |
| PS-035-07.R02 | Reserve value is deleted 30 days after the close record is written (PROVISIONAL, D07 default). The close record already excludes it (PS-034-01 R04). | MVP |
| PS-035-07.R03 | Reserve history rows are deleted with the reserve value at the same time. | MVP |
| PS-035-07.R04 | The reserve value is never disclosed to bidders, operators, federation peers, analytics or push previews (CTR-PRV-001). | MVP |
| PS-035-07.R05 | Per auction: ≤ 5 changes (PS-035-02 R06); per seller: ≤ 60 reserve changes per day across auctions (ASSUMPTION). | MVP |

## Data / schema
Retention fields: `purge_at`, `legal_hold` (F10 only). Purge removes `reserve_minor` and history rows; `reserve_met` in the close record remains.

## Commands / queries / events
Purge runs as `sys` and emits `auction.reserve.purged` with count only.

## States & transitions
ACTIVE → PURGED (close + 30 days). UNSET auctions have no retained reserve data.

## Validation & errors
Export or purge under legal hold → `SYS.CONFLICT` (reason `legal_hold`).

## Authorization
Seller may export own reserve history (`auc.read`, self). Purge is `sys`.

## Failure, idempotency, concurrency, offline
Purge idempotent per auction; never runs on an open auction.

## Privacy, retention, abuse
Abuse: reserve probing (repeated changes or repeated status checks to infer the minimum); seller collusion to inflate reserve to avoid sale. Controls: change limits (R05), status-only public projection, probing signal from PS-035-05 denials to F12. Pseudonyms do not hide repeated changes from the seller's own history.

## Observability & budgets
Metrics: `reserve_probing_signals_total`, `reserve_purged_total`. No reserve values in logs.

## Tests
- TEST-PS-035-07-01 (lint): reserve fields carry PRIVATE_PERSONAL; absent from public schemas.
- TEST-PS-035-07-02 (integration): purge at close + 30 days removes value and history; `reserve_met` remains in close record.
- TEST-PS-035-07-03 (abuse): 61st change in a day rejected with `SYS.RATE_LIMITED`.
- TEST-PS-035-07-04 (negative): log scan for reserve values finds none.

## Acceptance criteria
1. Retention job matches R02.
2. Log and event scans find zero reserve values.
3. Purge does not affect the close record's public fields.

## Assumptions & open decisions
- ASSUMPTION: 30-day post-close retention; 60 changes per seller per day.
- PROVISIONAL: D07 retention default (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
