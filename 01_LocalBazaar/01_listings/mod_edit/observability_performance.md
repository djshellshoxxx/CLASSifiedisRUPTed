# PS-003-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_edit. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 R09 (pseudonymous telemetry), CTR-ERR-001 (error codes as labels), CTR-EVT-001 (outbox lag).

**Decision labels:** Budgets are ASSUMPTION (unapproved). Offline flush target depends on D08 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-003-08.R01 | Emit the metrics in the table below for every command and query. | MVP |
| PS-003-08.R02 | Metric labels are limited to `outcome`, `error_code`, `material`, `state`, `field`. No `lst_`, `acc_` or free text. | MVP |
| PS-003-08.R03 | Trace spans carry request ID (CTR-ID-001) and `listing_id` only when debugging is enabled, with 1 % sampling (ASSUMPTION). | MVP |
| PS-003-08.R04 | Alerts fire when conditions in the alert table hold for 15 min. | MVP |

## Data / schema
Metric and alert definitions only.

| Metric | Type | Labels |
|---|---|---|
| `listing_edit_total` | counter | `outcome`, `error_code`, `material` |
| `listing_edit_latency_ms` | histogram | `outcome` |
| `listing_edit_revision_conflict_total` | counter | `state` |
| `listing_edit_queue_depth` | gauge (client-reported, aggregated) | none |
| `listing_updated_outbox_lag_s` | histogram | none |
| `listing_edit_rate_limited_total` | counter | none |

## Commands / queries / events
Metrics per command: `listing.edit`, `listing.get_for_edit`.

## States & transitions
State label values come from [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
`error_code` label values come from [validation_rules.md](validation_rules.md) and CTR-ERR-001.

## Authorization
Denials counted under `error_code` only.

## Failure, idempotency, concurrency, offline
Outbox lag shows dispatch health (PS-003-06 R07).

## Privacy, retention, abuse
Telemetry retention RET-OPS (30 days). No content in logs. See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
| Operation | Budget (p95 unless stated) |
|---|---|
| `listing.edit` server | ≤ 300 ms; p99 ≤ 1 s |
| `listing.get_for_edit` server | ≤ 150 ms |
| `listing.updated` outbox dispatch | ≤ 5 s; 24 h hard limit |
| Offline queue flush, 20 edits, after reconnect | ≤ 10 s |

Alerts: revision conflict rate > 5 % for 15 min; outbox lag p95 > 60 s; `SYS.INTERNAL` rate > 0.5 %; rate-limit rate > 10 % of edits.

## Tests
- TEST-PS-003-08-01 (unit): each metric emitted with allowed labels only.
- TEST-PS-003-08-02 (load): 200 req/s edits meet latency budget.
- TEST-PS-003-08-03 (privacy): label-cardinality lint rejects `listing_id` or `acc_` labels.
- TEST-PS-003-08-04 (integration): induced outbox outage fires lag alert.

## Acceptance criteria
1. Every budget in the table is measured in the load test.
2. No metric or log line contains a `lst_`, `acc_` or content value.
3. Alerts are reviewed by F15 Platform (PENDING owner review).

## Assumptions & open decisions
- ASSUMPTION: all budget values and sampling rate.
- D08 (PROVISIONAL, Dxx default, unapproved): offline flush expectations.
- D07 (PROVISIONAL, Dxx default, unapproved): telemetry retention class.
