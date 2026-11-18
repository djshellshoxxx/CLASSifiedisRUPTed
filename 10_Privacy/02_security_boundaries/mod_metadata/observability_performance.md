# PS-080-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_metadata (Privacy Lead, F10; platform via F15). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R09 redaction tests; zero-tolerance alerts), CTR-ERR-001 (R10), CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-080-08.R01 | Metrics: `meta_fields_removed_total{category}`, `meta_strip_failures_total`, `meta_fail_closed_total`, `meta_egress_dropped_total{surface}`, `meta_sanitize_seconds` (histogram). | MVP |
| PS-080-08.R02 | Labels: category and surface enums only. | MVP |
| PS-080-08.R03 | Alert on any residual GPS or author tag in clean output (zero tolerance). | MVP |
| PS-080-08.R04 | Alert when fail-closed rate > 0.1% of outbound payloads over 15 min. | MVP |
| PS-080-08.R05 | Log redaction scanner runs on application, proxy and analytics logs (CTR-PRV-001 BT-08). | MVP |

## Data / schema
Label allowlists in policy config.

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Label validation at emit.

## Authorization
Dashboards for Privacy and Security leads; no per-user views.

## Failure, idempotency, concurrency, offline
Metric failure never blocks sanitisation or egress.

## Privacy, retention, abuse
Logs RET-OPS.

## Observability & budgets
Egress filter ≤ 2 ms p95; sanitise ≤ 2 s p95 for 10 MiB; availability of egress filter 99.9% monthly (ASSUMPTION).

## Tests
- TEST-PS-080-08-01 (unit): label allowlist.
- TEST-PS-080-08-02 (alert): injected residual tag fires R03 alert.

## Acceptance criteria
1. Metrics present in staging.
2. Alert tests pass.
3. Budgets measured on corpus.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- PROVISIONAL (D07 default): log retention.
