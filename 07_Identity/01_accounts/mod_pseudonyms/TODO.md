# TODO: F07.S01.M01 pseudonyms

**Status:** IMPLEMENTED

## Implemented
- [x] Register with NFKC/case-folded unique pseudonym, reserved words, mixed-script guard (src/accounts/naming.ts, test/accounts.test.ts)
- [x] Device Ed25519 + X25519 keys with proof of possession (src/accounts/devices.ts)
- [x] Status table active/suspended/deactivated/deleted with assertTransition; suspension revokes sessions (src/accounts/pseudonyms.ts)
- [x] Admin/system role grants, self-lockout guard, expectedVersion
- [x] AccountLookup port implementation (accountLookup), erase and exportData hooks for F10

## Remaining
- [ ] Rename pseudonym flow (not required by brief).
- [ ] Cross-account device key uniqueness (needs an index collection).
- [ ] Process specifications in this directory are still placeholders; requirements were taken from PROJECT_SPEC.md and docs/adr.
