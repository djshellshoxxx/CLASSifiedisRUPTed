# PS-087-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_dedup. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-087-08.R01 | Check p95 ≤ 10 ms (ASSUMPTION). | MVP |
| PS-087-08.R02 | Hit ratio exported per peer (pseudonymous peer label). | MVP |
| PS-087-08.R03 | Equivocation count alert on any non-zero value. | MVP |

## Data / schema
Labels: `result`, `peer_class` (not peer ID).

## Commands / queries / events
Consumes `dedup.*` events.

## States & transitions
Not applicable.

## Validation & errors
Telemetry failure does not block checks.

## Authorization
Platform Lead and on-call.

## Failure, idempotency, concurrency, offline
Metric loss tolerated.

## Privacy, retention, abuse
Logs retained 30 days (ASSUMPTION).

## Observability & budgets
| Metric | Target |
|---|---|
| dedup_check_latency_ms p95 | ≤ 10 |
| dedup_equivocations_total | 0 |

## Tests
- TEST-PS-087-08-01 (performance): latency fixture.
- TEST-PS-087-08-02 (alert): seeded equivocation alerts.

## Acceptance criteria
1. Metrics exported; alert tested.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
