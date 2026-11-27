# PS-149-02 — Validation rules: Private local intents

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S01.M01 Private local intents](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/intents/local` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-149-02.R01** Validate closed criteria, canonical UTC expiry and safe positive expected revisions before mutation.
- **PS-149-02.R02** Bound query to 120 characters, canonical nonnegative amounts to 78 digits and live intents to 50.
- **PS-149-02.R03** Reject unknown authority fields, identifier collisions and expired creation or activation without partial writes.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | closed bounded criteria and canonical expiry | VALIDATION_FAILED |
| V02 | expected revision equals current revision | CONFLICT_REVISION |
| V03 | creation and activation precede expiry | EXPIRED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-149-09.T02 | unit | PS-149-02.R01, PS-149-02.R02, PS-149-02.R03 | Try unknown authority fields, invalid times, 51 live intents and noncanonical or reversed amount bounds | Reject malformed or excessive input without partial writes or truncation |

## Dependencies

Module depends on: F15.S02.M03, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
