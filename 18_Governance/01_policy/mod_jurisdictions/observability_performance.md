# PS-145-08 — Observability and performance: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-08.R01** No telemetry leaves the device (OBS-7); counters are local diagnostics.
- **PS-145-08.R02** Resolve is called on every publish and must be fast on Moto G-class hardware.
- **PS-145-08.R03** Relay profile serving follows OBS-1 to OBS-4.

## Specification

**Metrics**
- classrup_governance_profile_applied_total{outcome} (local)
- classrup_governance_profile_resolve_duration_ms (local histogram)
- classrup_governance_profile_downloads_total (relay)

**Logs**
- info jurisdiction_profile.activated {profileId, version, correlationId} in local diagnostics.

**Budgets**
- resolve p95 <= 15 ms; receive p95 <= 80 ms on Moto G-class hardware.
- Relay profile download p95 <= 150 ms at 50 req/s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T12 | load | PS-145-08.R01, PS-145-08.R02, PS-145-08.R03 | 100 resolves per second for 1 minute on Moto G profile; relay 50 req/s | resolve p95 <= 15 ms, relay p95 <= 150 ms, no telemetry |

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
