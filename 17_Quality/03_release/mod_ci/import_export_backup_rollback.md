# PS-141-10 — Import, export, backup and rollback: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-10.R01** Workflow files and the lint script are the only exports; there is no user data.
- **PS-141-10.R02** A new workflow is introduced by pull request and validated by the lint before merge; branch protection settings are documented in the repository settings file.
- **PS-141-10.R03** Rollback is a git revert of the workflow change; in-flight runs finish with their previous definition.

## Specification

- **export:** Workflow YAML in git; run reports as CI artifacts.
- **import:** Not applicable: workflows import no data; actions and dependencies come only from the lockfile and first-party actions.
- **backup:** Repository hosting provides history; no module-specific backup.
- **migration rollback:** Revert the workflow commit; branch protection continues to require gate-summary.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T13 | integration | PS-141-10.R01, PS-141-10.R02, PS-141-10.R03 | introduce a new workflow in a branch and revert | lint validates before merge; revert restores prior behavior |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S03.M02, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
