# TODO — F11.S03.M02 mod_blocklists

**Status:** IMPLEMENTED — Peer/domain(+subdomains)/author-key lists, signed export, import from trusted pinned peers into review queue only. Records from blocked sources rejected with reason.

## Implemented
- [x] Peer, domain (with subdomains) and author-key entries; revoke
- [x] Signed export; import from trusted pinned peers into review queue; approval required

## Code and tests
- Code: `packages/federation/src/interop/blocklists.ts`
- Tests: `packages/federation/test/interop.test.ts`, `packages/federation/test/sync.test.ts`

## Remaining
- [ ] Scheduled automatic import with diff alerts
