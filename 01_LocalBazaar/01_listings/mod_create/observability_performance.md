# PS-002-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_create. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (commit latency, revision conflicts, rejections), CTR-ERR-001 (error metrics, BT-01 alert), CTR-PRV-001 (log redaction, K_MIN), CTR-CAP-001 (decision latency).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-002-08.R01 | Server-side `listing.create` latency p95 ≤ 300 ms, excluding client network (ASSUMPTION). | MVP |
| PS-002-08.R02 | Commit p95 ≤ 150 ms (CTR-EVT-001 budget). | MVP |
| PS-002-08.R03 | Logs for create never contain title, description, amount, currency or IP address. Region cell IDs are allowed. | MVP |
| PS-002-08.R04 | Every create request emits one log line with `request_id`, outcome, code and latency. | MVP |
| PS-002-08.R05 | Analytics on drafts report aggregates only, with K_MIN = 5 (CTR-PRV-001 R04). | MVP |

## Data / schema
Metrics and log fields are defined in this file. Labels use codes and enums only, never free text.

## Commands / queries / events
Metric set and log line apply to `listing.create`.

## States & transitions
Not applicable.

## Validation & errors
Metric `lst_create_rejections_total{code}` uses registry codes only. Error body construction ≤ 1 ms p95 (CTR-ERR-001 budget).

## Authorization
Decision metrics come from CTR-CAP-001 (`authz_decisions_total{action,outcome,reason_code}`).

## Failure, idempotency, concurrency, offline
Metric `lst_create_replays_total` counts replays. Offline replay acceptance is reported by `lst_create_offline_total{outcome}`.

## Privacy, retention, abuse
Logs and metrics are RET-OPS (30 days). Subject identifiers are pseudonymous. Redaction tests run on application logs, proxy logs and crash reports (CTR-PRV-001 BT-08).

| Signal | Alert |
|---|---|
| `PRV.PRECISE_LOCATION_FORBIDDEN` count > 0 in a 5 min window | Page (zero tolerance) |
| `LST.FIELD_INVALID` > 5% of creates for 5 min | Warn (CTR-ERR-001 BT-01) |
| Create success < 99% for 15 min | Page |
| `EVT.IDEMPOTENCY_KEY_REUSED` > 0.1% of creates | Warn (ASSUMPTION) |

## Observability & budgets
| Metric | Target |
|---|---|
| Validation time | p95 ≤ 5 ms (ASSUMPTION) |
| Throughput | 50 creates/s per node without breaching the latency targets (ASSUMPTION) |
| Error construction | ≤ 1 ms p95 |

## Tests
- TEST-PS-002-08-01 (log capture): create logs for 1,000 fixture requests contain no title, description, amount, currency or IP address.
- TEST-PS-002-08-02 (load): 50 creates/s for 10 min meets R01–R02 with error rate ≤ 0.1%.
- TEST-PS-002-08-03 (alert): injected precise-location event raises the page alert within 5 min.

## Acceptance criteria
1. Latency and commit budgets pass in TEST-PS-002-08-02.
2. Zero sensitive log fields in TEST-PS-002-08-01.
3. Every alert in the table is covered by a test or runbook entry.
4. TEST-PS-002-08-01 to -03 pass in CI.

## Assumptions & open decisions
- ASSUMPTION: latency and throughput targets are provisional until load data exists.
- PROVISIONAL (D07 default, unapproved): log and metric retention.
- Accessibility of client error display is not measured here; see PS-002-09.
