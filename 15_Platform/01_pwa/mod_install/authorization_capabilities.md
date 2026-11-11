# PS-115-05 — Authorization and capabilities: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-05.R01** The module performs only local UI actions by the person holding the device and defines no relay capabilities.
- **PS-115-05.R02** Installing or updating changes code, never vault data, and requires an explicit user gesture checked in the page.
- **PS-115-05.R03** No relay or remote party can trigger install or update; the update source is only the app's own origin, which the user chose by opening it, and an update is offered only when signed by the pinned release key; a compromised origin can still run its code at the next cold start, which the warning and published checksums expose.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T08 | abuse | PS-115-05.R01, PS-115-05.R02, PS-115-05.R03, PS-115-02.R04 | applyUpdate() called from a timer without user activation; a script posts SKIP_WAITING without a nonce and with a stale nonce; a foreign origin messages the worker | applyUpdate refuses with FORBIDDEN; the worker ignores every message without a valid nonce; version unchanged |
| TEST-PS-115-09.T19 | abuse | PS-115-02.R04, PS-115-03.R02, PS-115-03.R04, PS-115-05.R03 | unsigned build B' deployed while A is open; then all tabs closed and the app reopened | no Update button, warning shown with PLATFORM_UPDATE_UNVERIFIED in diagnostics; after the cold start B' runs (browser behavior) and the warning is shown again from unverifiedBuildId |

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
