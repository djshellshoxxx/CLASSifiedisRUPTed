# PS-133-03 — Workflow state machine: Security threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M01 Security threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-133-03.R01** The review procedure is draft, peer-reviewed by two maintainers, merged and tagged, and the gate fails if the last tagged review is older than the previous release.
- **PS-133-03.R02** A new or changed boundary, a new module that handles keys, money or location, or a security incident of severity SEV1 or SEV2 triggers an out-of-cycle review within 14 days.
- **PS-133-03.R03** Residual risks are reviewed every 6 months with the owner and date recorded in the row.

## Specification

**Note:** Documents have no application lifecycle; the review process is a release-time procedure described in requirements.

### Timeouts and scheduled transitions

- Review cadence: every release and at least every 6 months.
- Out-of-cycle review within 14 days of a trigger.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-133-09.T04 | integration | PS-133-03.R01, PS-133-03.R02 | change a control module ID in a spec; add a module touching keys without register rows | dangling reference error; out-of-cycle review flag raised |
| TEST-PS-133-09.T05 | integration | PS-133-03.R03, PS-133-08.R03 | residual risk with review date 7 months old | SECURITY_THREATMODEL_REVIEW_STALE and gate failed state shown in the report |
| TEST-PS-133-09.T12 | manual | PS-133-03.R01, PS-133-04.R03, PS-133-10.R01 | tabletop review of rows T02, T37 and T39 by two maintainers before each release | review recorded with date and reviewers; any change merged via pull request |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S02.M03, F12.S03.M03, CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
