# PS-077-08 — Observability and performance: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-08.R01** The PWA sends no telemetry (OBS-7); step states, durations and failures stay in local diagnostics that the user can export, and relays measure relay_apply per CTR-OBS-001.
- **PS-077-08.R02** Execution completes within the budget for typical vaults and never blocks the UI thread over 50 ms.
- **PS-077-08.R03** Failed steps are surfaced with the module name.

## Specification

**Metrics**
- Local diagnostics: classrup_privacy_deletion_requests_total{status}
- Local diagnostics: classrup_privacy_deletion_step_duration_ms{step} (histogram)
- Relay only: classrup_privacy_deletion_relay_apply_total{outcome=accepted|held|rejected}

**Logs**
- info deletion.status {requestId, from, to, correlationId} — no content, no did in plain form beyond the pseudonym after completion.

**Budgets**
- Execution for 10 000 records and 200 MB of encrypted blobs completes in ≤ 120 s on a mid-range phone.
- relay_apply of a 100-tombstone batch p95 ≤ 500 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T13 | load | PS-077-08.R01, PS-077-08.R02, PS-077-08.R03 | 10 000 records and 200 MB blobs; 100-tombstone relay batch | ≤ 120 s; relay p95 ≤ 500 ms; main-thread block ≤ 50 ms; no telemetry sent |

## Dependencies

Module depends on: F10.S01.M01, F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
