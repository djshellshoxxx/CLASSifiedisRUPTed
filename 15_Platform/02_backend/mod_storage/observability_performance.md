# PS-119-08 — Observability and performance: Storage

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M03 Storage](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/storage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-119-08.R01** The dispatcher records classrup_outbox_lag_ms per consumer module and classrup_outbox_deliveries_total{module, outcome}, and the sync sender records classrup_sync_sends_total{outcome, code}.
- **PS-119-08.R02** On SQLite with 5 000 records a get-and-put transaction has p95 at or below 5 ms and a 50-item index query has p95 at or below 20 ms.
- **PS-119-08.R03** Dead-lettering logs one warn line with consumer, eventId, type and code and nothing from the payload.

## Specification

**Metrics**
- classrup_outbox_lag_ms{module} gauge
- classrup_outbox_deliveries_total{module, outcome=delivered|duplicate|retry|dead|paused}
- classrup_sync_sends_total{outcome=sent|retried|failed, code}

**Logs**
- warn outbox.dead_lettered {module, consumer, eventId, type, code, correlationId}.
- error outbox.consumer_threw {module, consumer, eventId, correlationId, error}.
- warn sync.failed {code, entryId, ref}.

**Budgets**
- SQLite get+put transaction p95 ≤ 5 ms; 50-item index query p95 ≤ 20 ms with 5 000 records.
- Outbox lag below 60 s in steady state (readiness threshold, OBS-6).

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-119-09.T10 | integration | PS-119-07.R01, PS-119-07.R03, PS-119-08.R03 | consumer fails 8 times for an event with a private name | inbox dead with code only; one warn log with consumer, type and code; no payload text in outbox logs |
| TEST-PS-119-09.T11 | unit | PS-119-08.R01 | delivery failure then success with the clock advanced 5 s | classrup_outbox_lag_ms 5000 then 0; deliveries counted by outcome |
| TEST-PS-119-09.T12 | load | PS-119-08.R02 | 5 000 records, 200 get+put transactions and 100 index queries on SQLite WAL | p95 ≤ 5 ms and ≤ 20 ms |

## Dependencies

Module depends on: F15.S03.M01, CTR-ID-001, CTR-SCH-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-FLG-001, CTR-OBS-001, CTR-TST-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
