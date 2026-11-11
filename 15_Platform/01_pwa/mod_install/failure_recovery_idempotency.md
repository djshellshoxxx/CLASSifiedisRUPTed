# PS-115-06 — Failure recovery and idempotency: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-06.R01** Repeated install() or applyUpdate() calls are safe and have the effect of one call.
- **PS-115-06.R02** A failed activation leaves the previous version running and the banner available.
- **PS-115-06.R03** Everything works with no connectivity; update checks simply fail silently and retry at the next trigger.

## Specification

- **idempotency:** install() uses the single deferred prompt event and clears it after use; applyUpdate() posts SKIP_WAITING at most once per waiting worker because each nonce works once. Preferences writes are last-value.
- **concurrency:** Several tabs use BroadcastChannel classrup-install to share dismissal, update and unverified-build state; the first tab to accept performs the update and others show the updated-elsewhere state.
- **retries:** Update checks retry at the next trigger (hourly, foreground); there is no tight retry loop. A stuck activation after 10 s returns to update_available.
- **offline:** Install card and update banner logic work offline; an update is only detected when the static host is reachable. The installed app never needs the network to start, except once after a kill-switch unregistration of F15.S01.M02 without a known-good build.
- **partial failure:** If the reload after controllerchange is interrupted, the next start runs the new worker with the new shell; state in the vault is not affected. If the manifest is cached stale, the browser refreshes it on its own schedule and no data is lost. If the release manifest cannot be fetched, the update is treated as unverified, not as verified.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T04 | e2e | PS-115-03.R02, PS-115-02.R03, PS-115-06.R01 | signed build B deployed while A is open with an unsaved draft | banner appears; Update now saves the draft first then activates; reload shows B with draft restored; no update without a click |
| TEST-PS-115-09.T05 | e2e | PS-115-03.R02, PS-115-06.R02 | activation does not complete within 10 s (simulated) | state returns to update_available with explanation; A still works |
| TEST-PS-115-09.T09 | e2e | PS-115-06.R03, PS-115-01.R03 | open the installed app offline with localStorage blocked | app starts, card hidden, no exception, update check fails silently |

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
