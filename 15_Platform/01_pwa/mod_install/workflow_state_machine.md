# PS-115-03 — Workflow state machine: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-03.R01** Install and update each follow explicit states and the UI shows only the state reached.
- **PS-115-03.R02** While a client of the running build is open, a waiting worker is activated only after consent with a live user gesture, never by automatic skipWaiting; once every client is closed the browser activates a waiting worker at the next cold start, so consent covers live tabs only and the spec does not claim more.
- **PS-115-03.R03** Deferral is time-boxed so the user is asked again after 24 hours but never forced.
- **PS-115-03.R04** A waiting build whose release manifest fails V07 is never offered for update; the unverified-build warning is shown and persisted so that the next start, if the browser activated that build anyway, still shows the warning.
- **PS-115-03.R05** While a valid release hold covers the waiting build (V08) the attempt is held - Update is hidden, the paused notice names the reason and expiresAt, consent cannot override it, and the hold ends only at expiresAt - and, as with an unverified build, the browser may still activate the waiting build at a cold start once every client is closed, which the notice tells the user to avoid.

## Specification

### UpdateAttempt lifecycle

Initial **update_available**; terminal **activated**, **superseded**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| update_available -> updating | user taps Update now with a live gesture, V05, V06, V07 and V08 pass (the hold is re-read just before activation) | draft saved, nonce fetched through GET_VERSION, SKIP_WAITING posted |
| update_available -> held | a valid release hold covers the waiting build (V08) | Update hidden, updates paused notice shown with reason and expiresAt, releaseHold persisted in classrup.install.v1 |
| deferred -> held | a valid release hold covering the waiting build is found at a check | paused notice replaces the deferral |
| held -> update_available | now reaches the hold's expiresAt and no other valid hold covers the build | V07 re-checked; banner shown again; releaseHold cleared |
| held -> superseded | a newer waiting worker replaces the held one | V07 and V08 checked again for the newer build |
| held -> activated | every client closed and the browser activated the waiting build at a cold start | not preventable by consent; the next start shows the paused notice from the stored releaseHold while it is valid |
| update_available -> deferred | user taps Later | deferredUntil = now + 86400000 ms |
| update_available -> unverified | the waiting build's release manifest fails V07 | Update hidden, unverified-build warning shown, unverifiedBuildId persisted |
| deferred -> update_available | deferredUntil reached or app restarted | banner shown again after V07 is re-checked |
| updating -> activated | controllerchange received | page reloaded once |
| updating -> update_available | V05 fails or activation does not complete within 10000 ms | message states why and offers retry |
| update_available -> superseded | a newer waiting worker replaces this one | banner now refers to the newer build |
| deferred -> superseded | a newer waiting worker replaces this one | banner now refers to the newer build |
| unverified -> superseded | a newer waiting worker replaces the unverified one | V07 checked again for the newer build |
| unverified -> activated | every client closed and the browser activated the waiting build at a cold start | not preventable by consent; the next start shows the unverified-build warning from unverifiedBuildId |

```mermaid
stateDiagram-v2
  [*] --> update_available
  update_available --> updating: user taps Update now with a live gesture, V05, V06, V07 and V08 pass (the hold is re-read just before activation)
  update_available --> held: a valid release hold covers the waiting build (V08)
  deferred --> held: a valid release hold covering the waiting build is found at a check
  held --> update_available: now reaches the hold's expiresAt and no other valid hold covers the build
  held --> superseded: a newer waiting worker replaces the held one
  held --> activated: every client closed and the browser activated the waiting build at a cold start
  update_available --> deferred: user taps Later
  update_available --> unverified: the waiting build's release manifest fails V07
  deferred --> update_available: deferredUntil reached or app restarted
  updating --> activated: controllerchange received
  updating --> update_available: V05 fails or activation does not complete within 10000 ms
  update_available --> superseded: a newer waiting worker replaces this one
  deferred --> superseded: a newer waiting worker replaces this one
  unverified --> superseded: a newer waiting worker replaces the unverified one
  unverified --> activated: every client closed and the browser activated the waiting build at a cold start
  activated --> [*]
  superseded --> [*]
```

### Timeouts and scheduled transitions

- Update check on app start, on visibilitychange to visible and every 3600000 ms; /release-hold.json is fetched with every update check and again immediately before activation.
- A stored release hold is kept until its expiresAt and then removed; it is never extended beyond the signed expiresAt.
- Deferral lasts 86400000 ms; install card back-off 2592000000 ms (30 days).
- Activation wait after SKIP_WAITING is 10000 ms; the nonce is valid for 60000 ms.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T03 | property | PS-115-03.R01, PS-115-03.R03 | random sequences of waiting-worker, verification results, Later, Update now and timer events | only declared transitions occur; deferral always 24 h |
| TEST-PS-115-09.T04 | e2e | PS-115-03.R02, PS-115-02.R03, PS-115-06.R01 | signed build B deployed while A is open with an unsaved draft | banner appears; Update now saves the draft first then activates; reload shows B with draft restored; no update without a click |
| TEST-PS-115-09.T05 | e2e | PS-115-03.R02, PS-115-06.R02 | activation does not complete within 10 s (simulated) | state returns to update_available with explanation; A still works |
| TEST-PS-115-09.T19 | abuse | PS-115-02.R04, PS-115-03.R02, PS-115-03.R04, PS-115-05.R03 | unsigned build B' deployed while A is open; then all tabs closed and the app reopened | no Update button, warning shown with PLATFORM_UPDATE_UNVERIFIED in diagnostics; after the cold start B' runs (browser behavior) and the warning is shown again from unverifiedBuildId |
| TEST-PS-115-09.T20 | e2e | PS-115-02.R05, PS-115-03.R05 | signed build B waiting while A is open; hold for [B] published; the host then deletes /release-hold.json; the clock passes expiresAt; separately a hold with empty heldBuildIds and a hold signed by another key | Update hidden and paused notice shown with reason and expiry; applyUpdate refuses with PLATFORM_UPDATE_HELD; the stored hold still applies after deletion; after expiresAt the banner returns; the empty list holds B; the forged hold is ignored and counted as hold_rejected |
| TEST-PS-115-09.T21 | property | PS-115-03.R05, PS-115-03.R01 | random sequences of waiting builds, holds (valid, expired, forged, covering or not), deferrals and Update now taps | activation never happens through applyUpdate while a valid covering hold exists; held always returns to update_available exactly at expiresAt or is superseded; only declared transitions occur |

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, F16.S02.M03, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
