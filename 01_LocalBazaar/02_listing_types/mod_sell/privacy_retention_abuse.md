# PS-006-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_sell. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01–R12, retention table), CTR-FED-001 (R02, R03, R08), CTR-COM-001 (R06), CTR-EVT-001 (R06, R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-006-07.R01 | Sell terms are PUBLIC or LOCATION_COARSE only. No precise location enters this module (CTR-PRV-001 R03). | MVP |
| PS-006-07.R02 | Buyer identity is visible only to the owner and the buyer, and only for requests on that listing. No public list of requesters or request counts. | MVP |
| PS-006-07.R03 | Sell and request events are never federated, exported as raw IDs, or placed in analytics (CTR-FED-001 R03). | MVP |
| PS-006-07.R04 | Request rate limit: ≤ 10 `request_purchase` per buyer per 24 h (ASSUMPTION). Excess returns `SELL.REQUEST_LIMIT` with `retry_after_ms`. | MVP |
| PS-006-07.R05 | Open reservations per buyer ≤ 3 (ASSUMPTION). Owner must decide a request within 7 days or it expires. | MVP |
| PS-006-07.R06 | A sale is recorded only from F09 claim states that CTR-COM-001 allows. Self-submitted claims never count. | MVP |
| PS-006-07.R07 | Repeated reservation expiries or cancellations by one account create an F12 signal. The module does not block on its own. | MVP |

## Data / schema
| Data | Class | Retention class (default) |
|---|---|---|
| price, currency, quantity, condition, pickup_method, sell_state | PUBLIC | RET-ACC (listing lifetime + 30 days) |
| region_cell | LOCATION_COARSE | RET-ACC |
| prq_ records, buyer_ref, reservation.trx_id | PSEUDONYMOUS | RET-PRIV; 90 days after decision (ASSUMPTION) |
| Declined, cancelled or expired requests | PSEUDONYMOUS | RET-OPS (30 days) |
| Sale and reservation events | PSEUDONYMOUS | RET-ACC |

## Commands / queries / events
Disclosure applies to `sell.list_requests` and `sell.get_request` (owner or buyer only). See [PS-006-04](commands_queries_events.md).

## States & transitions
Retention purge on request expiry, cancellation, or 90-day deadline (whichever is first) per CTR-PRV-001 R06.

## Validation & errors
Abuse limits return `SELL.REQUEST_LIMIT` (429). Validation errors never echo values (CTR-ERR-001 R07).

## Authorization
Owner and buyer see only their own participant fields. Moderator access to request records requires a case grant (see [PS-006-05](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Purge is idempotent and propagates to replicas and caches within 24 h (CTR-PRV-001 R06).

## Privacy, retention, abuse
Abuse controls: rate limit (R04), open-reservation cap (R05), reservation expiry (72 h) against hoarding, price-lock during reservation against bait-and-switch, and F12 signals for repeated expiry or terms churn (more than 5 price changes in 24 h, ASSUMPTION). Sybil exposure is reduced by F07 account tier as a gate on `request_purchase` (ASSUMPTION; F07 signal not yet defined). Repeated requests can reveal the graph of buyers and owners; responses never expose other requesters.

## Observability & budgets
Metrics carry no buyer or owner IDs in labels. See [PS-006-08](observability_performance.md).

## Tests
- TEST-PS-006-07-01 (unit): owner view of a listing with no request contains no buyer field.
- TEST-PS-006-07-02 (abuse): 11th request in 24 h returns `SELL.REQUEST_LIMIT` with `retry_after_ms`.
- TEST-PS-006-07-03 (negative): federation export of a listing with reservations excludes `prq_` and sale events.
- TEST-PS-006-07-04 (integration): request records purge at 90 days and from replicas within 24 h.
- TEST-PS-006-07-05 (abuse): a fourth open reservation for one buyer is refused.

## Acceptance criteria
1. No sell record exposes a buyer identity to a non-participant.
2. No federated payload contains `prq_` or sale data.
3. Rate and reservation caps are enforced server-side and tested.
4. Retention purge completes within 24 h of the deadline.

## Assumptions & open decisions
- D05 PROVISIONAL (default: coarse public regions; precision by explicit user disclosure only).
- D07 PROVISIONAL (default: minimal per-category retention with legal-hold exceptions). The 90-day request retention is ASSUMPTION within it.
- D01 PROVISIONAL (default: explicit opt-in federation). Sell records remain local.
