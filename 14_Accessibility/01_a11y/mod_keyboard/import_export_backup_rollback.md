# PS-109-10 — Import, export, backup and rollback: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-10.R01** The module stores no user data, so a user export contains nothing from it.
- **PS-109-10.R02** User preferences that affect keyboard behaviour (for example shortcuts off, reduced motion override) live in vault settings and travel with the vault export of F10.
- **PS-109-10.R03** Token and primitive changes are versioned and rollback restores the previous release without migration.

## Specification

- **export:** No module data is exported; the settings keys a11y.shortcuts and a11y.motion are part of the vault settings export owned by F10.
- **import:** Imported settings are validated against the allowed values (shortcuts on or off, motion system or reduced); unknown keys are ignored.
- **backup:** Nothing to back up; tokens and primitives ship with the app bundle.
- **migration rollback:** Tokens are additive; rollback to the previous release restores previous tokens and primitives without data migration.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T14 | manual | PS-109-09.R02, PS-109-10.R01 | 20-minute keyboard and screen reader session on a physical Pixel 7 and iPhone 14 | checklist 2.4.11, 2.5.7, 2.5.8 completed with no blockers |
| TEST-PS-109-09.T15 | unit | PS-109-10.R02, PS-109-10.R03 | upgrade token file from v1 to v1.1 and roll back | components render with defaults; no consumer breaks |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
