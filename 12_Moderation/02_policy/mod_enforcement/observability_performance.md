# PS-096-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_enforcement. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-EVT-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-096-08.R01 | Metrics carry no `enf_id`, `acc_`, `mod_` or `lst_` labels. | MVP |
| PS-096-08.R02 | Apply and approve p95 ≤ 300 ms. | MVP |
| PS-096-08.R03 | Effect latency (commit → owner effect confirmed) p95 ≤ 5 s; p99 ≤ 60 s. | MVP |
| PS-096-08.R04 | Expiry processed within 60 s of `expires_at` (p99). | MVP |
| PS-096-08.R05 | Alert on any `effect_status = failed` older than 1 h, and on `mod_` action rate anomaly. | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `enforce_transition_total` | counter | `from`, `to`, `action_type` |
| `enforce_effect_latency_seconds` | histogram | `action_type` |
| `enforce_active_actions` | gauge | `action_type` |
| `enforce_effect_failed_total` | counter | `target_type` |
| `enforce_validation_error_total` | counter | `code` |

## Commands / queries / events
Span `enforce.<command>` with `request_id`, code and duration.

## States & transitions
Dashboards show active actions per type and pending suspensions older than 24 h.

## Validation & errors
Counter `enforce_validation_error_total{code}`.

## Authorization
Dashboards restricted to `ope_` with aggregate scope.

## Failure, idempotency, concurrency, offline
Alerts: effect failure older than 1 h (page); pending suspension older than 72 h (ticket); `mod_` anomaly (page to Trust&Safety on-call).

## Privacy, retention, abuse
Logs and traces: IDs and codes only; target content never logged. Metric labels exclude identities (PS-096-08 R01).

## Observability & budgets
Capacity: 5 000 active actions per node at launch (ASSUMPTION). Storage ≤ 1 KB per action row.

## Tests
- `TEST-PS-096-08-01` load: 20 applies/s for 10 min meet R02.
- `TEST-PS-096-08-02` integration: owner outage produces failed-effect alert within 60 min simulated.
- `TEST-PS-096-08-03` contract: metric labels contain no identifiers.
- `TEST-PS-096-08-04` log scan: no target content after end-to-end run.

## Acceptance criteria
1. All metrics and alerts in place with documented thresholds.
2. Latency budgets met in staging.
3. Log scan reports zero forbidden fields.

## Assumptions & open decisions
- ASSUMPTION: capacity and thresholds are estimates pending F15 review.
- D07 (retention), PROVISIONAL default applies to metric retention (unapproved).
