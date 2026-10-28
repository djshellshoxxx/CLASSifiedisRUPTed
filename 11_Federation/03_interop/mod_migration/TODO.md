# TODO — F11.S03.M03 mod_migration

**Status:** PARTIAL — Dual-signed statements, successor keys, redirect tombstones on old relay, learned by peers from them. Rotation statements for other relays enter only via operator submit; no destination-side import.

## Implemented
- [x] Dual-signed migration statements verified; successor-key chain with cycle guard
- [x] Redirect tombstones on the old relay queued for peers; peers learn successors from them; same-relay rotation
- [x] Public resolve query

## Code and tests
- Code: `packages/federation/src/interop/migration.ts`
- Tests: `packages/federation/test/interop.test.ts`, `packages/federation/test/sync.test.ts`

## Remaining
- [ ] Destination-relay import of the exported records after migration
- [ ] Propagating same-relay key rotations to peers (operators currently submit them)
