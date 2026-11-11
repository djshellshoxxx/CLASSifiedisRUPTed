# PS-132-02 — Validation rules: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-02.R01** The documentation linter validates runbook structure, step time targets and references to capabilities, flags, error codes and modules.
- **PS-132-02.R02** Switch commands validate reason text and role before applying, and never accept empty reasons.
- **PS-132-02.R03** Every violation maps to one stable lint or runtime error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | each runbook has trigger, roles, numbered steps with time targets, verification, rollback and communication sections | SECURITY_RUNBOOK_INCOMPLETE |
| V02 | every capability, flag, error code and module referenced in a runbook exists in the specs and catalog | SECURITY_RUNBOOK_DANGLING_REFERENCE |
| V03 | read-only and federation switch changes carry a reason of 10..500 code points and an admin or operator role | VALIDATION_FAILED |
| V04 | the last tabletop drill date is within 6 months of the release date | SECURITY_RUNBOOK_DRILL_STALE |
| V05 | runbooks and templates contain no claim of external audit, certification or guaranteed security | SECURITY_RUNBOOK_FORBIDDEN_CLAIM |
| V06 | a mutating command while read-only mode is active and not exempt | SECURITY_READ_ONLY_MODE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T01 | unit | PS-132-01.R01, PS-132-01.R02, PS-132-02.R01, PS-132-04.R01, PS-132-04.R03, PS-132-09.R02 | lint the seven runbooks and each broken fixture | valid passes; each broken fixture yields its SECURITY_RUNBOOK_* code with runbook ID |
| TEST-PS-132-09.T02 | unit | PS-132-01.R03, PS-132-02.R02, PS-132-02.R03 | switch command with empty reason, short reason, wrong role | VALIDATION_FAILED, VALIDATION_FAILED, FORBIDDEN |
| TEST-PS-132-09.T14 | unit | PS-132-02.R03, PS-132-08.R03 | drill record dated 7 months ago | SECURITY_RUNBOOK_DRILL_STALE and gate failed |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F15.S04.M02, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
