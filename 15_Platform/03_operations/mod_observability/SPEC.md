# F15.S03.M01 — Observability

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S03](../SPEC.md). **Process IDs:** PS-121-01…PS-121-10. **Code:** `packages/kernel/src/observability`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Isomorphic observability primitives in the kernel (CTR-OBS-001 with the ADR-0016 amendment OBS-7): a structured JSON-lines logger with redaction and IP truncation, a metrics registry (counter, gauge, histogram) with a label allowlist and Prometheus text rendering, and a readiness probe. On a relay the node:http adapter serves /healthz, /readyz and operator-only /metrics. In the vault (PWA) the same logger writes to a bounded in-memory ring buffer that never leaves the device unless the user exports it; the PWA sends no telemetry.

## Responsibilities

- Emit one JSON line per log call with ts, level, msg, correlationId, module, code and durationMs first, after redaction.
- Drop sensitive keys (token, secret, password, privateKey, recoveryCode, email, address, lat, lon, note, body, ciphertext and suffix variants) at any depth.
- Truncate IP addresses to /24 (IPv4) and /48 (IPv6) both under IP keys and as bare string values.
- Register counters, gauges and histograms named classrup_<slug>_<name>_<unit> with labels limited to tenant, module, code and outcome, and render Prometheus text 0.0.4.
- Cap series per metric and count dropped label combinations.
- Report readiness from storage writability, current migrations and outbox lag below 60 s; report liveness without dependency checks.

## Not responsible for

- Log shipping, storage and retention on a relay (operator log pipeline; F15.S02.M01 wires the sink).
- Alerting rules and dashboards (relay operator, F15.S03.M03 runbooks).
- Authorization policy for /metrics (F16.S01.M01 implements AuthzPort; this module declares the capability).
- Load and chaos test harnesses (F17.S02).

## User stories

- As a relay operator, I scrape /metrics with my operator token and see command outcomes and outbox lag without any user identifiers.
- As a vault user, I can export my local diagnostics for a support request, and nothing is sent anywhere unless I do.
- As a feature developer, I log with a child logger bound to my module and correlation ID and never have to remember which fields to scrub.

## Edge cases

- A log field named sessionToken, contactEmail or pickup_address is dropped even though it is not an exact deny-list name.
- An X-Forwarded-For value lists several IPs; each one is truncated.
- A metric receives a 1 001st label combination; the series is dropped and classrup_metrics_dropped_series_total increments.
- The log sink throws (disk full); the caller continues and the dropped line is counted.
- The relay is shutting down; /readyz turns 503 before connections close while /healthz stays 200.
- A metric is registered twice with the same definition after a hot reload; the existing one is reused, a conflicting definition throws.

## UX and accessibility



Headless kernel module. The PWA settings screen (F15.S01) offers "Export diagnostics", which saves the ring buffer as JSON Lines; there is no other user-facing surface.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-OBS-001, CTR-PRV-001, CTR-CAP-001, CTR-ERR-001, CTR-TST-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-121-01 | [Domain schema](domain_schema.md) | 3 |
| PS-121-02 | [Validation rules](validation_rules.md) | 3 |
| PS-121-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-121-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-121-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-121-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-121-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-121-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-121-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-121-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/kernel/src/observability/index.ts`.

## Acceptance criteria

- All tests T01–T13 pass in CI.
- No deny-listed key or untruncated IP appears in any log line produced by kernel tests (T01, T02, T19 of PS-117).
- /metrics is never reachable without platform.metrics.read (T10).
