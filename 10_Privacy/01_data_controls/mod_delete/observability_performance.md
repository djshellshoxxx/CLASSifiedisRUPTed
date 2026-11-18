# PS-077-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_delete (Privacy Lead, F10; platform metrics via F15). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (metrics, zero-tolerance alerts), CTR-ERR-001 (R10 logging), CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-077-08.R01 | Metrics: `del_requests_total{scope}`, `del_state_total{state}`, `del_store_attempts_total{store_class,outcome}`, `del_propagation_lag_seconds` (histogram). | MVP |
| PS-077-08.R02 | Logs record `dsr_` ID, state, store class and counts; never target IDs of other parties, content or subject email. | MVP |
| PS-077-08.R03 | Alert when any deletion exceeds 24 h in `executing`. | MVP |
| PS-077-08.R04 | Alert when a `PRECISE` location value or `SECRET` value appears in deletion logs (zero tolerance). | MVP |
| PS-077-08.R05 | Dashboards aggregate by scope and store class with K_MIN = 5 suppression for any per-subject view (CTR-PRV-001 R04 analogue). | MVP |

## Data / schema
Metric labels limited to enums (`scope`, `state`, `store_class`, `outcome`). No subject ID as a label.

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Metric label validation at emit time; unknown label → dropped and counted as `del_metric_rejects_total`.

## Authorization
Dashboards readable by Privacy Lead and on-call operators; no per-subject view without case scope (CTR-CAP-001).

## Failure, idempotency, concurrency, offline
Metrics emission failure must not block deletion; buffer up to 10 min locally (ASSUMPTION).

## Privacy, retention, abuse
Logs RET-OPS (30 days). Metrics aggregated, no personal identifiers.

## Observability & budgets
Request command p95 ≤ 250 ms; executor end-to-end p95 ≤ 24 h per request for account scope excluding cooling-off (ASSUMPTION).

## Tests
- TEST-PS-077-08-01 (unit): label allowlist rejects `subject_acc_id` as label.
- TEST-PS-077-08-02 (log redaction): fixture deletion produces logs with no content values.

## Acceptance criteria
1. Each metric in R01 exposed in staging.
2. Zero matches for fixture secrets and coordinates in logs (TEST-PS-077-08-02).
3. Alert rules R03 and R04 tested with injected faults.

## Assumptions & open decisions
- ASSUMPTION: 10 min local metric buffer.
- PROVISIONAL (D07 default): log retention RET-OPS.
