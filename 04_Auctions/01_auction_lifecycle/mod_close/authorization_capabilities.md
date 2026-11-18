# PS-034-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_close. **Parent:** [mod_close SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-034-05.R01 | Only `sys` may run `close.run`. No user or operator can trigger close early. | MVP |
| PS-034-05.R02 | Only the seller may cancel, and only with zero accepted bids (`auc.cancel`, scope `self`). | MVP |
| PS-034-05.R03 | Only the winning bidder may confirm (`auc.confirm`, scope `participant`). | MVP |
| PS-034-05.R04 | Winner identity is visible to the seller after confirmation only (`owner` field visibility), and to the winner always. | MVP |
| PS-034-05.R05 | Operator cancel requires `case:` scope and dual control (CTR-CAP-001 R06, R07). Purpose `auction_integrity`. | MVP |
| PS-034-05.R06 | Reserve value is never readable by the close module's callers except `sys` for the comparison; `sys` writes only `reserve_met`. | MVP |

## Data / schema
Action matrix:

| Principal | Action | Resource | Outcome |
|---|---|---|---|
| sys | `auc.execute` (close) | auction at revision | ALLOW |
| user, seller | `auc.cancel` | own auction, zero bids | ALLOW |
| user, seller | `auc.cancel` | own auction, bids exist | DENY → `CLOSE.CANCEL_WITH_BIDS` |
| user, winner | `auc.confirm` | close record | ALLOW (participant) |
| user, other bidder | `auc.confirm` | close record | DENY → `SYS.NOT_FOUND` |
| user, seller | `auc.read` | winner before confirm | DENY (field `never` until confirm) |
| mod, case scope | `auc.cancel` | auction in `cas_` | ALLOW (grant, dual control if ope) |
| ope, single approval | `auc.cancel` | auction | DENY (dual control) |

## Commands / queries / events
Each command maps to a row. Decision records hold outcome and reason only.

## States & transitions
Relation rules re-evaluated per command. Winner loses confirm right after UNCONFIRMED.

## Validation & errors
`SYS.FORBIDDEN` for visible-but-disallowed; `SYS.NOT_FOUND` for hidden.

## Authorization
Capabilities: `auc.execute`, `auc.cancel`, `auc.confirm`, `auc.read`.

## Failure, idempotency, concurrency, offline
Decision TTL zero for writes and FINANCIAL_EVIDENCE reads. Revocation effective next decision.

## Privacy, retention, abuse
`aud_` records for every operator read of close records (purpose, decision ID, no content).

## Observability & budgets
Metric `close_authz_denials_total{action,code}`. Alert on any non-`sys` attempt to run close.

## Tests
- TEST-PS-034-05-01 (negative): each matrix row returns stated outcome.
- TEST-PS-034-05-02 (negative): user attempt to call `close.run` returns `SYS.FORBIDDEN`.
- TEST-PS-034-05-03 (integration): seller sees winner only after confirmation.
- TEST-PS-034-05-04 (negative): operator cancel without second approver denied.

## Acceptance criteria
1. Matrix tests pass with zero unlisted outcomes.
2. No test path lets a non-sys principal close an auction.
3. Winner identity absent from seller-facing responses before confirmation.

## Assumptions & open decisions
- ASSUMPTION: moderator grants max 72 h.
- OPEN: whether seller may see winner pseudonym before confirmation. See [DECISIONS.md](../../../DECISIONS.md) D10.
