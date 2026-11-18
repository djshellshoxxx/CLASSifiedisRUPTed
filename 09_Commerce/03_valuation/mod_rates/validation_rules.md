# PS-075-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_rates (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R04, quote errors), CTR-ERR-001. **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-075-02.R01 | Quote issuance requires ≥ 2 active sources for the pair whose observations are within 0.5% of the median (ASSUMPTION). | MVP |
| PS-075-02.R02 | Source observation older than 5 min is stale and excluded (ASSUMPTION). | MVP |
| PS-075-02.R03 | Pair must exist in the registry for both currencies and be enabled. | MVP |
| PS-075-02.R04 | No API accepts a rate from a user or party. Any `rate` field in a request → `SYS.REQUEST_MALFORMED`. | MVP |
| PS-075-02.R05 | Consent-time check: a proposal may pin a quote only if `now` ≤ `valid_until`. | MVP |

## Data / schema
Rule enum: `min_sources`, `divergence`, `staleness`, `pair_enabled`, `user_rate_forbidden`, `quote_valid_at_consent`.

## Commands / queries / events
Applies to `quote.issue` and the consent hook.

## States & transitions
No quote is written on validation failure.

## Validation & errors
| Condition | Code | Category / HTTP | Retryable |
|---|---|---|---|
| Fewer than 2 sources | `RATE.INSUFFICIENT_SOURCES` | unavailable / 503 | true |
| Divergence above 0.5% | `RATE.SOURCE_DIVERGENCE` | unprocessable_state / 422 | true |
| All observations stale | `RATE.SOURCE_STALE` | unavailable / 503 | true |
| Pair not enabled | `RATE.PAIR_UNSUPPORTED` | unprocessable_state / 422 | false |
| User rate supplied | `SYS.REQUEST_MALFORMED` | validation / 400 | false |
| Quote expired at consent | `COM.QUOTE_EXPIRED` | unprocessable_state / 422 | false |

## Authorization
Issuance is `sys_` only (PS-075-05).

## Failure, idempotency, concurrency, offline
Divergence and staleness checks run at issuance time.

## Privacy, retention, abuse
Diagnostics carry source IDs and pair codes only.

## Observability & budgets
Alert on `RATE.SOURCE_DIVERGENCE` rate above 10% for any pair in an hour.

## Tests
- TEST-PS-075-02-01 (unit): each row of the error table.
- TEST-PS-075-02-02 (golden): divergence exactly 0.5% accepted; 0.51% rejected.
- TEST-PS-075-02-03 (contract): any request body with `rate` rejected.
- TEST-PS-075-02-04 (integration): consent at `valid_until` + 1 s refused with `COM.QUOTE_EXPIRED`.

## Acceptance criteria
1. Error table implemented.
2. No user-supplied rate path exists.
3. Divergence rule tested at boundary.

## Assumptions & open decisions
- ASSUMPTION: 0.5% divergence; 5-minute staleness; minimum 2 sources.
- D03 (PROVISIONAL default, unapproved).
