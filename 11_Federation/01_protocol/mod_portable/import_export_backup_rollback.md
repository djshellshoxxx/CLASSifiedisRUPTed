# PS-083-10 — Import, export, backup and rollback: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-10.R01** The library stores nothing, so user export and import of federated content is handled by F11.S01.M02 and F11.S03.M03.
- **PS-083-10.R02** Allowlists and registry rows are versioned data; adding a field is a schema minor change and removing one is a major change with a 180-day dual-read period.
- **PS-083-10.R03** Rollback to a previous release must never widen an allowlist or relax a registry role, so a downgrade fails closed.

## Specification

- **export:** Allowlist tables and the statement-type registry are exported as build artifacts (allowlists.json, statement-registry.json) with each release for audit; no user data.
- **import:** No user data is imported by this module; inbound payload validation uses the allowlist and registry bundled with the running release.
- **backup:** Nothing to back up; allowlists and the registry are versioned in source control with the schema registry.
- **migration rollback:** Expand/contract: new optional fields are added to the allowlist in a release before any producer uses them; rollback restores the earlier narrower allowlist, which rejects newer payload members as FEDERATION_PAYLOAD_INVALID, and unknown newer statement types are quarantined.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T15 | unit | PS-083-10.R01, PS-083-10.R02, PS-083-10.R03 | upgrade allowlist v1 to v1 plus optional field; read older drafts; downgrade | older mirror views still validate; rollback keeps v1 behavior and rejects newer members |

## Dependencies

Module depends on: F06.S02.M01, F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001, CTR-ID-001. Predecessor: [domain_schema.md](domain_schema.md).
