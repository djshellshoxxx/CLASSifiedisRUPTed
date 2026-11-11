# PS-082-03 — Workflow state machine: Privacy threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M01 Privacy threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/privacy/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-082-03.R01** Threat entries move from active to retired only with a recorded reason, never by deletion.
- **PS-082-03.R02** Each release candidate triggers a review task listing changed modules since the last review.
- **PS-082-03.R03** Accepting residual risk requires a named reviewer and date.

## Specification

**Note:** Documentation lifecycle only: draft, reviewed, retired tracked by fields in the YAML file and by git history; no runtime state machine.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-082-09.T04 | unit | PS-082-03.R01 | retire a threat without reason, then with reason; delete an entry | retire without reason fails; deletion detected by diff check and fails |
| TEST-PS-082-09.T05 | unit | PS-082-03.R03 | residual risk accepted without reviewer or date | check fails |
| TEST-PS-082-09.T15 | unit | PS-082-03.R02, PS-082-06.R03 | run privacy-threat-check --release-candidate on the fixture history, then rebuild the same release candidate | a review task listing the modules changed since the last review is generated once; the rebuild does not duplicate it |

## Dependencies

Module depends on: F10.S02.M02, F10.S02.M03, F10.S01.M01, CTR-PRV-001, CTR-FED-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
