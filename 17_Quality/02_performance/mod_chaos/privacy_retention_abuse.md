# PS-138-07 — Privacy, retention and abuse: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-07.R01** Chaos data are synthetic; reports contain scenario names, seeds and invariant results only.
- **PS-138-07.R02** Logs from the relay during chaos are scanned for P2–P4 canaries; faults must not cause sensitive data to be logged in error paths.
- **PS-138-07.R03** Reports retained 30 days.

## Specification

**Data classification**
- Synthetic test data only (P0/P1) in in-memory relays.
- Reports: scenario names, seeds, invariant verdicts.

**Retention**
- Reports 30 days as CI artifacts; no persistent stores.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Chaos hooks shipped to production | production bundle scan fails with QUALITY_CHAOS_HOOK_IN_PROD; hooks compiled only under the test entry point |
| T02 | Failure paths leak P3 data into logs | captured relay logs scanned for P3 canaries after every scenario |
| T03 | Scenario runner used against a real relay | runner accepts only in-process relay handles, not URLs |

**Abuse controls**
- Nightly chaos workflow runs without secrets and on schedule only (no fork pull request trigger).
- Bounds on faults are code-enforced; they cannot be raised by scenario files.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T10 | abuse | PS-138-07.R02, PS-138-07.R03 | grep captured logs for P3 canary after each scenario | none found; retention config 30 days |
| TEST-PS-138-09.T11 | chaos | PS-138-07.R01, PS-138-08.R01, PS-138-08.R03 | run all scenarios and read the report | metrics present, recovery times recorded, seeds listed |

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03, F15.S01.M01, F11.S02.M01, F11.S01.M02, F01.S03.M01, F16.S02.M02, F16.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
