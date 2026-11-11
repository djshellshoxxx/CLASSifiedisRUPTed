# PS-115-09 — Contract and acceptance tests: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-115-09.R02** Manifest and gating logic are unit tested; the install and update flows are tested end to end in Chromium, WebKit and Firefox where each supports them.
- **PS-115-09.R03** A Lighthouse installability check runs in CI on the built app.

## Specification

See the module test table below (all processes).

**Fixtures:** Built PWA builds A and B (B signed by the test release key) and B' (unsigned) served by a static server; Playwright with beforeinstallprompt and user-activation simulation; localStorage seeded with counters; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T01 | unit | PS-115-01.R02, PS-115-02.R01 | manifest validated with each defect (missing 512 icon, long short_name, start_url outside scope, 5 shortcuts) | each defect fails with PLATFORM_INSTALL_MANIFEST_INVALID; the valid manifest passes |
| TEST-PS-115-09.T02 | unit | PS-115-01.R03, PS-115-02.R02, PS-115-07.R03 | install gate with sessions 1 and 2, completedActions 0 and 1, dismissals 0 to 3, lastDismissedAt 10 d and 31 d, card already shown this session, storage unavailable | card shown only when all V04 conditions hold; otherwise PLATFORM_INSTALL_NOT_ELIGIBLE; no exception without storage |
| TEST-PS-115-09.T03 | property | PS-115-03.R01, PS-115-03.R03 | random sequences of waiting-worker, verification results, Later, Update now and timer events | only declared transitions occur; deferral always 24 h |
| TEST-PS-115-09.T04 | e2e | PS-115-03.R02, PS-115-02.R03, PS-115-06.R01 | signed build B deployed while A is open with an unsaved draft | banner appears; Update now saves the draft first then activates; reload shows B with draft restored; no update without a click |
| TEST-PS-115-09.T05 | e2e | PS-115-03.R02, PS-115-06.R02 | activation does not complete within 10 s (simulated) | state returns to update_available with explanation; A still works |
| TEST-PS-115-09.T06 | unit | PS-115-04.R01, PS-115-04.R03 | getInstallState across installed, installable, ios and unsupported platforms | returns the documented shape and performs no network call |
| TEST-PS-115-09.T07 | abuse | PS-115-04.R02, PS-115-07.R01 | record all network requests during install and update flows | only same-origin static GETs (including /release-manifest.json); no analytics or relay requests |
| TEST-PS-115-09.T08 | abuse | PS-115-05.R01, PS-115-05.R02, PS-115-05.R03, PS-115-02.R04 | applyUpdate() called from a timer without user activation; a script posts SKIP_WAITING without a nonce and with a stale nonce; a foreign origin messages the worker | applyUpdate refuses with FORBIDDEN; the worker ignores every message without a valid nonce; version unchanged |
| TEST-PS-115-09.T09 | e2e | PS-115-06.R03, PS-115-01.R03 | open the installed app offline with localStorage blocked | app starts, card hidden, no exception, update check fails silently |
| TEST-PS-115-09.T10 | e2e | PS-115-07.R02 | install on a browser that grants and one that denies persist(), with the last export 8 days old | explanation text shown in both; on denial F15.S01.M01 get_status reports exportOverdueThresholdDays 7 and exportOverdue true and the reminder is shown; on grant the threshold is 30 and no reminder |
| TEST-PS-115-09.T11 | a11y | PS-115-08.R02 | install card, iOS sheet, update banner and unverified-build warning scanned with axe | zero serious issues; targets ≥ 44 px; CLS contribution 0 |
| TEST-PS-115-09.T12 | load | PS-115-08.R01, PS-115-08.R03 | Lighthouse CI installability and bundle check | installable, module ≤ 6 KiB gzip, LCP ≤ 2.5 s, INP ≤ 200 ms |
| TEST-PS-115-09.T13 | unit | PS-115-09.R01 | traceability tool run | every PS-115 requirement maps to a passing test |
| TEST-PS-115-09.T14 | e2e | PS-115-09.R02, PS-115-09.R03 | full flow suite on Chromium, WebKit, Firefox | passes on each engine for the flows each supports; Lighthouse installable |
| TEST-PS-115-09.T15 | integration | PS-115-10.R01, PS-115-10.R03 | roll back to build A and reset app settings | A installs and runs, preferences cleared on reset, vault untouched, export bundle contains no install state |
| TEST-PS-115-09.T16 | unit | PS-115-01.R01, PS-115-08.R01 | three app starts and two committed vault commands, then open diagnostics while recording network | sessions 3 and completedActions 2 stored in classrup.install.v1 and shown in diagnostics; zero network requests |
| TEST-PS-115-09.T17 | e2e | PS-115-10.R02 | install, create a vault, uninstall the app (site data kept) and reinstall on the same origin; then clear site data | after reinstall the IndexedDB vault marker of F15.S01.M01 is present and the vault opens; after clearing site data the data-loss warning appears |
| TEST-PS-115-09.T18 | e2e | PS-115-02.R02, PS-115-07.R03 | eligible user starts one session and navigates through 10 screens, dismissing nothing | install card shown exactly once in the session; shown again only in a later session |
| TEST-PS-115-09.T19 | abuse | PS-115-02.R04, PS-115-03.R02, PS-115-03.R04, PS-115-05.R03 | unsigned build B' deployed while A is open; then all tabs closed and the app reopened | no Update button, warning shown with PLATFORM_UPDATE_UNVERIFIED in diagnostics; after the cold start B' runs (browser behavior) and the warning is shown again from unverifiedBuildId |

## Acceptance criteria

- All tests T01-T19 pass in CI.
- The built app is installable (Lighthouse) and starts offline after install with the vault intact.
- A new version never replaces the running one in a live tab without a user gesture and never loses a draft, and an unsigned build is never offered for update.
- No network request other than same-origin static assets occurs during install and update flows.

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
