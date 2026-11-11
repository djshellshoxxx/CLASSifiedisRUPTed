# PS-076-08 — Observability and performance: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-08.R01** The PWA sends no telemetry (OBS-7); consent counts and check latency stay in local diagnostics.
- **PS-076-08.R02** The check function meets a low latency budget with an in-memory cache invalidated on change.
- **PS-076-08.R03** Lapse and withdrawal propagation are observable locally.

## Specification

**Metrics**
- Local diagnostics: classrup_privacy_consent_changes_total{purpose,action=granted|withdrawn|lapsed}
- Local diagnostics: classrup_privacy_consent_check_ms (histogram)
- Relay only: classrup_privacy_consent_statements_total{kind=grant|withdrawal,outcome=registered|duplicate|rejected}

**Logs**
- info consent.changed {consentId, purpose, action, correlationId} — no relay URLs and no policy text.

**Budgets**
- check p99 ≤ 2 ms with cache; grant and withdraw p95 ≤ 100 ms local commit.
- Withdrawal reaches every in-vault consumer within 1 s of commit.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T13 | load | PS-076-08.R01, PS-076-08.R02, PS-076-08.R03 | 10 000 checks and 100 changes | check p99 ≤ 2 ms, propagation ≤ 1 s, no telemetry sent |

## Dependencies

Module depends on: F07.S01.M01, F11.S01.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
