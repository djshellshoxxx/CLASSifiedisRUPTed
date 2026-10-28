# TODO: F15.S01.M03 install

**Status:** IMPLEMENTED (pure logic); PWA wiring pending.

## Implemented
- [x] Manifest builder and validator: short_name <= 12, 192/512 + maskable icons, standalone, scope/start_url, colors, lang/dir (`packages/platform/src/pwa/install.ts`; `packages/platform/test/pwa.test.ts`)
- [x] Install-prompt state machine unsupported/available/prompted/accepted/dismissed with 14 day cooldown (same files)
- [x] Public op `platform.pwa.manifest` builds a tenant-aware manifest (`packages/platform/src/pwa/operations.ts`)

## Remaining
- [ ] Real icon assets in `apps/pwa/public`
- [ ] Persisting `InstallState` and hooking `beforeinstallprompt`/`appinstalled` in the PWA

Package overview: `packages/platform/README.md`. Traceability: `packages/platform/traceability.json`.
