# PS-118-08 — Observability and performance: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-08.R01** The relay exports logs and metrics per CTR-OBS-001 OBS-1 to OBS-4 and OBS-6 through the observability module, including dispatcher lag and drain duration.
- **PS-118-08.R02** The relay meets the reference budget on 2 vCPU / 4 GB with read p95 ≤ 150 ms and write p95 ≤ 300 ms at 50 req/s.
- **PS-118-08.R03** Startup and shutdown times are bounded and measured.

## Specification

**Metrics**
- classrup_platform_relay_uptime_seconds
- classrup_platform_relay_drain_duration_ms (gauge of last shutdown)
- classrup_platform_dispatcher_lag_ms (now - oldest undelivered outbox row)
- classrup_platform_dispatcher_events_total{outcome=delivered|retried|dead_lettered}
- classrup_platform_relay_requests_rejected_total{code=PLATFORM_RELAY_DRAINING|PAYLOAD_TOO_LARGE, route_class=json|media}
- classrup_platform_relay_receipts_total{route_class=mailbox|index|fed|media|auction}

**Logs**
- info relay.started {relayId, version, node, port}; info relay.draining {inflight}; info relay.stopped {exitCode, cut, truncated} — never configuration values or secrets.
- info http.access {route (registered template), status, durationMs, ipPrefix (omitted on mailbox routes), correlationId}; warn dispatcher.dead_letter {eventType, consumer, code, attempts}; warn identity.revoked {keyId, reason}.

**Budgets**
- Cold start to ready ≤ 3 s with an empty database and ≤ 10 s with 1 GiB database and migrations current.
- Dispatcher processes 1 000 events/s sustained on the reference machine; lag p95 ≤ 1 s under 50 req/s; receipt signing adds ≤ 1 ms p95.
- Graceful shutdown completes within RELAY_DRAIN_MS (10 s) + 5 s hook budget + 2 s for checkpoint.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T13 | load | PS-118-08.R02, PS-118-08.R03 | 50 req/s mixed for 5 minutes on 2 vCPU container, then cold start timing | read p95 ≤ 150 ms, write p95 ≤ 300 ms, ready ≤ 3 s empty, dispatcher lag p95 ≤ 1 s |
| TEST-PS-118-09.T14 | integration | PS-118-08.R01 | metrics scrape and logs | metrics named per CTR-OBS-001 present, no user ids as labels, log lines match schema |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, F16.S01.M01, F16.S01.M02, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
