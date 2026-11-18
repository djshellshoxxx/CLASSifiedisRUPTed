# PS-075-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_rates (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R09), CTR-COM-001 (Privacy), CTR-FED-001 (R02). **Decisions:** D03, D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-075-07.R01 | Quotes contain no party identifiers; quote-to-proposal link is by `quote_id` only. | MVP |
| PS-075-07.R02 | Quote-shopping: a party may request at most 30 quotes per pair per hour (ASSUMPTION); quote requests are served from the current round, not new rounds. | MVP |
| PS-075-07.R03 | Source operators receive no proposal or party data. | MVP |
| PS-075-07.R04 | Quote history retained 24 months with claims that reference it (RET-EVD); unreferenced round records 30 days. | MVP |
| PS-075-07.R05 | Quotes are not federated in MVP (CTR-FED-001 financial evidence deferred). | MVP |

## Data / schema
Quotes PUBLIC; round records PSEUDONYMOUS (no party); source records PUBLIC.

## Commands / queries / events
Events carry IDs only.

## States & transitions
Per PS-075-03.

## Validation & errors
Rate-limit breach returns `SYS.RATE_LIMITED`.

## Authorization
Per PS-075-05.

## Failure, idempotency, concurrency, offline
Retention purge idempotent.

## Privacy, retention, abuse
- Oracle manipulation: divergence and minimum-source rules (PS-075-02).
- Source–party collusion: source operators are independent and disclosed; disabling is dual-controlled.
- Quote-shopping: R02 limit and single-round serving.

## Observability & budgets
Alert on R02 breaches per party pattern (aggregate, K_MIN respected).

## Tests
- TEST-PS-075-07-01 (lint): quote schema has no party field.
- TEST-PS-075-07-02 (abuse): 31st quote request in an hour rejected.
- TEST-PS-075-07-03 (contract): source operator role cannot read proposals.
- TEST-PS-075-07-04 (integration): retention purge of round records at 30 days.

## Acceptance criteria
1. No party data in quotes.
2. Abuse controls tested.

## Assumptions & open decisions
- ASSUMPTION: R02 limit.
- D03, D07 (PROVISIONAL, unapproved).
