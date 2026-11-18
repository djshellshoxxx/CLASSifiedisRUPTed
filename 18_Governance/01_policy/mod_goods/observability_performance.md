# PS-144-08 — observability performance

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-144-08. **Owner:** [18_Governance/01_policy/mod_goods](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_goods. **Consumers:** F15 platform operations (dashboards, alerts), F17 quality (load and budget tests), F12 moderation (backlog). **Upstream:** F07 identity, F10 privacy (log rules), F16 security. See [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
**Business outcome.** Operators can see whether evaluations are fast, reliable and fair to the review backlog, without seeing personal data. Budgets are measurable and tied to alerts.

**Exclusions.** Product analytics on participants. Content of listings. Reviewer notes.

## Metrics
| Metric | Type | Bounded labels | Budget and alert |
|---|---|---|---|
| goods_evaluate_latency_ms | histogram | outcome, cache_hit | p95 ≤ 150 ms; p99 ≤ 400 ms |
| goods_rule_lookup_latency_ms | histogram | cache_hit | p95 ≤ 50 ms |
| goods_command_latency_ms | histogram | command_name | p95 ≤ 300 ms |
| goods_evaluate_errors_total | counter | error_code, class (4xx or 5xx) | 5xx ≤ 0.5% per 5 min window; page if > 1% for 10 min |
| goods_outbox_lag_seconds | gauge | — | p95 ≤ 5 s; alert > 60 s |
| goods_review_backlog_age_hours | gauge | state | 95% of `OPEN` cases claimed or escalated within 72 h; alert if any `OPEN` case > 96 h |
| goods_scheduled_activation_lag_seconds | gauge | — | ≤ 30 s |
| goods_conflicts_total | counter | error_code | alert if > 2% of commands in 15 min |
| goods_idempotency_replays_total | counter | command_name | Informational; spike > 3× baseline alerts |
| goods_sampled_allow_total | counter | — | About 5% of ALLOW outcomes (A-goods-13 check) |
| goods_referral_pending | gauge | — | Alert if any referral pending > 24 h |

Label values must come from closed sets. Cardinality budget: at most 500 active series for the module.

## Availability and load budgets
- EvaluateGoods availability: 99.9% monthly (A-goods-15, single region).
- Load test target: 200 evaluations per second with p95 ≤ 150 ms on the reference environment. Pass means meeting the budget for 15 minutes with error rate under 0.5%.
- Command throughput target: 20 commands per second with p95 ≤ 300 ms.

## Log fields
Allowed fields: `timestamp`, `level`, `event_name`, `request_id`, `correlation_id`, `command_name`, `error_code`, `outcome`, `category_id`, `jurisdiction_scope` (country or subdivision only), `latency_ms`, `schema_version`, `actor_ref_hash` (salted per environment, rotated every 24 h), `subject_ref_hash` (same rule).

Forbidden fields: raw `subject_ref`, raw `actor_ref`, `reviewer_note`, any free text, names, emails, addresses, device identifiers, IP addresses, coordinates, and full request or response bodies.

Logs are kept 30 days (privacy_retention_abuse.md).

## Dashboards and alerts
- **Evaluation health:** latency percentiles, error rates by code, cache hit ratio, outbox lag.
- **Policy health:** activation lag, rules by state, conflict rate.
- **Review health:** backlog age histogram, escalations per day, claim-to-decision time, decisions per reviewer (aggregated, no names).
- **Pages:** evaluation 5xx above 1% for 10 min; outbox lag above 60 s; any `OPEN` case above 96 h.
- **Tickets:** conflict rate above 2%; referral pending above 24 h.

## Accessibility and localization
- Reviewer console meets WCAG 2.2 AA: keyboard operable, visible focus, status not conveyed by color alone, form errors linked to fields.
- Participant-facing outcome text uses `presentation_key` values, localized with the fallback chain defined by F14 accessibility and CTR-ERR-001.
- Console budget: first contentful render ≤ 2.5 s at p75 on a mid-tier mobile profile.
- Dates in UI use the user locale; logs and exports use UTC RFC 3339.

## Assumptions
- **A-goods-15.** Single-region deployment for budgets. Multi-region targets are out of scope until F15 publishes a topology.

## Open decisions
- **OD-GOODS-08.** Whether p99 budget for evaluation should be tightened after load tests. Default: keep 400 ms until baseline data exists.
