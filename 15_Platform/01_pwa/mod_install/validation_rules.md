# PS-115-02 — Validation rules: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-02.R01** The build fails if the manifest violates installability rules, so a broken app is never published.
- **PS-115-02.R02** The install prompt is shown only when its gating rules hold, so it never interrupts first-time use.
- **PS-115-02.R03** Update activation is allowed only at a safe point.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | manifest has id '/', name ≤ 45 chars, short_name ≤ 12 chars, start_url inside scope, display standalone | PLATFORM_INSTALL_MANIFEST_INVALID |
| V02 | icons include 192x192 and 512x512 PNG plus a 512x512 maskable icon, each ≤ 100 KiB | PLATFORM_INSTALL_MANIFEST_INVALID |
| V03 | shortcuts ≤ 4, each with name, url inside scope and icon | PLATFORM_INSTALL_MANIFEST_INVALID |
| V04 | install card gate: session count ≥ 2 and at least 1 completed action, not installed, dismissals < 3 and lastDismissedAt older than 30 days | PLATFORM_INSTALL_NOT_ELIGIBLE |
| V05 | update activation requires no unsaved draft, outbox entry in sending absent or finished within 10 s | PLATFORM_UPDATE_NOT_SAFE |
| V06 | SKIP_WAITING is sent only after an explicit user action in the same session | FORBIDDEN |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T01 | unit | PS-115-01.R01, PS-115-01.R02, PS-115-02.R01 | manifest validated with each defect (missing 512 icon, long short_name, start_url outside scope, 5 shortcuts) | each defect fails with PLATFORM_INSTALL_MANIFEST_INVALID; the valid manifest passes |
| TEST-PS-115-09.T02 | unit | PS-115-01.R03, PS-115-02.R02 | install gate with sessions 1 and 2, actions 0 and 1, dismissals 0 to 3, lastDismissedAt 10 d and 31 d | card shown only when all V04 conditions hold; otherwise PLATFORM_INSTALL_NOT_ELIGIBLE |
| TEST-PS-115-09.T04 | e2e | PS-115-03.R02, PS-115-02.R03, PS-115-06.R01 | build B deployed while A is open with an unsaved draft | banner appears; Update now saves the draft first then activates; reload shows B with draft restored; no update without a click |

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
