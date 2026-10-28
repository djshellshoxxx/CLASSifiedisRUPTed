# TODO — F11.S02.M02 mod_dedup

**Status:** IMPLEMENTED — Persistent nonce store + ReplayGuard, duplicate registry, idempotent import, malicious-peer scenarios covered. Seen markers kept 30 days then purged by sweeper.

## Implemented
- [x] Batch authentication against pinned key, persistent nonce ReplayGuard, duplicate registry, idempotent import
- [x] Per-record rejection with reasons and reputation counters; purge sweeper

## Code and tests
- Code: `packages/federation/src/sync/dedup.ts`, `packages/federation/src/sync/inbound.ts`
- Tests: `packages/federation/test/sync.test.ts`

## Remaining
- [ ] Transitive forwarding of records from third relays
- [ ] Seen-marker compaction for very large deployments
