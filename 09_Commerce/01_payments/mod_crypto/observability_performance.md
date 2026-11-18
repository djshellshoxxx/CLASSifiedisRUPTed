# PS-068-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_crypto (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (Observability section), CTR-EVT-001, CTR-PRV-001 (R09). **Decisions:** D04 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-068-08.R01 | `com_adapter_latency_ms{chain,provider}` p95 ≤ 2 s (CTR-COM-001). | MVP |
| PS-068-08.R02 | `com_transitions_total{from,to}` and `com_reorg_events_total{chain}`. Labels are enums only. | MVP |
| PS-068-08.R03 | Alert: any transition into `FINAL` without an adapter record (must be 0). | MVP |
| PS-068-08.R04 | Alert: provider disagreement sustained > 15 min on one chain. | MVP |
| PS-068-08.R05 | Logs: claim ID, chain (CAIP-2), code, provider ID, block height. No address or hash. | MVP |

## Data / schema
Closed metric label sets; chain IDs from registry.

## Commands / queries / events
Event counts by type.

## States & transitions
Gauge of crypto claims by state.

## Validation & errors
Counter by code and chain.

## Authorization
Dashboards aggregate per chain; addresses never shown.

## Failure, idempotency, concurrency, offline
Provider health per chain as a gauge.

## Privacy, retention, abuse
Metrics 90 days; logs 14 days (ASSUMPTION).

## Observability & budgets
Reorg events alert within 1 min of detection.

## Tests
- TEST-PS-068-08-01 (contract): metric label lint.
- TEST-PS-068-08-02 (load): 200 verifications per minute within latency budget (ASSUMPTION profile).
- TEST-PS-068-08-03 (integration): synthetic reorg triggers alert.
- TEST-PS-068-08-04 (unit): log redaction removes address and hash fields.

## Acceptance criteria
1. Latency and alert conditions verified in staging.
2. No address or tx hash in logs or metrics.
3. Must-be-zero alert tested.

## Assumptions & open decisions
- ASSUMPTION: load profile.
- D04 (PROVISIONAL default, unapproved).
