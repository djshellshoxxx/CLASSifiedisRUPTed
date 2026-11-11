# PS-133-10 — Import, export, backup and rollback: Security threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M01 Security threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-133-10.R01** The register is exportable as JSON and markdown from the repository and the export includes the review history.
- **PS-133-10.R02** Importing a register from a fork requires passing the same checks and does not replace local review history.
- **PS-133-10.R03** Register schema changes are versioned, and the checker keeps reading the previous version for 180 days.

## Specification

- **export:** pnpm security:threats:export writes THREAT_MODEL.json and THREAT_MODEL.md with rows, boundaries, review history and the model version tag.
- **import:** pnpm security:threats:check --input file validates an external register using the same rules and prints differences against the local one; nothing is merged automatically.
- **backup:** Covered by repository history and release tags; no runtime backup.
- **migration rollback:** Register schema is versioned in front matter; the checker supports the current and previous version; rollback is a revert of the pull request plus the tag.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-133-09.T13 | integration | PS-133-10.R01, PS-133-10.R02, PS-133-10.R03 | export register as JSON, import into the checker in a fresh checkout, bump schema version | identical results; old version still parsed for 180 days |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S02.M03, F12.S03.M03, CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
