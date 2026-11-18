# PS-112-08 — observability performance

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-112-08. **Owner:** [14_Accessibility/02_internationalization/mod_currencies](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_currencies. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); platform observability is owned by F15 (mod_observability).

## Purpose and scope
Defines the metrics, latency and error budgets, log fields, and alerts that show whether currencies is correct, fresh and fast. Business outcome: operators can see stale quotes, pin invalidation lag, evidence mismatches and client errors within minutes, without any personal data in telemetry. Exclusions: end-user analytics, product funnels, and any per-user or per-subject telemetry.

## Requirements
- PS-112-08.R01: Metrics are listed with type, labels and purpose (section "Metrics"). Actors reading them: operators and on-call. No subject, user or amount label is permitted.
- PS-112-08.R02: Latency and error budgets are concrete per command and query (section "Budgets"). Budgets are module targets pending F15 SLO approval (A-currencies-19).
- PS-112-08.R03: Log fields are allowlisted; anything not listed is dropped at the emitter (section "Log fields").
- PS-112-08.R04: Alerts exist for stale quotes, invalidation lag, outbox lag, evidence mismatch and error budget burn (section "Alerts").
- PS-112-08.R05: Accessibility is not a telemetry concern here; operator dashboards follow the platform accessibility standard and must not depend on colour alone for alert severity.
- PS-112-08.R06: Telemetry is emitted with the same `request_id` and `correlation_id` used in events, so one operation can be traced across modules.

## Metrics
| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `currencies_command_latency_ms` | histogram | `command`, `outcome` | Command latency against budget |
| `currencies_query_latency_ms` | histogram | `query`, `outcome` | Query latency against budget |
| `currencies_requests_total` | counter | `command` or `query`, `outcome`, `error_code` | Error rate and client error ratio |
| `currencies_active_quote_age_seconds` | gauge | `pair_class` (`fiat_fiat`, `local_unit`) | Freshness of ACTIVE quotes |
| `currencies_expired_unswept_total` | gauge | `kind` (`quote`, `pin`) | Expiry sweep lag (rows past due but still in source state) |
| `currencies_pin_invalidation_lag_seconds` | histogram | none | Time from quote withdrawal to pins INVALIDATED |
| `currencies_outbox_lag_seconds` | gauge | none | Age of oldest unrelayed outbox row |
| `currencies_conversion_recompute_mismatch_total` | counter | none | Evidence check; must stay 0 |
| `currencies_rate_limited_total` | counter | `scope` (`actor`, `subject`, `source`, `pair`) | Abuse signal |
| `currencies_quote_outlier_total` | counter | `outcome` (`rejected`, `overridden`) | Manipulation or data-quality signal |
| `currencies_idempotent_replay_total` | counter | `command` | Retry health |
| `currencies_import_duration_seconds` | histogram | `kind` (`catalog`, `quotes`), `outcome` | Import budget |

Label values never include `subject_ref`, `user_ref`, `actor_ref`, `display_code`, amounts, or free text.

## Budgets
| Operation | p95 latency | p99 latency | Other budget |
|---|---|---|---|
| catalog.get / catalog.list (page of 100) | 80 ms / 120 ms | 150 ms / 250 ms | none |
| fx.get_active | 80 ms | 150 ms | none |
| fx.publish (includes V13 lock) | 300 ms | 800 ms | none |
| fx.withdraw | 200 ms | 500 ms | none |
| valuation.pin (includes subject query) | 250 ms | 700 ms | none |
| valuation.convert | 150 ms | 400 ms | none |
| valuation.release | 150 ms | 400 ms | none |
| valuation.list_conversions (page of 100) | 200 ms | 500 ms | none |
| preference.get / set | 80 ms / 150 ms | 150 ms / 300 ms | none |
| Import, catalog 500 rows | 5 s job | 10 s job | none |
| Import, quotes 2000 rows | 30 s job | 60 s job | none |

Error budgets (30-day window):
- Server errors (5xx): at most 0.1% of requests. Alert when a 5-minute window exceeds 0.5%.
- Client errors excluding 401, 403 and 429: at most 3% of requests per hour. Above that, signals a client defect.
- Availability target for read paths: 99.9%. For write paths: 99.9%, with fail-closed behavior during outage (failure_recovery_idempotency.md).

Freshness budgets:
- Quote expiry sweep runs every 30 s; an ACTIVE quote past `expires_at` must be EXPIRED within 60 s.
- Pin invalidation after quote withdrawal: p95 30 s, p100 300 s.
- Outbox lag: p95 5 s, p100 60 s.

## Log fields
Allowed fields, per event line:
`ts`, `level`, `request_id`, `correlation_id`, `command` or `query`, `schema_version`, `outcome`, `error_code`, `latency_ms`, `actor_hmac`, `currency_code`, `quote_id`, `pin_id`, `conversion_id`, `source_id`, `build_version`, `retry_count`.

- `actor_hmac`: HMAC-SHA-256 of `actor_ref` with a daily rotating key, truncated to 16 hex characters. It cannot be reversed and rotates daily, so it cannot link a day's activity to a person across days.
- `rate` is logged only on quote publish (rates are PUBLIC).

Forbidden in logs: `input_minor`, `output_minor`, `exact_output_decimal`, `subject_ref`, `user_ref`, `display_code` (a preference), IP address, user agent, free-text fields, stack traces containing request bodies. Emitter tests enforce this allowlist (TEST-PS-112-08-T02).

Log retention: 30 days. Logs are INTERNAL class (privacy_retention_abuse.md).

## Alerts
| Alert | Condition | Severity | First responder action |
|---|---|---|---|
| Stale active quote | `currencies_expired_unswept_total{kind="quote"}` > 0 for 120 s | High | Check scheduler; run manual sweep |
| Invalidation lag | p95 of `currencies_pin_invalidation_lag_seconds` > 30 s for 10 min | Medium | Check chunked job |
| Outbox lag | `currencies_outbox_lag_seconds` > 60 s | High | Check relay; events are safe and queued |
| Evidence mismatch | `currencies_conversion_recompute_mismatch_total` > 0 | Critical | Freeze conversions; investigate; no auto-repair |
| Server error burn | 5xx > 0.5% over 5 min | High | Standard incident path |
| Client error spike | Client 4xx ratio > 3% over 1 h | Medium | Check recent client release |
| Outlier attempts | `currencies_quote_outlier_total{outcome="rejected"}` > 5 in 1 h | Medium | Review source and operator activity |
| Rate-limit spike | `currencies_rate_limited_total` > 10x 7-day median for 15 min | Medium | Review abuse controls |

## Open decisions
- A-currencies-19: These budgets are module targets. They become binding after F15 approves SLO definitions for the platform. Related: D08 (offline behavior affects client-side freshness metrics, which are not collected in MVP).
- Related: D07 (log and evidence retention defaults).
