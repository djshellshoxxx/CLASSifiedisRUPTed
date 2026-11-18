# PS-057-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_evidence. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (diagnostics), CTR-EVT-001 (lag), CTR-PRV-001 (log classes), CTR-CAP-001 R08.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-057-08.R01 | Each command, verification step and recompute emits counter and latency. | MVP |
| PS-057-08.R02 | `RecordEvidence` p95 ≤ 300 ms; signature verification p95 ≤ 5 ms; summary query p95 ≤ 100 ms. | MVP |
| PS-057-08.R03 | Logs contain `evidence_id`, `kind`, code only; never content, digest or signature. | MVP |
| PS-057-08.R04 | No subject, issuer or digest value as metric label. | MVP |
| PS-057-08.R05 | Alerts: `DIGEST_MISMATCH` or `SIGNATURE_INVALID` rate > 1% of records over 1 h; quarantine backlog > 100. | MVP |
| PS-057-08.R06 | Evidence views state "self-attested" or "issuer-signed" in text and assistive labels (WCAG 2.1 AA). | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `evidence_cmd_total` | counter | `command`, `result` |
| `evidence_validation_fail_total` | counter | `code` |
| `evidence_recompute_lag_seconds` | histogram | none |
| `evidence_quarantine_open` | gauge | none |
| `evidence_authz_deny_total` | counter | `action` |

## Commands / queries / events
Covers all commands in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
`evidence_transition_total{from,to}` per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Counters by code only.

## Authorization
Dashboards for F07 and F16 operators; no per-subject views.

## Failure, idempotency, concurrency, offline
Device queue depth reported in aggregate.

## Privacy, retention, abuse
Operational logs 30 days (RET-OPS); metrics 13 months aggregated; audit 12 months (RET-AUD).

## Observability & budgets
- Availability 99.9% monthly (ASSUMPTION).
- Load: 20 records/s peak, 500 summary reads/s (ASSUMPTION).
- Recompute lag p95 ≤ 60 s; hard alert at 15 min.

## Tests
- TEST-PS-057-08-01 (unit): counters increment once per command.
- TEST-PS-057-08-02 (privacy scan): no content, digest or signature in logs or metrics.
- TEST-PS-057-08-03 (load): 20 writes/s and 500 reads/s within budget.
- TEST-PS-057-08-04 (a11y): "self-attested" labels exposed to assistive tech.

## Acceptance criteria
1. Dashboards and alerts exist for each metric.
2. Redaction verified.
3. Budgets met under load.
4. No subject identifiers in labels.

## Assumptions & open decisions
- ASSUMPTION: availability and load targets above.
- PROVISIONAL (D07 default, unapproved): log retention 30 days.
