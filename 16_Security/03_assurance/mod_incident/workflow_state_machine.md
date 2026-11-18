# PS-131-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_incident. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-131-03.R01 | Only transitions in the table are permitted. | MVP |
| PS-131-03.R02 | SEV1 incidents must reach `triaged` within 30 min of `detected_at` (ASSUMPTION), tracked as a timer. | MVP |
| PS-131-03.R03 | `closed` requires a completed post-incident review record and all notifications `sent` or `waived`. | MVP |
| PS-131-03.R04 | `reopened` is allowed within 30 days of `closed`; later reports open a new incident. | MVP |

## Data / schema
`status` in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Transitions emit `incident.<past-tense>` events (CTR-EVT-001 R10).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | declare | validated | detected | emit `incident.declared` |
| detected | triage | severity set; commander for SEV1/2 | triaged | emit `incident.triaged`; start containment timer |
| triaged | contain | containment action recorded | contained | emit `incident.contained` |
| contained | eradicate | root cause recorded | eradicated | emit `incident.eradicated` |
| eradicated | recover | service restored and verified | recovered | emit `incident.recovered` |
| recovered | close | review complete; notifications sent or waived | closed | emit `incident.closed` |
| closed | reopen | within 30 days; responder approval | reopened | emit `incident.reopened` |
| reopened | triage | as triaged | triaged | emit `incident.triaged` |

## Validation & errors
Invalid pair: `INCIDENT.TRANSITION_INVALID`.

## Authorization
Transitions need responder capability for the case (see [authorization_capabilities.md](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Timer expiry emits `incident.sla_breached` and does not change state.

## Privacy, retention, abuse
Transitions contain no personal data.

## Observability & budgets
Metric `incident_time_to_triage_seconds` (p95 target for SEV1 ≤ 30 min).

## Tests
- TEST-PS-131-03-01: unit, full transition table.
- TEST-PS-131-03-02: integration, SLA timer emits breach event at 30 min.

## Acceptance criteria
1. No closed incident without review record.
2. SLA breach event emitted within 60 s of deadline.

## Assumptions & open decisions
- ASSUMPTION: 30-min SEV1 triage target, 30-day reopen window.
- D07 (retention of closed incidents): PROVISIONAL (D07 default, unapproved).
