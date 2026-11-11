# PS-132-02 — Validation rules: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-02.R01** The documentation linter validates runbook structure, step time targets and references to capabilities, commands, error codes and modules.
- **PS-132-02.R02** Switch commands validate reason text and the relay-scope role before applying, and never accept empty reasons.
- **PS-132-02.R03** Every violation maps to one stable lint or runtime error code.
- **PS-132-02.R04** The linter compares the RB-02 notice inventory with the relay storage declarations of the module specs and the relay secret manifest, so a notice can never understate what a relay held.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | each runbook has trigger, roles, numbered steps with time targets, verification, rollback and communication sections | SECURITY_RUNBOOK_INCOMPLETE |
| V02 | every capability, command, error code and module referenced in a runbook exists in the specs and catalog | SECURITY_RUNBOOK_DANGLING_REFERENCE |
| V03 | read-only and federation switch changes carry a reason of 10..500 code points | VALIDATION_FAILED |
| V04 | the last tabletop drill date is within 6 months of the release date | SECURITY_RUNBOOK_DRILL_STALE |
| V05 | runbooks and templates contain no claim of external audit, certification or guaranteed security | SECURITY_RUNBOOK_FORBIDDEN_CLAIM |
| V06 | a mutating relay command arrives while the read-only sentinel exists and its command ID is not on the exemption list | SECURITY_READ_ONLY_MODE |
| V07 | security.containment.set is signed by an active device key of a principal holding a relay-scope relay_operator or admin role on this relay, or comes from the host CLI with --local while the database is unavailable | FORBIDDEN |
| V08 | the RB-02 notice inventory equals the generated inventory of entities with storage relay or relay+device and their privacy classes, plus the relay secrets of the F16.S01.M02 manifest and the F15.S02.M01 key file | SECURITY_RUNBOOK_INVENTORY_MISMATCH |
| V09 | every notice template fills relay name, description, data classes, user actions, contact route and relay-signed time | SECURITY_RUNBOOK_INCOMPLETE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T01 | unit | PS-132-01.R01, PS-132-02.R01, PS-132-02.R03, PS-132-04.R03, PS-132-09.R03 | lint the seven runbooks and each broken fixture | valid passes; each broken fixture yields its SECURITY_RUNBOOK_* code with runbook ID |
| TEST-PS-132-09.T02 | unit | PS-132-02.R02, PS-132-05.R01 | security.containment.set with empty reason, a 5-character reason, member U's key and tenant operator T1's key | VALIDATION_FAILED, VALIDATION_FAILED, FORBIDDEN, FORBIDDEN |
| TEST-PS-132-09.T16 | unit | PS-132-02.R04, PS-132-03.R02, PS-132-01.R03 | RB-02 template inventory against the generated inventory; template without push subscriptions; template without contact route | match; SECURITY_RUNBOOK_INVENTORY_MISMATCH; SECURITY_RUNBOOK_INCOMPLETE |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F16.S01.M01, F11.S03.M01, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
