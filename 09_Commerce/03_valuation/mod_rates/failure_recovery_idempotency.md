# PS-075-06 — failure, recovery, idempotency and offline behavior

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_rates (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R04, Failure section), CTR-EVT-001 (R03). **Decisions:** D03, D08 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-075-06.R01 | Source fetch timeout 3 s; retry 2 times with 1 s backoff; then the source is marked unavailable for that round. | MVP |
| PS-075-06.R02 | If fewer than 2 sources respond, no quote is issued (`RATE.INSUFFICIENT_SOURCES`). | MVP |
| PS-075-06.R03 | Consent with an expired quote is refused; the proposal stays unpinned and the UI offers re-quote. | MVP |
| PS-075-06.R04 | Offline clients never create quotes and never reuse a quote after `valid_until` (D08). | MVP |
| PS-075-06.R05 | Rate source outage does not affect existing pinned proposals. | MVP |

## Data / schema
Round record: `round_id`, `pair`, `sources_responded`, `result`, `at`.

## Commands / queries / events
Retries reuse the round key.

## States & transitions
Round states: `collecting`, `issued`, `refused`.

## Validation & errors
Per PS-075-02.

## Authorization
Sys-only.

## Failure, idempotency, concurrency, offline
Issuance race for same pair: one issued quote per (pair, round). Clock skew check: quote issued only if server clock is within 1 s of source timestamps (ASSUMPTION).

## Privacy, retention, abuse
Round records kept 30 days.

## Observability & budgets
Counter of rounds by result.

## Tests
- TEST-PS-075-06-01 (integration): one source timeout; two others respond; quote issued.
- TEST-PS-075-06-02 (integration): two sources down; no quote; error returned.
- TEST-PS-075-06-03 (integration): consent after expiry refused; re-quote offered.
- TEST-PS-075-06-04 (integration): source outage after pinning; proposal settles at pinned amount.

## Acceptance criteria
1. No quote issued without two responsive sources.
2. Pinned proposals unaffected by outages.

## Assumptions & open decisions
- ASSUMPTION: round and skew values.
- D03, D08 (PROVISIONAL, unapproved).
