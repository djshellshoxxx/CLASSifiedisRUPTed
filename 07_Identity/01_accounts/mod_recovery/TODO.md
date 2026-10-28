# TODO: F07.S01.M03 recovery

**Status:** IMPLEMENTED

## Implemented
- [x] Ten recovery codes at registration or via signed re-issue; shown once (src/accounts/recovery.ts)
- [x] Recovery consumes a code, revokes all old device keys and sessions, emits event, notifies via NotifyPort
- [x] Rate limit consumed before the transaction so failures count
- [x] Device add/revoke authorized by an active key signature bound to keyEpoch; last device cannot be revoked (src/accounts/devices.ts)

## Remaining
- [ ] Social or guardian recovery (out of scope).
- [ ] Process specifications in this directory are still placeholders; requirements were taken from PROJECT_SPEC.md and docs/adr.
