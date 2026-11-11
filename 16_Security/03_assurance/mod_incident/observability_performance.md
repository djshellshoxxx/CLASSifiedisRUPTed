# PS-131-08 — Observability and performance: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-08.R01** Incident counts, durations and SLA breaches are measured per CTR-OBS-001 with labels limited to category and severity.
- **PS-131-08.R02** Open and annotate meet the write budget (p95 ≤ 300 ms) at 50 req/s.
- **PS-131-08.R03** SLA sweep lag is observable and alerting.

## Specification

**Metrics**
- classrup_security_incidents_total{category,severity,outcome=opened|closed}
- classrup_security_incident_ack_ms{severity} (histogram)
- classrup_security_incident_contain_ms{severity} (histogram)
- classrup_security_incident_sla_breach_total{severity,stage}
- classrup_security_incident_hook_overflow_total

**Logs**
- relay info incident.opened {incidentId, category, severity, correlationId} — no timeline text.

**Budgets**
- open, annotate and triage p95 ≤ 300 ms; list p95 ≤ 150 ms for 50 items.
- SLA sweep over 10 000 incidents completes in ≤ 2 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T04 | integration | PS-131-03.R03, PS-131-08.R03 | injected clock past SEV1 15-minute acknowledgement and 60-minute containment targets | SLA breach timeline entries and metrics; status unchanged |
| TEST-PS-131-09.T12 | load | PS-131-08.R01, PS-131-08.R02 | 50 req/s mixed open and annotate for 5 minutes; SLA sweep 10 000 incidents | p95 ≤ 300 ms; sweep ≤ 2 s |

## Dependencies

Module depends on: F16.S01.M01, F16.S01.M02, F16.S02.M02, F16.S02.M03, F16.S03.M01, F18.S01.M01, F08.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
