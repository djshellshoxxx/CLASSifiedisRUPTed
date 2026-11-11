# PS-082-08 — Observability and performance: Privacy threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M01 Privacy threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/privacy/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-082-08.R01** The CI check reports counts of threats, controls and tests, and the age of the last review.
- **PS-082-08.R02** A review older than 90 days fails release candidate builds at once, while other builds warn on days 91 to 104 and fail from day 105.
- **PS-082-08.R03** The check runs within the CI time budget.

## Specification

**Metrics**
- CI report: threats_total, threats_without_test, controls_unresolved, days_since_review, review_state=ok|warn|fail

**Logs**
- CI log lists each violation with file, entry ID and rule ID.

**Budgets**
- privacy-threat-check completes in ≤ 5 s for 100 entries; rendering Markdown ≤ 10 s.
- Review age - non-release-candidate builds pass through day 90, warn on days 91 to 104 and fail from day 105; release candidate builds fail from day 91.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-082-09.T12 | unit | PS-082-08.R01, PS-082-08.R02, PS-082-08.R03 | run on 100 entries with review ages 90, 91, 104 and 105 days as a non-release-candidate build, and 90 and 91 days as a release candidate build | completes ≤ 5 s; non-RC passes at 90, warns at 91 and 104 and fails at 105; RC passes at 90 and fails at 91 |

## Dependencies

Module depends on: F10.S02.M02, F10.S02.M03, F10.S01.M01, CTR-PRV-001, CTR-FED-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
