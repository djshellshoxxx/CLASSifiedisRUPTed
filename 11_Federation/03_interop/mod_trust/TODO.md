# TODO — F11.S03.M01 mod_trust

**Status:** IMPLEMENTED — Pending/trusted/suspended/blocked, pinned key with reset-on-rotate, per-minute record limit, daily byte quota, reputation counters, auto-suspend after 25 consecutive rejections.

## Implemented
- [x] Peer registry with transition table and key pinning (rotation resets to pending)
- [x] Per-minute record limit, daily byte quota, reputation counters, auto-suspend after 25 consecutive rejections

## Code and tests
- Code: `packages/federation/src/interop/trust.ts`
- Tests: `packages/federation/test/interop.test.ts`, `packages/federation/test/sync.test.ts`

## Remaining
- [ ] Peer discovery / well-known document
- [ ] Reputation decay over time
