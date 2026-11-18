# PS-125-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_tenants](SPEC.md) (Platform Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-125-08.R01 | Tenant read p95 ≤ 10 ms with cache; ≤ 40 ms without (ASSUMPTION). | MVP |
| PS-125-08.R02 | `tenant.create` (excluding provisioning) p95 ≤ 500 ms. | MVP |
| PS-125-08.R03 | Suspension write denial effective ≤ 0 s after commit; cache expiry ≤ 60 s. | MVP |
| PS-125-08.R04 | Logs contain `tenant_id`, operation, code, request ID and timing only. | MVP |
| PS-125-08.R05 | Dashboards show status counts per tenant state, never tenant names. | MVP |

## Data / schema
Metric labels are bounded enums: `op`, `outcome`, `code`, `status`. `tenant_id` is never a metric label.

## Commands / queries / events
Metrics for each command in [PS-125-04](commands_queries_events.md).

## States & transitions
`tenant_status_total{status}` gauge reflects [PS-125-03](workflow_state_machine.md).

## Validation & errors
`tenant_validation_failures_total{code}`.

## Authorization
Metrics endpoints require `ope` with purpose `operations`; no tenant admin access.

## Failure, idempotency, concurrency, offline
Metric emission failures never block commands. Trace sampling 1% (ASSUMPTION).

## Privacy, retention, abuse
Logs and traces use the redaction rules in [PS-125-07](privacy_retention_abuse.md). Operational logs retained 30 days (RET-OPS).

## Observability & budgets
| Metric | Type | Target |
|---|---|---|
| `tenant_operations_total{op,outcome}` | counter | — |
| `tenant_provision_duration_ms` | histogram | p95 ≤ 2,000 ms (ASSUMPTION) |
| `tenant_config_revision_conflicts_total` | counter | alert if > 5% of updates over 1 h |
| `tenant_suspension_propagation_seconds` | histogram | p95 ≤ 60 |

Alerts: suspended-tenant write accepted (P1); provisioning failure rate > 5% over 1 h (ASSUMPTION); any `SYS.NOT_FOUND` anomaly spike for one admin.

## Tests
- TEST-PS-125-08-01 (performance): 1,000 tenants, 200 reads/s, p95 ≤ 10 ms with cache.
- TEST-PS-125-08-02 (observability): metrics contain no slug or `admin_ref` label values.
- TEST-PS-125-08-03 (alert): injected suspended-tenant write produces a P1 alert within 60 s.

## Acceptance criteria
1. Each metric in the table is emitted by the implementation (future phase).
2. No log line in the lifecycle test contains config values or display names.
3. Performance targets met on the reference fixture.

## Assumptions & open decisions
- ASSUMPTION: latency and sampling budgets as stated.
- PROVISIONAL (D07 default, unapproved): operational log retention 30 days.
