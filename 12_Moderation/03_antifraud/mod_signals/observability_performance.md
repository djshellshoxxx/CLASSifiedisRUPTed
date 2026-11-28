# PS-101-08 — Observability and performance: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-08.R01** Relay ingestion lag and outcomes are measured per CTR-OBS-001 without subject keys in logs; the vault keeps local diagnostics only.
- **PS-101-08.R02** Summarize meets p95 ≤ 50 ms for subjects with up to 5 000 signals.
- **PS-101-08.R03** Dead-lettered ingestion events are alerting on the relay.

## Specification

**Metrics**
- classrup_moderation_signals_total{kind,outcome=recorded|duplicate|capped|unresolved_subject}
- classrup_moderation_signal_ingest_lag_ms
- classrup_moderation_signal_summarize_ms (histogram)
- classrup_moderation_signal_dead_letters_total

**Logs**
- relay info signal.recorded {signalId, kind, sourceModule, correlationId} — no subject or source key.

**Budgets**
- record and ingest p95 ≤ 100 ms; summarize p95 ≤ 50 ms for 5 000 signals; list p95 ≤ 150 ms for 100 items.
- Daily purge of 100 000 expired rows completes in ≤ 30 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T11 | load | PS-101-08.R01, PS-101-08.R02, PS-101-08.R03 | 200 ingests per second for 5 minutes; summarize 5 000-signal subject; purge 100 000 rows; a dead-lettered event | p95 targets met, purge ≤ 30 s, dead-letter metric alerts, no keys in logs |

## Dependencies

Module depends on: F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
