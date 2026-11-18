# PS-038-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_sniping. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-038-05.R01 | Capabilities: `sniping.record`, `sniping.read_own`, `sniping.read_summary`, `sniping.read_detail`. All match CTR-CAP-001 pattern. | MVP |
| PS-038-05.R02 | Default deny. Bidders see only their own timing class; no other bidder's class. | MVP |
| PS-038-05.R03 | Sellers see summary counts for their own auctions only, with k >= 5 suppression. | MVP |
| PS-038-05.R04 | `sniping.read_detail` (per-bid timestamps with `bidder_id`) is limited to F12 moderators with a case scope. | MVP |

## Data / schema
Grant records per CTR-CAP-001. Seller link resolved via auction ownership in 01_auction_lifecycle.

## Commands / queries / events
Each command checks one capability before validation.

## States & transitions
Grant revocation has no effect on stored records; it affects reads only.

## Validation & errors
`CAP.DENIED` for missing capability; `CAP.SCOPE_MISMATCH` for seller querying another auction.

## Authorization
| Actor | Action | Resource | Capability |
|---|---|---|---|
| sys (bid path) | record timing | BidTimingEvent | sniping.record |
| bidder (acc_) | read own class | own bid timing | sniping.read_own |
| seller (acc_, owns auction) | read summary | auction aggregate | sniping.read_summary |
| mod (F12, case scope) | read detail | BidTimingEvent | sniping.read_detail |
| any other | any | any | deny |

## Failure, idempotency, concurrency, offline
Grant checks are synchronous with cache TTL <= 60 s.

## Privacy, retention, abuse
Seller cannot infer bidder identity from summaries (k >= 5). Detail access is logged with case ID.

## Observability & budgets
Denial counts by capability. Alert if seller summary queries exceed 60/min for one account (ASSUMPTION; scraping control).

## Tests
- TEST-PS-038-05-01 (negative): each actor-action pair allow/deny.
- TEST-PS-038-05-02 (scope): seller querying another auction gets CAP.SCOPE_MISMATCH.
- TEST-PS-038-05-03 (rate): 61st summary query in one minute is throttled.

## Acceptance criteria
1. Every command maps to one capability.
2. No seller or other bidder can see a bidder_id.
3. Scope and rate tests pass.

## Assumptions & open decisions
- ASSUMPTION: 60 queries per minute per account for summary reads.
- PROVISIONAL (no Dxx): detail read requires F12 case scope.
