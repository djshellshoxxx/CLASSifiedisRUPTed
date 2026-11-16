# PS-121-04 — Commands, queries and events: Observability

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M01 Observability](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/observability` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-121-04.R01** The kernel core exports createLogger, createRingBufferSink, consoleSink, redact, truncateIp, createMetricsRegistry and createReadiness, and all of them are isomorphic.
- **PS-121-04.R02** GET /metrics renders Prometheus text format 0.0.4 and is reachable only by actors granted platform.metrics.read on that relay.
- **PS-121-04.R03** The vault uses the in-memory ring-buffer sink and no metrics export, so nothing is sent off-device (OBS-7).

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

_None._

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module with no commands. /healthz, /readyz and /metrics are relay HTTP endpoints served by the F15.S02.M02 node:http adapter, not bus commands; nothing in the vault is exposed.

### Example

```
const log = createLogger({ sink: consoleSink, clock }).child({ module: 'F01.S04.M01', correlationId });
log.info('offer.accepted', { offerId, email: 'x@y.z', ip: '203.0.113.7' })
→ {"ts":"2026-11-04T10:15:30.123Z","level":"info","msg":"offer.accepted","correlationId":"…","module":"F01.S04.M01","offerId":"…","ip":"203.0.113.0/24"}
GET /metrics  Authorization: Bearer <operator relay token>
→ 200 text/plain; version=0.0.4
  # TYPE classrup_command_total counter
  classrup_command_total{module="F01.S04.M01",outcome="ok",code="OK"} 12
GET /readyz → 200 {"status":"ready","checks":{"storage":true,"migrations":true,"outboxLag":true},"lagMs":0}
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-121-09.T03 | unit | PS-121-01.R01, PS-121-04.R01, PS-121-08.R01, PS-121-10.R02 | child loggers with module and correlationId log one line | exact JSON with ts, level, msg, correlationId, module, code, durationMs first; note dropped |
| TEST-PS-121-09.T10 | abuse | PS-121-04.R02, PS-121-05.R01 | GET /metrics without token, with a member token and with an operator token | 401, 404, 200 text/plain 0.0.4 without principal IDs |
| TEST-PS-121-09.T11 | unit | PS-121-04.R03, PS-121-07.R03, PS-121-10.R01 | ring buffer of 3 receives 5 lines with an email field, export and clear | last 3 lines kept; JSON Lines export without the email; empty after clear |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001, CTR-ERR-001, CTR-TST-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
