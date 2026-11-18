# PS-041-08 — observability performance

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-041-08. **Owner:** [05_Rentals/02_rental_lifecycle/mod_damage](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_damage. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); named in the Dependencies section of this file.

## Purpose and scope
Defines the metrics, latency and error budgets, alerts and log fields needed to operate the damage module without recording personal data. Targets are design budgets; they are not measurements.

Exclusions: platform-wide dashboards (F15), security monitoring (F16), and quality gates (F17).

## Requirements
- **PS-041-08.R01** Metrics. The module emits the metrics below for every command, query, timer and outbox worker. Labels never include participant IDs, free text or amounts.
- **PS-041-08.R02** Case coverage. Budgets and alerts cover normal operation, rate-limit spikes, stale-revision spikes, lock contention, timer lag, outbox lag and orphan media growth.
- **PS-041-08.R03** Client budgets. The claim detail view and the evidence upload screen must meet the client budgets below, and must work at 360 px width with no horizontal scroll.

## Metrics
| Metric | Type | Labels |
|---|---|---|
| damage_command_total | counter | command, outcome_code |
| damage_command_latency_ms | histogram | command |
| damage_query_latency_ms | histogram | query |
| damage_state_transition_total | counter | from_state, to_state |
| damage_idempotent_replay_total | counter | command |
| damage_stale_revision_total | counter | command |
| damage_lock_wait_ms | histogram | none |
| damage_rate_limited_total | counter | command |
| damage_timer_lag_seconds | gauge | none |
| damage_timer_expired_total | counter | previous_state |
| damage_outbox_lag_seconds | gauge | none |
| damage_evidence_upload_total | counter | outcome_code |
| damage_orphan_media_total | gauge | none |

Labels use enum values only.

## Budgets
**Assumption A-damage-21:** The budgets below are design budgets for a relay in one primary region, measured at the server boundary.

| Operation | p95 server latency | Error budget |
|---|---|---|
| damage.get_claim | 200 ms | 5xx below 0.1% of requests over 30 days |
| damage.list_claims (50 items) | 300 ms | 5xx below 0.1% |
| damage.open_claim | 400 ms | 5xx below 0.1% |
| damage.respond, counter.accept, claim.withdraw | 400 ms | 5xx below 0.1% |
| damage.attach_evidence (metadata commit, excluding upload) | 500 ms | 5xx below 0.1% |
| damage.get_timeline (100 events) | 300 ms | 5xx below 0.1% |
| Timer expiry lag | 5 minutes | Below 1% of runs late by more than 5 minutes |
| Outbox publish lag | 30 seconds | Below 0.5% of events late by more than 30 seconds |
| DAMAGE_STALE_REVISION share of respond commands | not a latency target | Below 3% over 7 days; higher suggests UI or sync problems |

Client budgets (measured on a mid-range phone over a 4G profile):
- Claim detail first meaningful paint at or below 2.5 s.
- Evidence upload screen interactive at or below 2 s.
- Touch targets at least 44 CSS px.
- Text contrast meets WCAG 2.2 AA; error states use text, not color alone.

## Alerts
- 5xx rate above 0.5% for 10 minutes: page.
- damage_timer_lag_seconds above 300 for 15 minutes: page.
- damage_outbox_lag_seconds above 120 for 10 minutes: notify.
- damage_orphan_media_total rising for 2 consecutive hours: notify.
- damage_rate_limited_total spike above 5 times its 7-day median: notify F16 for abuse review.

## Log fields
Allowed fields on every log line:
- `ts`, `level`, `service` = "damage", `build_version`, `region`.
- `command` or `query`, `outcome_code`, `error_code`, `replayed`.
- `claim_id` (opaque ULID, not personal data).
- `actor_ref`: keyed hash of the participant ID, salt rotated daily. Never the raw ID.
- `role` (lender, renter, moderator, system).
- `from_state`, `to_state`, `revision`, `sequence`.
- `latency_ms`, `lock_wait_ms`.

Forbidden in logs, traces and metrics: description_text, comment_text, caption_text, note_text, media_ref, sha256 values, raw participant IDs, amounts (use ranges only if needed), IP addresses, user agents, device identifiers, names, email addresses and postal or location data.

Traces follow the same rules. Span names use command names only.

## Open decisions
- **Assumption A-damage-21:** Budgets and alert thresholds are defaults for review.
- The salt rotation interval (daily) is a default. Confirm with F16 when the log policy is published.
- Relationship to CTR-PRV-001 retention of logs is pending F10 classes (A-damage-18).
