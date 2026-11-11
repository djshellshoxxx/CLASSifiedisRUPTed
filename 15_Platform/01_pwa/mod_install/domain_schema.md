# PS-115-01 — Domain schema: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-01.R01** The module owns no persisted entity; install state, local session and action counters, dismissal counters, the last session in which the card was shown, update deferral and the unverified-build flag are per-device preferences stored in localStorage under the key classrup.install.v1.
- **PS-115-01.R02** The manifest is a build artifact validated against fixed field rules; its id is stable forever so reinstalls keep the same app identity.
- **PS-115-01.R03** Preferences contain no personal data and are safe to lose; the module renders correctly when storage is unavailable.

## Specification

**Note:** Configuration and UI module: no domain entities. Device preferences classrup.install.v1 { version: 1, sessions:int (incremented once per app start), completedActions:int (incremented on each committed vault command reported by the shell), dismissals:int, lastDismissedAt?:timestamp, lastShownSession?:int, deferredUntil?:timestamp, installedAt?:timestamp, unverifiedBuildId?:string, releaseHold?: { envelope, releaseKeyId, heldBuildIds, reason, issuedAt, expiresAt } } live in localStorage, are P0, and are not part of the vault export. Release manifest /release-manifest.json { buildId, releaseSeq, files: { path: sha256 }, sig } is a build artifact; the release hold /release-hold.json is a classrup.security.envelope/v1 of context classrup/release-hold/v1 (F16.S02.M03) with payload { releaseKeyId, heldBuildIds, reason, issuedAt, expiresAt }; an empty heldBuildIds holds every update.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T01 | unit | PS-115-01.R02, PS-115-02.R01 | manifest validated with each defect (missing 512 icon, long short_name, start_url outside scope, 5 shortcuts) | each defect fails with PLATFORM_INSTALL_MANIFEST_INVALID; the valid manifest passes |
| TEST-PS-115-09.T02 | unit | PS-115-01.R03, PS-115-02.R02, PS-115-07.R03 | install gate with sessions 1 and 2, completedActions 0 and 1, dismissals 0 to 3, lastDismissedAt 10 d and 31 d, card already shown this session, storage unavailable | card shown only when all V04 conditions hold; otherwise PLATFORM_INSTALL_NOT_ELIGIBLE; no exception without storage |
| TEST-PS-115-09.T09 | e2e | PS-115-06.R03, PS-115-01.R03 | open the installed app offline with localStorage blocked | app starts, card hidden, no exception, update check fails silently |
| TEST-PS-115-09.T16 | unit | PS-115-01.R01, PS-115-08.R01 | three app starts and two committed vault commands, then open diagnostics while recording network | sessions 3 and completedActions 2 stored in classrup.install.v1 and shown in diagnostics; zero network requests |

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, F16.S02.M03, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [module SPEC](SPEC.md).
