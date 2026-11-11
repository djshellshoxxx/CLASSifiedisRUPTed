# PS-145-10 — Import, export, backup and rollback: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-10.R01** The user export contains stored profiles with provenance and the local selection; the trusted-publisher list is exported by F18.S02.M01.
- **PS-145-10.R02** Import re-verifies signatures, bounds, privacy floors and recorded decisions; failing profiles are stored as read-only history.
- **PS-145-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Sections governance.jurisdiction_profiles and governance.profile_selection in classrup-export/v1 through ExportSectionPort, one line per JurisdictionProfile (schema classrup.governance.jurisdiction_profile/v1); the selection line includes the age declaration because the export goes to the owner only.
- **import:** Profiles from publishers not trusted in the importing vault go to the pending inbox; selection is restored only for ProfileRefs that verify; bounds violations are rejected in the dry-run.
- **backup:** Vault export is the primary backup (IOX-6); relays hold public signed profiles that can be re-fetched.
- **migration rollback:** Additive optional fields only in v1 (cashLimit, breachNotificationHours, ageGate and taxonomyRef are optional); rollback is by reinstalling the previous release; to undo a profile change the publisher releases the earlier content as a higher version with a decision.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T14 | integration | PS-145-10.R01, PS-145-10.R02, PS-145-10.R03 | export, import to fresh vault, import profile with bad bounds | round-trip; invalid profile rejected in dry-run |

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-MNY-001. Predecessor: [domain_schema.md](domain_schema.md).
