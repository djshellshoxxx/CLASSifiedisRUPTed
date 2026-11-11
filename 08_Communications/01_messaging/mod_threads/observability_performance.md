# PS-061-08 — Observability and performance: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-08.R01** The PWA records only local diagnostics (OBS-7); no telemetry leaves the device.
- **PS-061-08.R02** Create and archive meet a vault budget of p95 ≤ 50 ms and inbox list meets p95 ≤ 100 ms for 50 threads on a mid-range phone.
- **PS-061-08.R03** Roster consumer lag is visible in local diagnostics.

## Specification

**Metrics**
- classrup_comms_threads_total{outcome=created|existing|archived|rejected|requested} (local diagnostics)
- classrup_comms_thread_participants (histogram, local diagnostics)
- classrup_comms_thread_consumer_lag_ms (gauge, local diagnostics only)

**Logs**
- local info thread.created {threadId, contextType, correlationId} — local diagnostics, no participant list.
- local info thread.archived {threadId, reason, correlationId}.

**Budgets**
- Vault create/archive/mute p95 ≤ 50 ms including derivation; list_mine p95 ≤ 100 ms for 50 items with 2 000 threads in IndexedDB.
- Idle sweep archives 2 000 threads in ≤ 2 s on a mid-range phone.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T13 | load | PS-061-08.R01, PS-061-08.R02, PS-061-08.R03 | 500 mixed vault commands per second for 1 minute plus 2 000-thread idle sweep | budgets met and lag gauge returns to 0 |

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, F02.S01.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
