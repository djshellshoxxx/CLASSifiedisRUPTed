# PS-142-02 — Validation rules: Compatibility

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M03 Compatibility](SPEC.md) · **Scope:** MVP · **Code:** `tests/compat` · **Contracts:** [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-142-02.R01** The current release must read every N-1 fixture and, after upgrade, every record validates against its current schema and every N-1 signature still verifies.
- **PS-142-02.R02** Schemas follow expand and contract: removed required fields or changed meanings of a field fail the schema diff check with QUALITY_COMPAT_BREAKING_CHANGE.
- **PS-142-02.R03** Unknown optional fields are ignored by readers and unknown major versions are refused with UNSUPPORTED_SCHEMA_VERSION.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Current release reads all N-1 fixtures and upgraded records validate against current schemas | QUALITY_COMPAT_N1_READ_FAILED |
| V02 | Schema diff against the previous tag shows no removed or retyped fields within a major version | QUALITY_COMPAT_BREAKING_CHANGE |
| V03 | N-1 signed statements still verify after upgrade | QUALITY_COMPAT_SIGNATURE_BROKEN |
| V04 | Vault upgrade interrupted at any step loses and duplicates zero records | QUALITY_COMPAT_UPGRADE_UNSAFE |
| V05 | Every browser matrix cell passes smoke or is documented as unsupported | QUALITY_COMPAT_BROWSER_FAILED |
| V06 | Relay OpenAPI diff has no removed paths, removed fields or retyped fields | QUALITY_COMPAT_API_BREAKING |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-142-09.T02 | integration | PS-142-02.R01, PS-142-06.R02 | upgrade the N-1 vault and validate all records and signatures; open N vault with N-1 code | all records valid and signatures verify; N-1 ignores unknown optional fields |
| TEST-PS-142-09.T03 | unit | PS-142-02.R02, PS-142-09.R02 | planted breaking changes: field removed, type changed, required field added | each fails with QUALITY_COMPAT_BREAKING_CHANGE |
| TEST-PS-142-09.T04 | unit | PS-142-02.R03, PS-142-10.R02 | statement with unknown optional field and with unknown major version | optional ignored; major refused with UNSUPPORTED_SCHEMA_VERSION; N export into N-1 refused clearly |

## Dependencies

Module depends on: CTR-SCH-001, CTR-ERR-001, CTR-FED-001, CTR-IOX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
