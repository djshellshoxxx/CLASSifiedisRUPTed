# PS-118-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_relays. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-FED-001 (R13, Observability), CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-118-08.R01 | Metrics expose queue depth by state, batch results by status, and per-peer breaker state with hashed peer labels. | MVP |
| PS-118-08.R02 | Peer label uses keyed hash of `fpr_` (rotated monthly, ASSUMPTION) to bound cardinality and avoid raw IDs in dashboards. | MVP |
| PS-118-08.R03 | Traces carry no envelope content. | MVP |

## Data / schema
Metric catalog:
- `relay_queue_rows{state}` (gauge)
- `relay_batch_events_total{result}` (counter; result in accepted, duplicate, rejected, deferred)
- `relay_forward_duration_seconds` (histogram)
- `relay_breaker_state{peer_hash}`

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Metric emission failures never block queue writes.

## Authorization
Dashboards for `ope_` with relay operator role; peer-level diagnostics limited to `ope_` with `relay.read`.

## Failure, idempotency, concurrency, offline
Metrics buffered locally; loss acceptable, counted.

## Privacy, retention, abuse
Metric retention 90 days; traces 7 days; logs 14 days (ASSUMPTION). Trace sampling 10% success, 100% errors.

## Observability & budgets
| Measure | Target |
|---|---|
| enqueue ack p95 | ≤ 50 ms per batch of 100 |
| enqueue to first forward attempt p95 | ≤ 60 s + random delay (≤ 60 s) |
| queue scan per cycle | ≤ 5 s at 1 M rows (ASSUMPTION) |
| throughput | 600 events/min per peer, sustained across 50 peers (ASSUMPTION) |

## Tests
- TEST-PS-118-08-01 (unit): label hashing stable within rotation window.
- TEST-PS-118-08-02 (load): 50 peers at per-peer limit for 30 min meets targets.
- TEST-PS-118-08-03 (privacy): trace and metric dump scan finds no envelope bytes.

## Acceptance criteria
1. Dashboard shows queue depth and breaker state per peer hash.
2. Load test meets table targets.
3. No raw `fpr_` or `nod_` IDs appear in metric label values.

## Assumptions & open decisions
- ASSUMPTION: monthly label-hash rotation and throughput figures.
- D07 PROVISIONAL (unapproved): telemetry retention classes above.
