# PS-115-01 — Domain schema: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-01.R01** The module owns no persisted entity; install state, dismissal counters and update deferral are per-device preferences stored in localStorage under the key classrup.install.v1.
- **PS-115-01.R02** The manifest is a build artifact validated against fixed field rules; its id is stable forever so reinstalls keep the same app identity.
- **PS-115-01.R03** Preferences contain no personal data and are safe to lose; the module renders correctly when storage is unavailable.

## Specification

**Note:** Configuration and UI module: no domain entities. Device preferences classrup.install.v1 { dismissals:int, lastDismissedAt:timestamp, deferredUntil:timestamp, installedAt?:timestamp } live in localStorage, are P0, and are not part of the vault export.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T01 | unit | PS-115-01.R01, PS-115-01.R02, PS-115-02.R01 | manifest validated with each defect (missing 512 icon, long short_name, start_url outside scope, 5 shortcuts) | each defect fails with PLATFORM_INSTALL_MANIFEST_INVALID; the valid manifest passes |
| TEST-PS-115-09.T02 | unit | PS-115-01.R03, PS-115-02.R02 | install gate with sessions 1 and 2, actions 0 and 1, dismissals 0 to 3, lastDismissedAt 10 d and 31 d | card shown only when all V04 conditions hold; otherwise PLATFORM_INSTALL_NOT_ELIGIBLE |
| TEST-PS-115-09.T09 | e2e | PS-115-06.R03, PS-115-01.R03 | open the installed app offline with localStorage blocked | app starts, card hidden, no exception, update check fails silently |

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [module SPEC](SPEC.md).
