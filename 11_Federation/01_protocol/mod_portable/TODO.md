# TODO — F11.S01.M01 mod_portable

**Status:** IMPLEMENTED — Per-record opt-in with live consent, author-signed publish, relay countersign, tombstone withdrawal, own-record export, relay-signed labels. Clients must sign; relay never holds author keys.

## Implemented
- [x] Per-record federate opt-in guarded by consent port; withdrawal tombstones; unsent deliveries cancelled on opt-out
- [x] Author-signed publish with account key check, listing consistency check, relay countersignature, delivery queued for trusted peers
- [x] Own-record export, public record read, relay-signed moderation labels

## Code and tests
- Code: `packages/federation/src/protocol/portable.ts`
- Tests: `packages/federation/test/portable.test.ts`

## Remaining
- [ ] Bulk export/import file format for moving an account between relays
- [ ] Automatic re-publish when bazaar edits a listing (relay wiring)
