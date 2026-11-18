# PS-065-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (diagnostics), CTR-EVT-001 (lag), CTR-PRV-001 (log classes), CTR-CAP-001 R08.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-065-08.R01 | Each open, attest, dispute and closure emits counter and latency. | MVP |
| PS-065-08.R02 | `AttestHandoff` p95 ≤ 300 ms; referral delivery lag p95 ≤ 60 s. | MVP |
| PS-065-08.R03 | Logs carry `handoff_id`, state and code only; never quantities, signatures or party IDs in combination. | MVP |
| PS-065-08.R04 | No handoff, party or item IDs as metric labels. | MVP |
| PS-065-08.R05 | Alerts: dispute rate > 5% of closed handoffs per week (ASSUMPTION); referral backlog > 15 min; key-unknown spike. | MVP |
| PS-065-08.R06 | Attestation flow and state labels meet WCAG 2.1 AA; states are announced in text, not colour alone. | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `handoff_cmd_total` | counter | `command`, `result` |
| `handoff_transition_total` | counter | `from`, `to` |
| `handoff_referral_lag_seconds` | histogram | none |
| `handoff_outbox_lag_seconds` | gauge | none |
| `handoff_authz_deny_total` | counter | `action` |

## Commands / queries / events
Covers PS-065-04 paths.

## States & transitions
`handoff_transition_total` per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Counters by code only.

## Authorization
Dashboards for F08 and F16; no per-handoff views.

## Failure, idempotency, concurrency, offline
Device queue depth as aggregate.

## Privacy, retention, abuse
Operational logs 30 days; metrics 13 months aggregated; audit 12 months.

## Observability & budgets
- Availability 99.9% monthly (ASSUMPTION).
- Load: 50 attestations/s peak (ASSUMPTION).
- Dispute rate reported weekly as aggregate for the product review.

## Tests
- TEST-PS-065-08-01 (unit): counters once per command.
- TEST-PS-065-08-02 (privacy scan): no quantities or signatures in logs or metrics.
- TEST-PS-065-08-03 (load): 50 attestations/s within budget.
- TEST-PS-065-08-04 (a11y): state labels announced in text.

## Acceptance criteria
1. Dashboards and alerts exist.
2. Redaction verified.
3. Budgets met.
4. No per-handoff labels.

## Assumptions & open decisions
- ASSUMPTION: targets above.
- PROVISIONAL (D07 default, unapproved): 30-day log retention.
