# PS-143-03 — Workflow state machine: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-03.R01** There is no entity lifecycle; the release process is a sequence of gates, each pass or fail, with the final verdict GO only when all pass.
- **PS-143-03.R02** Gates run in the order spec, traceability, audit, a11y, budgets, changelog and all run even after a failure so the report is complete.
- **PS-143-03.R03** A waiver is a documented entry in gates/waivers.yaml with ID, reason, owner and expiry date at most 14 days away; expired waivers fail.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T05 | unit | PS-143-03.R01, PS-143-03.R02 | run all gates on a repo with two failures | all gates run; verdict fails; both failures listed |
| TEST-PS-143-09.T06 | unit | PS-143-03.R03, PS-143-05.R02 | waiver 15 days long, expired, valid | long and expired fail QUALITY_GATE_WAIVER_EXPIRED; valid passes and is reported as waived |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
