# PS-099-02 — Validation rules: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-02.R01** Policy input is validated against bounded ranges so an operator cannot set unlimited rates.
- **PS-099-02.R02** The port validates its inputs and never throws; invalid input is treated as a denied request.
- **PS-099-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | ratePerMinute 1..6000, burst 1..1000, prefixMultiplier 1..20 | VALIDATION_FAILED |
| V02 | capabilityClass is registered in the capability registry or is a built-in class | VALIDATION_FAILED |
| V03 | classes relay.access, report.receive and key.register keep failMode closed | RATE_POLICY_FAIL_MODE_LOCKED |
| V04 | expectedRevision matches the stored policy revision | CONFLICT_REVISION |
| V05 | bucket reset targets a key hash that exists and is requested by an operator | NOT_FOUND |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T03 | unit | PS-099-02.R01, PS-099-02.R02, PS-099-02.R03 | policy with rate 0, burst 2000, fail open on relay.access | VALIDATION_FAILED, VALIDATION_FAILED, RATE_POLICY_FAIL_MODE_LOCKED |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
