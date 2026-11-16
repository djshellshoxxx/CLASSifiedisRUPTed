# PS-133-02 — Validation rules: Security threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M01 Security threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-133-02.R01** The traceability tool validates every row's references against module specs and test IDs.
- **PS-133-02.R02** Coverage rules require at least one row per STRIDE letter for each boundary B1 to B6, or a recorded not-applicable reason.
- **PS-133-02.R03** Every violation produces a stable tool error code and fails the CI job.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | each boundary B1–B6 has rows for S, T, R, I, D and E or a not-applicable reason of at least 20 characters | SECURITY_THREATMODEL_COVERAGE_GAP |
| V02 | every row references an existing module ID and requirement ID | SECURITY_THREATMODEL_DANGLING_CONTROL |
| V03 | every row references at least one test ID that exists in the module's spec | SECURITY_THREATMODEL_NO_TEST |
| V04 | residual risk text is present and review date is within 6 months of the release date | SECURITY_THREATMODEL_REVIEW_STALE |
| V05 | no row or summary claims third-party audit, certification or guaranteed security | SECURITY_THREATMODEL_FORBIDDEN_CLAIM |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-133-09.T01 | unit | PS-133-01.R01, PS-133-01.R02, PS-133-02.R01 | parse the valid fixture register | 42 rows parsed with all required fields; boundaries B1–B6, X1, X2 recognized |
| TEST-PS-133-09.T02 | unit | PS-133-02.R02, PS-133-02.R03 | each broken fixture | documented SECURITY_THREATMODEL_* code, row ID in the message, exit 1 |
| TEST-PS-133-09.T03 | unit | PS-133-01.R03, PS-133-02.R01 | boundary with all STRIDE letters, and one with a not-applicable reason of 10 characters | accepted for the full set; reason under 20 characters rejected |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S02.M03, F12.S03.M03, CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
