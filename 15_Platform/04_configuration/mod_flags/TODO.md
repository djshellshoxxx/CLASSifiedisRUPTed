# TODO: F15.S04.M02 flags

**Status:** IMPLEMENTED; catalog reconciliation pending.

## Implemented
- [x] `FlagService` (kernel `FeatureFlags`): dependencies, cycle detection, tenant overrides, static and runtime kill switches, cached decisions (`packages/platform/src/config/flags.ts`; `packages/platform/test/config.test.ts`)
- [x] `DEFAULT_FLAGS` catalog, federation off by default (`packages/platform/src/config/catalog.ts`)
- [x] Audited ops set/clear override, set_kill, list (`packages/platform/src/config/operations.ts`)

## Remaining
- [ ] Reconcile flag names used by other packages with the catalog (unknown flags evaluate to off)
- [ ] Cross-process cache invalidation if the relay runs more than one process

Package overview: `packages/platform/README.md`. Traceability: `packages/platform/traceability.json`.
