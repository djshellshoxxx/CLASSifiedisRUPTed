# PS-029-08 — observability performance

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-029-08. **Owner:** [03_Services/01_service_catalog/mod_skills](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_skills (module ID F03.S01.M01). **Consumers:** shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); module-level notifications, evidence, moderation and observability per [module SPEC](SPEC.md).

## Purpose and scope
Defines the metrics, performance budgets, alert thresholds and log fields for the skill-offer service, so that operators can see health without reading participant content. Metric and log platform choices belong to F15 platform observability; this file defines what the skills module emits.

Exclusions: client-side rendering performance of the PWA (owned by the PWA shell feature), load-test tooling choice, and capacity planning beyond the stated fixture sizes.

## Requirements
- PS-029-08.R01: Business outcome: operators can tell within 5 minutes whether skill creation, publishing and search are working, and which offers are stuck, without seeing any participant's content. Actors: operator, on-call engineer, F15 observability platform. Exclusions as above.
- PS-029-08.R02: Case coverage: sustained error spike; latency regression on search; outbox backlog growing; sweep not running; idempotency table growth; rate-limit trips from a single client; a region with feature flag off receiving writes; a sudden surge of creates (spam signal).
- PS-029-08.R03: Accessibility and budgets: budgets below apply to server-side measures at the stated fixture size; client-perceived latency is measured separately by the PWA shell.
- PS-029-08.R04: Metrics are aggregated by command, outcome and region. No metric label carries participant ID, skill ID, title, or free text.
- PS-029-08.R05: Logs are structured JSON with a fixed field set. Fields outside the set are dropped at the log shipper.
- PS-029-08.R06: Traces propagate `correlation_id` from the command envelope. Trace attributes follow the same exclusion list as logs.
- PS-029-08.R07: Each budget has a named alert with a threshold and a runbook link owned by F15.

## Fixture for budgets
- 100,000 published offers across 200 regions; 5 published per participant at most; 20 non-retired per participant.
- Concurrency: 200 owner writes per second and 2,000 search requests per second at peak (search served from a read replica or index).
- Measured on the reference configuration defined by F15; numbers below are targets, not measured results.

## Performance budgets
| Operation | p95 server latency | p99 server latency | Error budget |
|---|---|---|---|
| Create, update, publish, pause, resume, renew, retire | 300 ms | 1000 ms | 5xx at most 0.1% over 5 minutes |
| Search (one region, page of 50) | 400 ms | 900 ms | 5xx at most 0.1% over 5 minutes |
| Get own offer | 150 ms | 400 ms | 5xx at most 0.1% over 5 minutes |
| Authorization check (within command) | 10 ms | 30 ms | n/a |
| Outbox publish lag (commit to broker ack) | 5 s | 30 s | Dead letters at most 0.01% of events per day |
| Expiry sweep completion for 100,000 published offers | 60 s total run | n/a | Zero skipped records without a retry |
| Search index refresh after pause or retire | 60 s | 120 s | n/a |

Availability target for read paths: 99.9% per calendar month (A-skills-22). Write path availability target: 99.5% per calendar month.

## Metrics
| Metric | Type | Labels (allowed) | Purpose |
|---|---|---|---|
| `skills_command_total` | counter | `command`, `outcome` (applied, replayed, rejected, error), `error_code` | Command volume and failure mix |
| `skills_command_latency_seconds` | histogram | `command` | Latency budgets |
| `skills_revision_conflict_total` | counter | `command` | Concurrency pressure |
| `skills_idempotency_replay_total` | counter | `command` | Retry storms or offline replay |
| `skills_rate_limited_total` | counter | `scope` (write, search) | Abuse signal |
| `skills_published_offers` | gauge | `region` (region code, not offer ID) | Catalog size |
| `skills_state_transitions_total` | counter | `from_state`, `to_state` | Lifecycle health |
| `skills_outbox_pending` | gauge | none | Backlog |
| `skills_outbox_lag_seconds` | histogram | none | Delivery latency |
| `skills_outbox_dead_letter_total` | counter | `event_type` | Delivery failures |
| `skills_sweep_run_seconds` | histogram | `sweep` (expire, draft_inactive) | Sweep health |
| `skills_sweep_skipped_total` | counter | `sweep`, `reason` (cas_conflict) | Race pressure |
| `skills_flag_disabled_requests_total` | counter | `region` | Feature flag traffic while off |
| `skills_idempotency_rows` | gauge | none | Table growth |

Region label values are the approved region codes only. Unknown values are bucketed as `other`.

## Alerts
- Command 5xx ratio above 0.1% for 5 minutes: page.
- Search p95 above 400 ms for 10 minutes: page.
- Outbox lag p95 above 5 s for 10 minutes: ticket; above 60 s: page.
- Sweep not completed for 15 minutes past schedule: page.
- `skills_rate_limited_total` above 5x its 7-day median for 15 minutes: ticket to moderation team.
- Publish count above 5x 7-day median per hour: ticket for spam review. No automatic blocking.

## Log fields
Allowed fields: `timestamp` (RFC 3339), `level`, `service` (`skills`), `event` (command or sweep name), `correlation_id`, `request_id`, `command`, `outcome`, `error_code`, `skill_id`, `state_from`, `state_to`, `revision`, `latency_ms`, `schema_version`, `participant_ref`, `sweep_run_id`, `region` (approved code or `other`).

`participant_ref` is HMAC-SHA256 of `owner_participant_id` with a key rotated every 30 days (A-skills-21).

Forbidden fields (dropped at shipper): `title`, `description`, `tags`, `rate_*`, raw `owner_participant_id`, IP address, user agent, precise location, contact data, idempotency key raw value, request or response bodies.

## Assumptions
- A-skills-22: Budgets above are initial targets. Read availability 99.9% and write availability 99.5% per calendar month. These are operational targets, not measured results, and are not contractual.

## Open decisions
- Reference configuration and hardware for budget measurement are F15 decisions and are not fixed here.
- Whether `skill_id` may appear in logs at all: included here because it is a random ID with no personal content; F10 review pending.

## Testing
- TEST-PS-029-08-T01: Synthetic load at fixture size: p95 and p99 for each row of the budget table are within limits. Pass when all measured values are at or below the stated targets.
- TEST-PS-029-08-T02: Injected 5xx at 0.2% for 5 minutes fires the page alert. Pass when the alert fires within 1 minute of the threshold crossing.
- TEST-PS-029-08-T03: Log sample from a full lifecycle contains only allowed fields. Pass when a schema check finds zero forbidden fields.
- TEST-PS-029-08-T04: Metric label scan finds no `participant`, `skill_id`, `title` or free-text label. Pass when zero matches.
- TEST-PS-029-08-T05: Outbox stopped for 10 minutes, then restored. Pass when the lag gauge rises, the page alert fires only above the 60 s threshold, and the backlog drains.
