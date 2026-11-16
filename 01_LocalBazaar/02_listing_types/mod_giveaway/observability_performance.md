# PS-005-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_giveaway. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 R10 (logs), CTR-PRV-001 R09 (pseudonymous telemetry), CTR-EVT-001 R02 (revision), CTR-CAP-001 R08 (audit records).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-005-08.R01 | Metrics per PS-005-03 and PS-005-06; no `acc_`, `prf_`, `gcl_` or coordinates as metric labels. | MVP |
| PS-005-08.R02 | Server logs record `code`, `request_id`, module, timing only. No bodies. | MVP |
| PS-005-08.R03 | Dashboards show claim funnel: submitted → accepted → handover → confirmed, by count, per day. | MVP |
| PS-005-08.R04 | Alert on accept-race losses spike or outbox lag p95 > 60 s. | MVP |
| PS-005-08.R05 | Per-listing analytics are aggregated only when ≥ 5 claims (ASSUMPTION, K_MIN analogue). | Future |

## Data / schema
Metric names: `giveaway_claims_total{event,code}`, `giveaway_transition_seconds`, `giveaway_outbox_lag_seconds`, `giveaway_claim_limit_hits_total`. Labels are enumerations only.

## Commands / queries / events
Command latency tagged by command name (enumeration) only.

## States & transitions
State counts reconcile with event counts per day (consistency check).

## Validation & errors
Validation failures counted by code; no input values.

## Authorization
Telemetry access follows F16 operator policy; no per-user drill-down without privileged grant.

## Failure, idempotency, concurrency, offline
Offline queue depth reported by client as aggregate only (no IDs).

## Privacy, retention, abuse
Telemetry is pseudonymous (CTR-PRV-001 R09). Retention RET-OPS, 30 d.

## Observability & performance
| Budget | Target (ASSUMPTION) |
|---|---|
| submit / accept / record_handover p95 server | ≤ 400 ms |
| list_for_listing p95 (≤ 50 rows) | ≤ 300 ms |
| outbox lag p95 | ≤ 60 s |
| listing view with claim count p95 | ≤ 300 ms |
| client pending indicator render | ≤ 100 ms after action |

## Tests
- TEST-PS-005-08-01: log scan fixture finds no body, coordinate or identifier fields.
- TEST-PS-005-08-02: load test at 200 submits/s meets p95 budget.
- TEST-PS-005-08-03: metric label cardinality test (no ID labels).

## Acceptance criteria
1. Each budget measured in CI or staging before release.
2. Log redaction passes on sampled production-like traffic.
3. Alerts fire in staging fault injection.

**Assumptions and open decisions:** All budgets are ASSUMPTION pending F15 review. No Dxx applies directly; D08 governs offline queue depth reporting. See [DECISIONS.md](../../../DECISIONS.md).
