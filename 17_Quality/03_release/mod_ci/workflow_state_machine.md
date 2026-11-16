# PS-141-03 — Workflow state machine: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-03.R01** A workflow run moves through queued, in progress, then success, failure or cancelled; cancelled by newer push is a normal outcome.
- **PS-141-03.R02** The nightly workflow opens or updates one issue labelled nightly-failure when a long run fails and closes it when the next run passes.
- **PS-141-03.R03** Job dependency graph: install, then parallel spec-check, typecheck, unit-property-integration and build-pwa, then e2e-smoke after build-pwa, then gate-summary.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T03 | unit | PS-141-02.R02, PS-141-03.R03, PS-141-04.R01 | parse ci.yml job graph and triggers | install precedes all; e2e-smoke needs build-pwa; triggers include push, pull_request, workflow_dispatch, schedule for nightly |
| TEST-PS-141-09.T04 | integration | PS-141-02.R03, PS-141-03.R01 | simulate run with one failed and one skipped-by-filter job | gate-summary fails for failure and passes for path-filter skip |
| TEST-PS-141-09.T05 | integration | PS-141-03.R02, PS-141-06.R02 | nightly failure then success | one nightly-failure issue opened, updated, then closed |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S03.M02, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
