# PS-006-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_sell. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R09 logs), CTR-ERR-001 (R10), CTR-EVT-001 (R02), CTR-COM-001 (R12, R13).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-006-08.R01 | Every sell command and claim-event consumption emits one metric sample and one log line. No payload bodies in logs (CTR-ERR-001 R10). | MVP |
| PS-006-08.R02 | Metric labels contain no IDs (`lst_`, `prq_`, `acc_`, `trx_`), no free text, and no region cells. | MVP |
| PS-006-08.R03 | Claim-to-state lag (F09 claim event to `sell_state` update): p95 ≤ 60 s, p99 ≤ 5 min (ASSUMPTION). | MVP |
| PS-006-08.R04 | Server-side p95 targets: `set_terms` ≤ 300 ms; `request_purchase` ≤ 300 ms; `accept_request` ≤ 800 ms including the F09 call; `list_requests` (page ≤ 50) ≤ 250 ms (all ASSUMPTION). | MVP |
| PS-006-08.R05 | Alert when `SYS.UNAVAILABLE` rate > 0.5 % over 1 h, or when `reconcile_drift_total` > 0 for 30 min (ASSUMPTION). | MVP |

## Data / schema
Metrics (name, type, labels):

| Metric | Type | Labels |
|---|---|---|
| sell_command_total | counter | command, outcome (ok, error code class) |
| sell_state_transition_total | counter | from, to |
| sell_state_invalid_total | counter | from, event |
| reservation_age_seconds | histogram | outcome (accepted, released, sold) |
| sale_recorded_total | counter | method |
| claim_state_lag_seconds | histogram | none |
| reconcile_drift_total | counter | none |

## Commands / queries / events
Latency sampled per command in [PS-006-04](commands_queries_events.md).

## States & transitions
Transition counters map to rows T1–T10 in [PS-006-03](workflow_state_machine.md).

## Validation & errors
Counters by error code (CTR-ERR-001 registry), never by submitted value.

## Authorization
Dashboards are operator-visible; they show counts only and no principal-level data.

## Failure, idempotency, concurrency, offline
Metrics sampling must not block writes. Offline queue depth is reported per device only as an aggregate, never sent to the server by default (ASSUMPTION).

## Privacy, retention, abuse
Logs use request_id and `lst_` only for routine use. Buyer references appear only in audit records (`aud_`) under RET-AUD. Logs retained RET-OPS (30 days).

## Observability & budgets
Budgets as in R03–R04. Log redaction test blocks any `acc_` or `trx_` pattern in routine log output.

## Tests
- TEST-PS-006-08-01 (unit): metric label sets contain no ID or free-text pattern.
- TEST-PS-006-08-02 (load): 200 req/s mixed sell commands meet R04 p95 budgets on the reference profile (ASSUMPTION).
- TEST-PS-006-08-03 (integration): injected F09 delay of 90 s triggers the lag alert and clears it on recovery.
- TEST-PS-006-08-04 (unit): log redaction removes `acc_` and `trx_` from routine log lines.

## Acceptance criteria
1. Each metric in the table exists with its declared labels.
2. Budgets in R03–R04 pass the load test on the reference profile.
3. No routine log line contains a buyer or transaction identifier.
4. Both alerts in R05 fire and clear in the integration test.

## Assumptions & open decisions
- No Dxx decision is directly controlled by this file. Retention of logs follows D07 PROVISIONAL.
- ASSUMPTION: all budgets and thresholds above; reference load profile to be defined by F17.
