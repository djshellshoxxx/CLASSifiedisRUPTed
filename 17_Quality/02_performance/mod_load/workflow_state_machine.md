# PS-139-03 — Workflow state machine: Load testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M01 Load testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/load` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-139-03.R01** There is no entity lifecycle; a load run goes through phases seed, warm-up (30 s, discarded), measure and report.
- **PS-139-03.R02** A run ends with exit 0 only if every scenario passes; otherwise exit 1; invalid runs exit 2.
- **PS-139-03.R03** A soak run additionally checks that memory growth stays under 10 % between minute 10 and minute 60.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-139-09.T06 | unit | PS-139-03.R01, PS-139-03.R02, PS-139-04.R03 | run phases with a stub relay | warm-up discarded; exit codes follow the documented mapping |
| TEST-PS-139-09.T07 | load | PS-139-03.R03, PS-139-06.R03 | soak against the relay with a planted memory leak | growth above 10 % flagged and exit 1 |

## Dependencies

Module depends on: CTR-OBS-001, CTR-TST-001, CTR-IDM-001, CTR-ERR-001, F17.S01.M01, F15.S02.M01, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
