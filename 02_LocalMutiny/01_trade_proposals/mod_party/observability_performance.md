# PS-014-08 — observability and performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-014-08.R01 | Counters: `party_invite_total`, `party_accept_total`, `party_decline_total`, `party_expired_total`, `party_removed_total{reason_code}`. | MVP |
| PS-014-08.R02 | Invite p95 ≤ 250 ms; accept p95 ≤ 250 ms; list p95 ≤ 120 ms (ASSUMPTION). | MVP |
| PS-014-08.R03 | No `acc_`, `prf_` or region values as metric labels. | MVP |
| PS-014-08.R04 | Trace spans carry `cor_` and slot index only. | MVP |

## Data / schema
Histogram `party_slots_per_cycle` by cycle size bucket.

## Commands / queries / events
Event lag p95 ≤ 5 s from `recorded_at`.

## States & transitions
Gauge of slots by status, sampled every 60 s.

## Validation & errors
Error counters by code only.

## Authorization
Telemetry follows F16 grants; no identity content.

## Failure, idempotency, concurrency, offline
Metric failure never blocks commits.

## Privacy, retention, abuse
Logs pseudonymous IDs only (CTR-PRV-001 R09); metric retention 30 days (ASSUMPTION).

## Observability & budgets
Alerts: expiry sweep lag > 60 s; removal spike > 3× baseline in 1 h (abuse signal).

## Tests
- TEST-PS-014-08-01 (unit): label allow-list excludes forbidden keys.
- TEST-PS-014-08-02 (performance): 10,000 open cycles, invite and accept within budget.
- TEST-PS-014-08-03 (integration): removal-spike alert fires on injected spike.

## Acceptance criteria
1. Zero forbidden labels in fixtures.
2. Budgets met at stated scale in load test.

## Assumptions & open decisions
- ASSUMPTION: 10,000 open cycles is the MVP sizing target.
- D07 PROVISIONAL (Dxx default, unapproved): 30-day metric retention.
