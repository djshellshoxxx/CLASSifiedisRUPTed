# PS-082-10 — Import, export, backup and rollback: Privacy threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M01 Privacy threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/privacy/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-082-10.R01** The catalog is exported as part of the documentation release bundle and the repository is its backup.
- **PS-082-10.R02** Importing a catalog from another fork runs the same check before acceptance.
- **PS-082-10.R03** Format changes are versioned with schemaVersion and old versions remain readable for 180 days.

## Specification

- **export:** threats.yaml and THREAT_MODEL.md are part of the release documentation bundle; no user data is involved.
- **import:** A catalog from another source is accepted only when privacy-threat-check passes against the local repository.
- **backup:** Git history is the backup; no runtime storage.
- **migration rollback:** schemaVersion field in threats.yaml; a rollback restores the previous tag and its matching check version together.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-082-09.T14 | integration | PS-082-10.R01, PS-082-10.R02, PS-082-10.R03 | export the catalog bundle and restore from git tag | identical files and check result; schema v1 file validates after upgrade |

## Dependencies

Module depends on: F10.S02.M02, F10.S02.M03, F10.S01.M01, CTR-PRV-001, CTR-FED-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
