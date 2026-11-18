# PS-033-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_bids. **Parent:** [mod_bids SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-033-05.R01 | Any eligible `acc_` except the seller may create a bid (`bid.create`, scope `global` for eligibility, relation check for seller). | MVP |
| PS-033-05.R02 | Own bids (including status) are readable by the bidder (`bid.read`, scope `self`). | MVP |
| PS-033-05.R03 | Bidder identity (`acc_`) is never returned to other users; only `prf_` view. | MVP |
| PS-033-05.R04 | Void (`bid.void`) requires `mod` or `ope` with `case:` scope, purpose `fraud_review`, and dual control for `ope` (CTR-CAP-001 R06, R07). | MVP |
| PS-033-05.R05 | Seller may read the bidder pseudonyms of its auction (`auc.read`, scope `self`) but not bidder `acc_` before close. | MVP |

## Data / schema
Action matrix:

| Principal | Action | Resource | Outcome |
|---|---|---|---|
| user, eligible bidder | `bid.create` | open auction | ALLOW |
| user, seller | `bid.create` | own auction | DENY → `SYS.FORBIDDEN` |
| user, suspended | `bid.create` | any | DENY → `SYS.FORBIDDEN` |
| user, bidder | `bid.read` | own bid | ALLOW (self) |
| user, other | `bid.read` | another's bid | DENY → `SYS.NOT_FOUND` |
| anonymous | `bid.read` | public history | ALLOW (public fields) |
| mod, case scope | `bid.void` | bid in `cas_` | ALLOW (grant) |
| ope, one approval | `bid.void` | bid | DENY (dual control) |
| sys | `bid.create` | any | DENY (no system bidding) |

## Commands / queries / events
Each command maps to a row above. Decision records hold outcome and reason code only.

## States & transitions
Eligibility is re-evaluated per placement. A suspension mid-auction blocks new bids but keeps existing ACCEPTED bids unless voided.

## Validation & errors
`SYS.FORBIDDEN` for visible-but-disallowed; `SYS.NOT_FOUND` otherwise.

## Authorization
Capability IDs: `bid.create`, `bid.read`, `bid.void`. Seller pseudonym read uses `auc.read`.

## Failure, idempotency, concurrency, offline
Decision TTL zero for placement and void. Revocation applies at next decision.

## Privacy, retention, abuse
`acc_` never appears in public responses. Moderator void creates `aud_` record with case ID and reason; no bid content beyond IDs.

## Observability & budgets
Metric `bids_authz_denials_total{action,code}`. Alert on repeated `SYS.FORBIDDEN` from seller accounts (shill probing).

## Tests
- TEST-PS-033-05-01 (negative): each matrix row returns stated outcome.
- TEST-PS-033-05-02 (negative): seller placement returns `SYS.FORBIDDEN`.
- TEST-PS-033-05-03 (negative): public history response contains no `acc_`.
- TEST-PS-033-05-04 (integration): void without second approver denied.

## Acceptance criteria
1. Matrix tests pass with zero unlisted outcomes.
2. Zero `acc_` identifiers in public schema scan.
3. Seller-side pseudonym view verified to exclude `acc_` before close.

## Assumptions & open decisions
- ASSUMPTION: moderator case grants max 72 h (CTR-CAP-001 R06).
- OPEN: whether seller-side pseudonym visibility is acceptable under D10. See [DECISIONS.md](../../../DECISIONS.md) D10.
