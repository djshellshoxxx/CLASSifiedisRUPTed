# PS-085-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10 server logs), CTR-PRV-001 (R09 telemetry), CTR-FED-001 (R10 limits enforced before verification), CTR-EVT-001 (R12 payload limits).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-085-08.R01 | Metrics: `fed_signature_sign_total{result}`, `fed_signature_verify_total{result}`, `fed_signature_verify_duration_seconds` (histogram), `fed_key_cache_hit_ratio`, `fed_outbox_held_total{reason}`. Labels contain no personal data. | MVP |
| PS-085-08.R02 | Latency budgets (ASSUMPTION, single core, excludes network): sign p95 ≤ 2 ms per event; verify p95 ≤ 2 ms per event; 100-event batch verify p95 ≤ 250 ms; key lookup p95 ≤ 5 ms on cache hit, ≤ 20 ms on miss. | MVP |
| PS-085-08.R03 | Alerts: any sign failure sustained for 5 min → page. Peer invalid ratio > 5% over 1 h → review queue. Key expiring within 14 days without a successor → warning to F16. | MVP |
| PS-085-08.R04 | Logs are structured JSON with the fields in PS-085-07 R03. Signature values and payload bytes are excluded. | MVP |
| PS-085-08.R05 | Throughput: verification sustains ≥ 600 events/min per peer, matching the rate limit in CTR-FED-001 R11, with headroom ≥ 2× (ASSUMPTION). | MVP |

## Data / schema
Metric and log schemas are registered in CTR-SCH-001 (PENDING). Field names are fixed.

## Validation & errors
Telemetry for each code in PS-085-02. Unknown code values are logged as `unknown` and counted, not dropped.

## Authorization
Dashboards are restricted to operators (PS-085-05). Peers never see metrics.

## Failure, idempotency, concurrency, offline
Metric emission is non-blocking. A telemetry outage does not block verification (fail open for telemetry only; fail closed for verification).

## Privacy, retention, abuse
Telemetry follows CTR-PRV-001 R09. Logs follow PS-085-07 retention.

## Observability & budgets
This file is the budget source for PS-085-02 and PS-085-06. Accessibility is not applicable: this module has no UI. Operator views belong to F15.

## Tests
- TEST-PS-085-08-01 (perf): 100-event batch verify p95 ≤ 250 ms on the reference runner (ASSUMPTION runner spec, F15).
- TEST-PS-085-08-02 (unit): metric label sets contain no fields outside the allowed list.
- TEST-PS-085-08-03 (integration): injected sign failure for 5 min raises the page alert.
- TEST-PS-085-08-04 (integration): telemetry backend down; verification results unchanged.

## Acceptance criteria
1. All budgets measured in CI on the reference runner; TEST-PS-085-08-01 passes.
2. Label sets are clean; TEST-PS-085-08-02 passes.
3. Telemetry outage does not change verification outcomes; TEST-PS-085-08-04 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: latency and throughput budgets above (F15 to confirm on reference hardware).
- PENDING CTR-SCH-001: metric and log schema IDs.
