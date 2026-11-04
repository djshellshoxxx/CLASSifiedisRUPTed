# PS-076-02 — Validation rules: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-02.R01** Grant input is validated strictly, including purpose, scope and policy hash.
- **PS-076-02.R02** A grant is accepted only for the currently bundled policy version of the purpose.
- **PS-076-02.R03** Defaults are enforced in code, so processing is allowed only when a granted, non-lapsed consent exists.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | purpose is one of the five defined purposes | VALIDATION_FAILED |
| V02 | relayId is present for federation_publish and notify_push and refers to a relay the user selected | VALIDATION_FAILED |
| V03 | policyHash equals the hash of the current bundled policy text for the purpose | PRIVACY_POLICY_STALE |
| V04 | the purpose is available in this build and not disabled by a feature flag | FEATURE_DISABLED |
| V05 | withdraw targets a granted consent | CONFLICT_STATE |
| V06 | scope.recordKinds has at most 20 entries from the known record kinds | VALIDATION_FAILED |
| V07 | at most 30 grant or withdraw operations per hour per vault | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T01 | unit | PS-076-01.R01, PS-076-01.R03, PS-076-02.R01 | grant federation_publish for a relay with the current hash | row stored granted, statement signed with policy hash |
| TEST-PS-076-09.T03 | unit | PS-076-02.R02, PS-076-02.R03 | rules V01 to V07 violated in turn | documented error code and nothing stored |
| TEST-PS-076-09.T04 | unit | PS-076-02.R03, PS-076-07.R01 | fresh vault, check every purpose | all return granted false |
| TEST-PS-076-09.T08 | integration | PS-076-04.R03, PS-076-02.R03 | consumer without consent tries processing; error injected into check | processing blocked in both cases |

## Dependencies

Module depends on: F07.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
