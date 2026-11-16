# PS-145-02 — Validation rules: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-02.R01** Profile content is validated against bounds and privacy floors before it is staged, released or applied.
- **PS-145-02.R02** Selection and resolution validate trust in the publisher and the profile status.
- **PS-145-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | code matches [a-z0-9-]{2,32}; names 1..60 code points with en present | VALIDATION_FAILED |
| V02 | evidenceDays in 180..3650, standardPurgeDays in 7..90, auditDays in 90..730 | GOVERNANCE_PROFILE_BOUNDS |
| V03 | no field requests public location above L2, exposure of exact addresses or federation of P2 data | GOVERNANCE_PROFILE_PRIVACY_FLOOR |
| V04 | minimumAge between 13 and 21 | GOVERNANCE_PROFILE_BOUNDS |
| V05 | at most 20 notices, each with a textKey, and at most 200 restricted category ids | VALIDATION_FAILED |
| V06 | disclaimerKey present | VALIDATION_FAILED |
| V07 | activation of a changed profile cites a proposal verified by F18.S02.M01 for this profile code | GOVERNANCE_PROFILE_PROPOSAL_REQUIRED |
| V08 | profile signature verifies and publisher is trusted by this vault when selecting | GOVERNANCE_PROFILE_UNTRUSTED |
| V09 | version is greater than the stored version for the same publisher and code | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T01 | unit | PS-145-01.R01, PS-145-02.R01, PS-145-02.R02 | draft a valid profile and one with bad code | stored revision 1; invalid input rejected with documented code |
| TEST-PS-145-09.T02 | unit | PS-145-01.R02, PS-145-01.R03, PS-145-02.R03 | violate each rule V01-V09 | documented error code returned; nothing released or stored |
| TEST-PS-145-09.T03 | property | PS-145-01.R03, PS-145-02.R02 | random retention and location values | values outside bounds or above L2 never accepted |

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
