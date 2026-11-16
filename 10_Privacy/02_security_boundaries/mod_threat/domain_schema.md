# PS-082-01 — Domain schema: Privacy threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M01 Privacy threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/privacy/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-082-01.R01** The catalog is a versioned YAML file (threats.yaml) plus rendered Markdown, with one entry per threat holding id, title, adversaries, assets, attack, controls, residual risk, tests and status.
- **PS-082-01.R02** Controls reference real requirement IDs of the form PS-NNN-pp.Rnn and test IDs of the form PRIVT-<area>-<nn>.
- **PS-082-01.R03** Entries are P0 documentation and contain no personal data or exploit code.

## Specification

**Note:** Documentation module. It owns no runtime entity. The catalog entry format is: id PT-nn, title, adversaries[A1..A7], assets[], attack, controls[{module, requirement}], residualRisk, tests[PRIVT ids], status active|retired, reviewedAt, reviewer.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-082-09.T01 | unit | PS-082-01.R01, PS-082-01.R02, PS-082-02.R01 | run the check on the valid fixture and on one missing a test | valid passes with exit 0; invalid exits 1 naming the entry and rule |
| TEST-PS-082-09.T02 | unit | PS-082-01.R03, PS-082-02.R02 | catalog with a dangling PS requirement ID and unknown PRIVT ID | both reported with entry ID |
| TEST-PS-082-09.T11 | manual | PS-082-07.R03, PS-082-01.R03 | reviewer reads the user-facing summary page | states pseudonymity is not anonymity, relay metadata visibility and non-recall limits; reading level grade 8 |

## Dependencies

Module depends on: F10.S02.M02, F10.S02.M03, F10.S01.M01, CTR-PRV-001, CTR-FED-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
