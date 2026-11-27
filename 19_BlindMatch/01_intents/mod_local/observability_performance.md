# PS-149-08 — Observability and performance: Private local intents

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S01.M01 Private local intents](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/intents/local` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-149-08.R01** Logging, audit and metrics collection are absent from the local API and remain off by default.
- **PS-149-08.R02** Reject capacity overflow explicitly without silently truncating live intents or hard criteria.
- **PS-149-08.R03** Qualify encrypted storage and target-device resource behavior before activation; host tests are not mobile evidence.

## Specification

**Metrics**
- Disabled and absent; no implicit anonymous collection exception.

**Logs**
- Disabled and absent; no identifying audit or debug export.

**Budgets**
- 50 live intents, 120-character query, 78-digit canonical amount bounds.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-149-09.T08 | contract | PS-149-08.R01, PS-149-08.R02, PS-149-08.R03 | Exercise bounded capacity and spy on network/logging APIs; separately qualify target devices | No truncation, network or logging; mobile resource acceptance remains a release gate |

## Dependencies

Module depends on: F15.S02.M03, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
