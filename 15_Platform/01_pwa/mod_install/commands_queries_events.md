# PS-115-04 — Commands, queries and events: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-04.R01** The module has no vault commands, relay commands, queries or events; its interface is UI components, the manifest and a small local API (install(), applyUpdate(), getInstallState()).
- **PS-115-04.R02** Nothing in the module calls a relay or any network origin other than the app's own static files, including the waiting build's /release-manifest.json.
- **PS-115-04.R03** Local state is exposed to other modules only through getInstallState(), a pure read.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_INSTALL_MANIFEST_INVALID | 422 | no | build-time failure, manifest violates installability rules |
| PLATFORM_INSTALL_NOT_ELIGIBLE | 409 | no | install card gating rules not satisfied |
| PLATFORM_UPDATE_NOT_SAFE | 409 | yes | unsaved draft or sending outbox entry blocks activation; retry after saving |
| PLATFORM_UPDATE_UNVERIFIED | 422 | no | the waiting build's release manifest is missing or not signed by the pinned release key; update not offered |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** UI and build module: no vault commands, statements or relay commands. Local API: install() calls the deferred beforeinstallprompt; applyUpdate() refuses unless navigator.userActivation.isActive, runs the V05 and V07 checks, gets the nonce through GET_VERSION from the waiting worker and posts SKIP_WAITING { nonce } (F15.S01.M02); getInstallState() returns { installed, installable, platform, updateAvailable, updateVerified, buildId, releaseSeq }.

### Example

```
manifest.webmanifest
{ "id": "/", "name": "ClassRup", "short_name": "ClassRup", "start_url": "/?source=pwa", "scope": "/",
  "display": "standalone", "theme_color": "#0b5d5b", "background_color": "#ffffff", "lang": "en",
  "icons": [ {"src":"/icons/192.png","sizes":"192x192","type":"image/png"}, {"src":"/icons/512.png","sizes":"512x512","type":"image/png"},
             {"src":"/icons/maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"} ],
  "shortcuts": [ {"name":"New listing","url":"/new"}, {"name":"My trades","url":"/trades"} ] }
update: waiting worker -> /release-manifest.json verified (V07) -> banner 'A new version is ready' -> user taps Update now (userActivation.isActive)
  -> draft saved -> GET_VERSION -> { nonce } -> SKIP_WAITING { nonce } -> controllerchange -> reload
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T06 | unit | PS-115-04.R01, PS-115-04.R03 | getInstallState across installed, installable, ios and unsupported platforms | returns the documented shape and performs no network call |
| TEST-PS-115-09.T07 | abuse | PS-115-04.R02, PS-115-07.R01 | record all network requests during install and update flows | only same-origin static GETs (including /release-manifest.json); no analytics or relay requests |

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
