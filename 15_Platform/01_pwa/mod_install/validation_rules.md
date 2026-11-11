# PS-115-02 — Validation rules: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-02.R01** The build fails if the manifest violates installability rules, so a broken app is never published.
- **PS-115-02.R02** The install prompt is shown only when its gating rules hold, so it never interrupts first-time use and appears at most once per session.
- **PS-115-02.R03** Update activation is allowed only at a safe point.
- **PS-115-02.R04** An update is offered only for a waiting build whose signed release manifest verifies under the release key pinned in the running build, and activation requires a live user gesture checked in the page (navigator.userActivation.isActive) plus the waiting worker's one-time nonce.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | manifest has id '/', name ≤ 45 chars, short_name ≤ 12 chars, start_url inside scope, display standalone | PLATFORM_INSTALL_MANIFEST_INVALID |
| V02 | icons include 192x192 and 512x512 PNG plus a 512x512 maskable icon, each ≤ 100 KiB | PLATFORM_INSTALL_MANIFEST_INVALID |
| V03 | shortcuts ≤ 4, each with name, url inside scope and icon | PLATFORM_INSTALL_MANIFEST_INVALID |
| V04 | install card gate: sessions ≥ 2 and completedActions ≥ 1 in classrup.install.v1, not installed, dismissals < 3, lastDismissedAt absent or older than 30 days, and lastShownSession differs from the current session | PLATFORM_INSTALL_NOT_ELIGIBLE |
| V05 | update activation requires no unsaved draft, outbox entry in sending absent or finished within 10 s | PLATFORM_UPDATE_NOT_SAFE |
| V06 | applyUpdate() proceeds only while navigator.userActivation.isActive is true in the page, and the SKIP_WAITING it posts carries the nonce the waiting worker issued through GET_VERSION (F15.S01.M02 V07) | FORBIDDEN |
| V07 | the waiting build's /release-manifest.json has an Ed25519 signature under context classrup-release:v1 by the release key pinned in the running build (or by a successor key endorsed by it), its buildId equals the waiting worker's GET_VERSION buildId and its releaseSeq is greater than the running build's | PLATFORM_UPDATE_UNVERIFIED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T01 | unit | PS-115-01.R02, PS-115-02.R01 | manifest validated with each defect (missing 512 icon, long short_name, start_url outside scope, 5 shortcuts) | each defect fails with PLATFORM_INSTALL_MANIFEST_INVALID; the valid manifest passes |
| TEST-PS-115-09.T02 | unit | PS-115-01.R03, PS-115-02.R02, PS-115-07.R03 | install gate with sessions 1 and 2, completedActions 0 and 1, dismissals 0 to 3, lastDismissedAt 10 d and 31 d, card already shown this session, storage unavailable | card shown only when all V04 conditions hold; otherwise PLATFORM_INSTALL_NOT_ELIGIBLE; no exception without storage |
| TEST-PS-115-09.T04 | e2e | PS-115-03.R02, PS-115-02.R03, PS-115-06.R01 | signed build B deployed while A is open with an unsaved draft | banner appears; Update now saves the draft first then activates; reload shows B with draft restored; no update without a click |
| TEST-PS-115-09.T08 | abuse | PS-115-05.R01, PS-115-05.R02, PS-115-05.R03, PS-115-02.R04 | applyUpdate() called from a timer without user activation; a script posts SKIP_WAITING without a nonce and with a stale nonce; a foreign origin messages the worker | applyUpdate refuses with FORBIDDEN; the worker ignores every message without a valid nonce; version unchanged |
| TEST-PS-115-09.T18 | e2e | PS-115-02.R02, PS-115-07.R03 | eligible user starts one session and navigates through 10 screens, dismissing nothing | install card shown exactly once in the session; shown again only in a later session |
| TEST-PS-115-09.T19 | abuse | PS-115-02.R04, PS-115-03.R02, PS-115-03.R04, PS-115-05.R03 | unsigned build B' deployed while A is open; then all tabs closed and the app reopened | no Update button, warning shown with PLATFORM_UPDATE_UNVERIFIED in diagnostics; after the cold start B' runs (browser behavior) and the warning is shown again from unverifiedBuildId |

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
