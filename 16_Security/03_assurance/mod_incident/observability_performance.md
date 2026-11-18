# PS-131-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_incident. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-PRV-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-131-08.R01 | Gauge `incident_open_total{severity}` and histogram `incident_time_to_triage_seconds`. | MVP |
| PS-131-08.R02 | Alert within 60 s when a SEV1/SEV2 incident is open with no triage after 30 min. | MVP |
| PS-131-08.R03 | Dashboard shows counts only; no timeline text. | MVP |
| PS-131-08.R04 | Read p95 ≤ 100 ms; command p95 ≤ 500 ms (ASSUMPTION). | MVP |

## Data / schema
Metric labels: `severity`, `status`, `category`. No incident ID as label in metrics (cardinality and linkage risk).

## Commands / queries / events
Traces exclude request bodies.

## States & transitions
N/A.

## Validation & errors
N/A.

## Authorization
Dashboards readable by F16 leads.

## Failure, idempotency, concurrency, offline
Monitoring outage triggers a backup pager path owned by F15.

## Privacy, retention, abuse
Telemetry retention 90 days for security operations (ASSUMPTION).

## Observability & budgets
| Signal | Target |
|---|---|
| SEV1 time to triage | ≤ 30 min |
| read p95 | ≤ 100 ms |
| SLA breach alert latency | ≤ 60 s |

## Tests
- TEST-PS-131-08-01: integration, SLA alert fires in test clock.
- TEST-PS-131-08-02: log scan finds no timeline text.

## Acceptance criteria
1. SLA alert verified in drill.
2. Zero timeline text in logs or metrics.

## Assumptions & open decisions
- ASSUMPTION: targets above.
- D07 (telemetry retention): PROVISIONAL (D07 default, unapproved).
