# PS-110-08 — observability and performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_screenreader. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-110-08.R01 | Count announcements dispatched, dropped (dedupe) and fallback-used, by event key. | MVP |
| PS-110-08.R02 | Dispatch latency p95 ≤ 100 ms on reference device (ASSUMPTION). | MVP |
| PS-110-08.R03 | Metrics carry event_key and counts only, never text. | MVP |

## Data / schema
Metrics: `scr_announce_total{event_key,outcome}`, `scr_fallback_total{kind}`, `scr_dispatch_ms` histogram.

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Labels limited to registered event keys.

## Authorization
Metrics visible to Accessibility Lead and QA Lead roles.

## Failure, idempotency, concurrency, offline
Metrics buffered offline and dropped after 24 h.

## Privacy, retention, abuse
No principal IDs in client metrics.

## Observability & budgets
| Budget | Target |
|---|---|
| Dispatch p95 | ≤ 100 ms |
| Template query p95 | ≤ 100 ms |
| Bundle size added | ≤ 4 KiB gzip (ASSUMPTION) |

## Tests
- TEST-PS-110-08-01 performance: dispatch benchmark on reference device.
- TEST-PS-110-08-02 static: metric label set equals registry.

## Acceptance criteria
1. Metrics present in staging.
2. Budgets met in the performance run.
3. No text values in metric labels.

## Assumptions & open decisions
- ASSUMPTION: reference device defined at implementation.
- No Dxx decision directly affects observability.
