# PS-091-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_trust. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-EVT-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-091-08.R01 | Metrics below are emitted with no `peer_id` label (cardinality bound). | MVP |
| PS-091-08.R02 | Command p95 commit ≤ 300 ms at 50 commands/s on the reference node (ASSUMPTION). | MVP |
| PS-091-08.R03 | `peer.get_trust` p95 ≤ 100 ms. | MVP |
| PS-091-08.R04 | Outbox-to-consumer lag p95 ≤ 30 s. | MVP |
| PS-091-08.R05 | Quarantine events page the on-call federation owner within 5 min. | MVP |

## Data / schema
Metrics:

| Metric | Type | Labels |
|---|---|---|
| `trust_transition_total` | counter | `from`, `to`, `trigger` |
| `trust_revision_conflict_total` | counter | `command` |
| `trust_auto_restrict_total` | counter | `reason_code` |
| `trust_peers_by_state` | gauge | `state` |
| `trust_revision_drift` | gauge | none |

## Commands / queries / events
Each command emits a span `trust.<command>` with `request_id`, `code`, duration and outcome.

## States & transitions
Dashboards show the count of peers in `quarantined` and time spent in `restricted`.

## Validation & errors
Rejected requests increment `trust_validation_error_total{code}`.

## Authorization
Dashboards are restricted to the federation operations role; no peer identities on public dashboards.

## Failure, idempotency, concurrency, offline
Alerts: `trust_revision_drift` > 0 for 15 min; quarantine rate > 3× 7-day median in 1 h (ASSUMPTION).

## Privacy, retention, abuse
Log redaction: no evidence bodies, no fingerprints beyond `key_id`, no peer hostnames in trust logs (CTR-PRV-001 R09).

## Observability & budgets
Capacity target: 10 000 federation peers per node (ASSUMPTION). Storage growth ≤ 50 MB per 10 000 peers per year at the defaults in PS-091-07.

## Tests
- `TEST-PS-091-08-01` load: 50 commands/s for 10 min meets R02.
- `TEST-PS-091-08-02` contract: metrics scraped contain no `peer_id` label.
- `TEST-PS-091-08-03` log scan: no fingerprint or reason text in logs after a test run.

## Acceptance criteria
1. All five metrics are exposed and documented.
2. Latency budgets R02–R04 pass in load test.
3. Log scan reports zero forbidden fields.

## Assumptions & open decisions
- ASSUMPTION: budgets are reference-node estimates, not measured.
- D05 (geoprivacy), not applicable here; no location data is processed by this module.
- D07 (retention), PROVISIONAL default governs metric retention (unapproved).
