# PS-106-08 — Observability and performance: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-08.R01** Relay mirror and resolve calls are measured per CTR-OBS-001; the PWA keeps local diagnostics only (OBS-7).
- **PS-106-08.R02** Vault set meets p95 ≤ 50 ms and relay mirror p95 ≤ 300 ms at 50 req/s; resolve p95 ≤ 20 ms.
- **PS-106-08.R03** Mirror lag is visible in local diagnostics.

## Specification

**Metrics**
- classrup_notify_pref_mirror_total{outcome=applied|stale|conflict|rejected} (relay)
- classrup_notify_pref_resolve_ms (histogram, relay) and classrup_notify_pref_resolve_defaults_total (relay)
- classrup_notify_pref_changes_total (local diagnostics)

**Logs**
- relay info preference.mirrored {userHash, channel, seq, outcome, correlationId} — no categories.

**Budgets**
- set p95 ≤ 50 ms; check p95 ≤ 2 ms; relay mirror p95 ≤ 300 ms at 50 req/s; resolve p95 ≤ 20 ms with 100 000 users.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T11 | load | PS-106-08.R01, PS-106-08.R02, PS-106-08.R03 | 50 mirror per second for 2 minutes and 100 000 resolve calls | budgets met |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
