# PS-109-10 — Import, export, backup and rollback: Keyboard operability

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M01 Keyboard operability](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/keyboard` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-109-10.R01** The module stores no user data, so a user export contains nothing from it.
- **PS-109-10.R02** The only user preference that affects these primitives, the reduced-motion override, lives in F15.S04.M03 LocalSettings (optional field a11yMotion system | reduced) and travels with that module's vault export; the PWA shell reads LocalSettings and passes the value to the primitives as a parameter, so 05.R02 holds.
- **PS-109-10.R03** Token and primitive changes are versioned and rollback restores the previous release without migration.

## Specification

- **export:** No module data is exported; a11yMotion is part of the F15.S04.M03 LocalSettings vault export. MVP has no single-character shortcuts, so there is no shortcut setting.
- **import:** F15.S04.M03 validates an imported a11yMotion against system or reduced and falls back to system for any other value; the primitives only ever receive the validated value from the PWA shell.
- **backup:** Nothing to back up; tokens and primitives ship with the app bundle.
- **migration rollback:** Tokens are additive; rollback to the previous release restores previous tokens and primitives without data migration; an a11yMotion value unknown to an older release is ignored and prefers-reduced-motion applies.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-109-09.T15 | unit | PS-109-10.R03 | upgrade token file from v1 to v1.1 and roll back | components render with defaults; no consumer breaks |
| TEST-PS-109-09.T20 | integration | PS-109-10.R01, PS-109-10.R02 | vault export and import round trip through F15.S04.M03 with a11yMotion reduced, then with an invalid value | export holds nothing from this module; reduced survives and the shell passes it to setMotionPreference; invalid value falls back to system |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
