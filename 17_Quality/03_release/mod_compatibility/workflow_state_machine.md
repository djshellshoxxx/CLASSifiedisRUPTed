# PS-142-03 — Workflow state machine: Compatibility

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M03 Compatibility](SPEC.md) · **Scope:** MVP · **Code:** `tests/compat` · **Contracts:** [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-142-03.R01** Vault upgrade runs through states N-1, upgrading and N; interruption in upgrading must resume or roll back on next start with zero lost or duplicated records.
- **PS-142-03.R02** Browser matrix cells move through queued, running and pass, fail or unsupported; a cell marked unsupported needs an entry in the support policy.
- **PS-142-03.R03** A release is blocked when any cell for last-2 Chrome, Firefox or Safari fails its smoke journey.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-142-09.T05 | chaos | PS-142-03.R01, PS-142-06.R01 | interrupt vault upgrade at each step, then restart | resumes or rolls back; zero lost and zero duplicated records; second upgrade identical |
| TEST-PS-142-09.T06 | e2e | PS-142-03.R02, PS-142-03.R03 | browser matrix smoke on Chrome, Firefox and WebKit | cells report pass; unsupported cells match the policy; a failing cell blocks with exit 2 |

## Dependencies

Module depends on: CTR-SCH-001, CTR-ERR-001, CTR-FED-001, CTR-IOX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
