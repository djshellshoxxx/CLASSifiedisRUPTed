# PS-132-08 — Observability and performance: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-08.R01** Read-only and federation switch states, change counts and propagation times are metrics on the relay per CTR-OBS-001.
- **PS-132-08.R02** Read-only takes effect within 5 seconds and federation kill within 60 seconds, measured by the propagation check.
- **PS-132-08.R03** Drill age and lint results are reported in the release gate.

## Specification

**Metrics**
- classrup_security_read_only (gauge 0 or 1)
- classrup_security_federation_enabled (gauge 0 or 1)
- classrup_security_containment_change_total{switch,state,via=command|host}
- classrup_security_containment_propagation_ms{switch} (histogram)

**Logs**
- relay warn containment.changed {switch, state, via, reasonLength, correlationId} — reason text stays in the audit entry.

**Budgets**
- read-only propagation ≤ 5 s; federation kill ≤ 60 s; rejection overhead ≤ 0.1 ms per request; sentinel poll ≤ 0.05 ms.
- Linter and inventory generation runtime ≤ 30 s on the repository.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T11 | load | PS-132-08.R01, PS-132-08.R02, PS-132-08.R03 | 1 000 requests per second during toggle on a staging relay | propagation ≤ 5 s; overhead ≤ 0.1 ms; gauges correct |
| TEST-PS-132-09.T14 | unit | PS-132-08.R03 | drill record dated 7 months ago | SECURITY_RUNBOOK_DRILL_STALE and gate failed |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F16.S01.M01, F11.S03.M01, F15.S02.M01, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
