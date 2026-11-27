# PS-150-10 — Import, export, backup and rollback: Bounded local matching

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S02.M01 Bounded local matching](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/local_matching/matcher` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-150-10.R01** Export no matching job or result because this module owns no persistent row.
- **PS-150-10.R02** Recovered intents are draft and require a new explicit match action after backup import.
- **PS-150-10.R03** Preserve signed public formats and discovery provenance; remote confidential protocols require independent qualification.

## Specification

- **export:** No job/result export exists; owning domains export their own records.
- **import:** Discovery retains signature and provenance admission; private criteria never enter public imports.
- **backup:** Legacy archives remain compatible; unknown/malformed records fail closed and recovered content never resumes authority.
- **migration rollback:** Existing formats and storage drivers remain unchanged; disabled state preserves owner inspection and erasure.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-150-09.T10 | integration | PS-150-10.R01, PS-150-10.R02, PS-150-10.R03 | Erase/reopen and restore an active intent from backup before requesting matching | Recovered intent is draft and no loader resumes automatically; results/context are never restored |

## Dependencies

Module depends on: F19.S01.M01, F06.S01.M01, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
