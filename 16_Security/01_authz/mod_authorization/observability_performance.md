# PS-126-08 — Observability and performance: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-08.R01** Authorization outcomes and latency are measured per CTR-OBS-001 with labels limited to module, code and outcome and no keys.
- **PS-126-08.R02** authorize adds at most 0.2 ms p95 in a vault and 0.5 ms p95 on a relay, excluding fact lookups.
- **PS-126-08.R03** Audit append lag and chain verification time are observable.

## Specification

**Metrics**
- classrup_security_authorize_total{outcome=allow|deny|quarantine,code}
- classrup_security_authorize_us (histogram)
- classrup_security_audit_append_lag_ms
- classrup_security_role_assignments{role} (gauge)

**Logs**
- relay info authz.deny {capability, reason, correlationId} — no key, no payload.

**Budgets**
- authorize p95 ≤ 0.5 ms (relay) and ≤ 0.2 ms (vault); role assign p95 ≤ 300 ms.
- Chain verification of 100 000 entries completes in ≤ 10 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T13 | load | PS-126-08.R01, PS-126-08.R02, PS-126-08.R03 | 5 000 authorize calls per second for 5 minutes; verify 100 000 entries | p95 targets met; verification ≤ 10 s |

## Dependencies

Module depends on: CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
