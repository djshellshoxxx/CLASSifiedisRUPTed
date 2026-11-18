# PS-132-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_response. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-132-08.R01 | Gauge `containment_open_actions{blast_radius}`. | MVP |
| PS-132-08.R02 | Histogram `response_action_latency_seconds{action_type}`. | MVP |
| PS-132-08.R03 | Alert when an approved action has not started within 5 min. | MVP |
| PS-132-08.R04 | Logs carry no tokens, key bytes or content. | MVP |

## Data / schema
Labels: `action_type`, `blast_radius`, `status`. No target IDs as labels.

## Commands / queries / events
Spans per step with `step_index`.

## States & transitions
N/A.

## Validation & errors
N/A.

## Authorization
Dashboards readable by F16 leads and incident responders.

## Failure, idempotency, concurrency, offline
Telemetry outage does not stop execution; the alert falls back to the F15 path.

## Privacy, retention, abuse
Telemetry 90 days (ASSUMPTION).

## Observability & budgets
| Signal | Target |
|---|---|
| approval to execution start | ≤ 5 min (alert) |
| step latency p95 | ≤ 2 s (ASSUMPTION) |
| command p95 | ≤ 500 ms |

## Tests
- TEST-PS-132-08-01: integration, alert fires for unexecuted approved action.
- TEST-PS-132-08-02: log scan for tokens.

## Acceptance criteria
1. Alert verified in drill.
2. Zero tokens found in logs.

## Assumptions & open decisions
- ASSUMPTION: targets above.
- D08 (offline status reads): PROVISIONAL (D08 default, unapproved).
