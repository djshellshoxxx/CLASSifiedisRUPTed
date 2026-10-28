# TODO: F15.S01.M02 cache

**Status:** IMPLEMENTED (pure policy); service worker pending.

## Implemented
- [x] Rule table and `resolveCachePolicy`: strategies, private API and credentialed requests network-only, deny by default (`packages/platform/src/pwa/cache.ts`; `packages/platform/test/pwa.test.ts`)
- [x] `isCacheableResponse`: no-store/private/Set-Cookie/Vary:*/opaque refused (same files)
- [x] Versioned cache names, `cachesToPurge` for activation and logout (same files)
- [x] Public ops `platform.pwa.cache_policy` serves rules and cache names (`packages/platform/src/pwa/operations.ts`)

## Remaining
- [ ] Service worker in `apps/pwa` that applies the policy (not built yet)
- [ ] Cache size/entry limits and eviction

Package overview: `packages/platform/README.md`. Traceability: `packages/platform/traceability.json`.
