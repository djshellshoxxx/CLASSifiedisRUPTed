# PS-126-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_authorization](SPEC.md) (Security Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R09), CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-126-08.R01 | `authz.decide` p95 ≤ 5 ms and p99 ≤ 20 ms at 2,000 decisions/s on the reference fixture (ASSUMPTION). | MVP |
| PS-126-08.R02 | Revocation propagation lag p95 ≤ 60 s for online clients. | MVP |
| PS-126-08.R03 | Logs contain decision ID, reason code, policy version, module and timing; never request or object content. | MVP |
| PS-126-08.R04 | Metrics labels use bounded enums only. | MVP |

## Data / schema
Metric label sets: `outcome` (ALLOW, DENY), `reason_code` (CTR-CAP-001 enum), `command`, `principal_kind`.

## Commands / queries / events
Metrics for `authz.decide` and `grant.*` in [PS-126-04](commands_queries_events.md).

## States & transitions
Lag metric measured from `grant.revoked` commit to first DENY observed by a synthetic probe.

## Validation & errors
`authz_validation_failures_total{code}`.

## Authorization
Dashboards require `ope` with purpose `operations`; no principal labels visible.

## Failure, idempotency, concurrency, offline
Metric emission must not block decisions; drop metrics when buffer is full, never drop decisions.

## Privacy, retention, abuse
No subject IDs in metric labels. Traces sample 1% (ASSUMPTION).

## Observability & budgets
| Metric | Target |
|---|---|
| `authz_decisions_total{outcome,reason_code}` | — |
| `authz_decision_latency_ms` | p95 ≤ 5 |
| `authz_unavailable_total` | alert on > 0 for 1 min |
| `authz_revocation_lag_seconds` | p95 ≤ 60 |

Alerts: privileged reads outside an active case; co-approval pair above threshold; revocation lag > 60 s; DENY-rate spike per principal.

## Tests
- TEST-PS-126-08-01 (performance): 2,000 decisions/s, p95 ≤ 5 ms, p99 ≤ 20 ms.
- TEST-PS-126-08-02 (observability): log capture contains no object content.
- TEST-PS-126-08-03 (alert): injected privileged read outside case raises alert within 60 s.

## Acceptance criteria
1. Latency targets met on the reference fixture.
2. Revocation probe sees DENY within 60 s in 99% of runs.
3. No label set contains a subject or object ID.

## Assumptions & open decisions
- ASSUMPTION: throughput target and alert thresholds.
- PROVISIONAL (D07 default, unapproved): telemetry retention per RET-OPS.
