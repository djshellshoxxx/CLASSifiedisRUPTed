# F15.S01 — 01_pwa

**Status:** SPECIFIED. **Parent:** [F15](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F15.S01.M01 | [Offline outbox](mod_offline/SPEC.md) | SPECIFIED | IndexedDB command outbox, pending UI state, replay on reconnect, conflict prompts (CTR-IDM-001 IDM-5). |
| F15.S01.M02 | [PWA caching](mod_cache/SPEC.md) | SPECIFIED | Service worker: precache app shell, stale-while-revalidate public listing images, network-only for authenticated APIs, versioned cache cleanup. |
| F15.S01.M03 | [PWA install](mod_install/SPEC.md) | SPECIFIED | Web app manifest, install prompt UX, update-available flow (skipWaiting on user consent). |

## Aggregation

Modules in this subfeature share the feature package `packages/platform` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| privacy.deletion.completed | F10.S01.M04 | F15.S01.M01 | external |
