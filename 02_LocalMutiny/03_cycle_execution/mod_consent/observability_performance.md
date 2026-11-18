# PS-021-08 — Observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-021-08.R01 | Consent command server p95 ≤ 300 ms, p99 ≤ 800 ms at 200 commands/s (ASSUMPTION). | MVP |
| PS-021-08.R02 | Consent-state read p95 ≤ 100 ms. | MVP |
| PS-021-08.R03 | Metrics labels never include `acc_`, `cyc_` or `snapshot_hash`. | MVP |
| PS-021-08.R04 | Consent-to-lock handoff latency p95 ≤ 2 s after last ACCEPTED. | MVP |

## Data / schema
Metrics: `cycle_consent_commands_total{decision,code}`, `cycle_consent_latency_seconds`, `cycle_consent_state{state}` gauge.

## Commands / queries / events
Trace spans per command; span attributes contain `consent_id` only.

## States & transitions
Dashboards show counts per state from [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Error-rate alarm for CYC_CONSENT.* codes; validation failures counted, not logged with bodies.

## Authorization
Dashboards are restricted to `ope_` with `aud_` logging (CTR-CAP-001).

## Failure, idempotency, concurrency, offline
Replay and conflict counters (see failure_recovery_idempotency.md). Offline queue depth reported per device as a count only.

## Privacy, retention, abuse
Log redaction: no snapshot content, no party IDs; metric retention 30 days (ASSUMPTION).

## Observability & budgets
Alerts: p99 > 800 ms for 10 min; conflict rate > 5 % for 15 min; EXPIRED timer lag > 5 min. Load budget: 200 commands/s sustained.

## Tests
- TEST-PS-021-08-01 (load): 200 commands/s for 10 min meets R01.
- TEST-PS-021-08-02 (observability): metric label cardinality excludes forbidden labels.
- TEST-PS-021-08-03 (log redaction): log scan clean per CTR-PRV-001 R09.

## Acceptance criteria
1. Latency budgets met in the load test.
2. No forbidden labels in exported metrics.
3. Alerts fire in staging fault injection.

## Assumptions & open decisions
- ASSUMPTION: load target 200 commands/s for a single cycle-execution cluster.
- [DECISIONS.md](../../../DECISIONS.md) D07 — PROVISIONAL (D07 default, unapproved): 30-day metric retention is a default, not a legal basis.
