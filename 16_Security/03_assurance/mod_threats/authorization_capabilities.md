# PS-133-05 — Authorization and capabilities: Security threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M01 Security threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-133-05.R01** Only maintainers with review rights can merge changes to docs/security/threat_model and a change author cannot be the sole approver.
- **PS-133-05.R02** The generated report is public to contributors and the user-facing summary is public.
- **PS-133-05.R03** Draft entries describing unpatched vulnerabilities are kept in the private security advisory process until fixed, then merged.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-133-09.T07 | abuse | PS-133-05.R01, PS-133-05.R03, PS-133-07.R03 | author self-approves register change; document containing 'externally audited'; draft with exploit details | merge blocked by required reviewers; SECURITY_THREATMODEL_FORBIDDEN_CLAIM; flagged by review checklist and kept in the private advisory |
| TEST-PS-133-09.T16 | integration | PS-133-09.R03, PS-133-05.R02 | release gate with a passing register and with a failing one; publish the report and summary | gate passes then fails; report and summary readable without repository write access |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S02.M03, F12.S03.M03, CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
