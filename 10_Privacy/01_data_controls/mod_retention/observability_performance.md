# PS-079-08 — Observability and performance: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-08.R01** Relay sweeps and holds are measured per CTR-OBS-001; the PWA sends no telemetry (OBS-7) and keeps vault sweep records locally.
- **PS-079-08.R02** Sweep throughput meets the budget so a night run completes inside its window.
- **PS-079-08.R03** Overdue sweeps and overdue hold reviews raise alerts on the relay.

## Specification

**Metrics**
- classrup_privacy_retention_purged_total{scope,class} (relay) and the same counter in local diagnostics
- classrup_privacy_retention_run_duration_s{scope}
- classrup_privacy_legal_holds{status} (relay gauge)
- classrup_privacy_retention_overdue_s (gauge: time since last successful sweep)

**Logs**
- info retention.purged {runId, kind, class, count, correlationId} — counts only.
- audit legal_hold.transition {holdId, from, to, actorDid} — no subject contents.
- info retention.policy_refreshed {scopeKind, class, profileRef, profileVersion, fallback, clamped, looser, correlationId} — local diagnostics in the vault, relay logs on the relay.

**Budgets**
- Relay sweep purges 50 000 rows in ≤ 60 s; vault sweep of 20 000 rows ≤ 10 s in chunks that never block the main thread over 50 ms.
- Hold check p95 ≤ 5 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T14 | load | PS-079-08.R01, PS-079-08.R02, PS-079-08.R03 | 50 000 relay rows and 20 000 vault rows | relay ≤ 60 s, vault ≤ 10 s with no main-thread block over 50 ms; overdue alert fires when last sweep is 26 h old |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
