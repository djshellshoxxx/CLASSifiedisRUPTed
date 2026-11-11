# PS-121-09 — Contract and acceptance tests: Observability

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M01 Observability](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/observability` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-121-09.R01** Redaction and IP truncation have unit tests covering nested objects, arrays, errors, suffix variants and compressed IPv6 forms.
- **PS-121-09.R02** Prometheus rendering is tested against exact expected text including escaping and cumulative histogram buckets.
- **PS-121-09.R03** Every requirement of PS-121 is covered by a test whose title starts with its TEST-PS-121-09 identifier.

## Specification

See the module test table below (all processes).

**Fixtures:** Fake clock at 2026-11-04T10:15:30.123Z; ring-buffer sink; relay test server from packages/kernel/src/http/server.test.ts with member and operator tokens.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-121-09.T01 | unit | PS-121-07.R01, PS-121-09.R01 | object with every deny-listed key, suffix variants, nested arrays, an error, a cycle and a bigint | only safe keys remain; error keeps name, message and code; cycle marked |
| TEST-PS-121-09.T02 | unit | PS-121-07.R02, PS-121-09.R01 | IPv4, full and compressed IPv6, IPv4-mapped, zone IDs, invalid strings, forwarded lists | /24 and /48 networks; invalid IP under an IP key redacted; non-IPs untouched |
| TEST-PS-121-09.T03 | unit | PS-121-01.R01, PS-121-04.R01, PS-121-08.R01, PS-121-10.R02 | child loggers with module and correlationId log one line | exact JSON with ts, level, msg, correlationId, module, code, durationMs first; note dropped |
| TEST-PS-121-09.T04 | unit | PS-121-02.R03, PS-121-06.R01 | warn level logger, invalid level, throwing sink | debug and info discarded; creation throws; no exception to the caller and dropped count 2 |
| TEST-PS-121-09.T05 | unit | PS-121-01.R02, PS-121-02.R01, PS-121-05.R03, PS-121-10.R03 | bad names, reserved suffixes, userId label, duplicate and conflicting registration | registration throws; identical re-registration shares the series; conflicting one throws |
| TEST-PS-121-09.T06 | unit | PS-121-02.R02 | four tenants into a metric capped at two series | two series kept; dropped counter 2 |
| TEST-PS-121-09.T07 | unit | PS-121-06.R02, PS-121-08.R03, PS-121-09.R02 | counter with escaped labels, gauge, histogram with three observations | exact Prometheus text with cumulative buckets, sum and count; default buckets include 150 and 300 |
| TEST-PS-121-09.T08 | integration | PS-121-01.R03, PS-121-03.R02, PS-121-06.R03 | pending migration, lag 60 s, throwing lag probe, failing ping, closed storage | unready with the failing check false; ready only when all pass |
| TEST-PS-121-09.T09 | integration | PS-121-03.R01, PS-121-03.R03, PS-121-05.R02 | GET /healthz and /readyz on a relay, then draining, then lag 61 s, then closed server | 200 ok; 200 ready with booleans; 503 draining; 503 outboxLag false; connection refused after close |
| TEST-PS-121-09.T10 | abuse | PS-121-04.R02, PS-121-05.R01 | GET /metrics without token, with a member token and with an operator token | 401, 404, 200 text/plain 0.0.4 without principal IDs |
| TEST-PS-121-09.T11 | unit | PS-121-04.R03, PS-121-07.R03, PS-121-10.R01 | ring buffer of 3 receives 5 lines with an email field, export and clear | last 3 lines kept; JSON Lines export without the email; empty after clear |
| TEST-PS-121-09.T12 | load | PS-121-08.R02 | 10 000 log lines and 50 000 counter plus 50 000 histogram updates | total under 1 s |
| TEST-PS-121-09.T13 | unit | PS-121-09.R03 | traceability scan of kernel test titles | every PS-121 test ID T01–T13 appears in a test title |

## Acceptance criteria

- All tests T01–T13 pass in CI.
- No deny-listed key or untruncated IP appears in any log line produced by kernel tests (T01, T02, T19 of PS-117).
- /metrics is never reachable without platform.metrics.read (T10).

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001, CTR-ERR-001, CTR-TST-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
