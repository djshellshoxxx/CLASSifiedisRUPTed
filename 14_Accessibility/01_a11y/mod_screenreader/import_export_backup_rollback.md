# PS-110-10 — Import, export, backup and rollback: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-10.R01** The module stores no user data, so a user export contains nothing from it.
- **PS-110-10.R02** Spoken-name patterns live in the locale catalogs of F14.S02.M01 and follow their versioning.
- **PS-110-10.R03** Rollback restores the previous release patterns without data migration.

## Specification

- **export:** No module data is exported; spoken-name patterns are part of the message catalogs.
- **import:** Nothing is imported; user alt text arrives inside the owning record's MediaRef or attachment.
- **backup:** Nothing to back up; code and catalogs ship with the app bundle.
- **migration rollback:** Pattern keys are additive; rollback to the previous release restores previous strings and helpers with no data migration.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T05 | contract | PS-110-04.R01, PS-110-04.R02, PS-110-04.R03, PS-110-01.R02, PS-110-01.R03, PS-110-03.R03, PS-110-05.R01, PS-110-05.R02, PS-110-10.R01 | inspect exports, storage and network calls; run spoken helpers on typed inputs and invalid ones | no vault, IndexedDB or network access; no stored data or persisted state; pure typed functions; Ok for valid input; Err(COMMERCE_MONEY_INVALID) for amount '01'; alt text taken only from props |
| TEST-PS-110-09.T14 | unit | PS-110-10.R02, PS-110-10.R03 | update a golden string file; roll back | tests fail on unreviewed change; rollback restores previous strings without migration |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, F09.S03.M01, F09.S03.M03, F06.S02.M01, F15.S01.M01, CTR-UX-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
