# PS-133-08 — Observability and performance: Security threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M01 Security threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-133-08.R01** CI reports the number of rows, STRIDE coverage, dangling references and review age as numbers on every run.
- **PS-133-08.R02** The check runs in under 30 seconds on the full repository.
- **PS-133-08.R03** Review debt (days since last review, open residual risks) is shown in the release gate report.

## Specification

**Metrics**
- threat_rows_total{boundary} (CI report)
- threat_review_age_days (CI report)
- threat_rows_without_test (CI report, must be 0)

**Logs**
- CI job log lists each failing rule with row ID and reference; no secrets involved.

**Budgets**
- Check runtime ≤ 30 s on the full repository; report size ≤ 1 MiB.
- Review of a change set of up to 10 rows completes within 2 working days (process target).

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-133-09.T05 | integration | PS-133-03.R03, PS-133-08.R03 | residual risk with review date 7 months old | SECURITY_THREATMODEL_REVIEW_STALE and gate failed state shown in the report |
| TEST-PS-133-09.T10 | load | PS-133-08.R01, PS-133-08.R02 | full repository with 148 module specs and 200 register rows | check completes ≤ 30 s; metrics present in report |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S02.M03, F12.S03.M03, CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
