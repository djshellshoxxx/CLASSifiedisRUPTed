# TODO — F11.S02.M01 mod_delivery

**Status:** IMPLEMENTED — Per-peer outbox, 100-record batches, exponential backoff + injected jitter, dead letter after 8, requeue, status. Transport is a port (default always retry); real HTTP lives in the relay.

## Implemented
- [x] Per-peer outbox, batches <= 100 records, exponential backoff with injected jitter, dead letter after 8 attempts
- [x] Operator requeue and status; system sweeper federation.delivery.send_due

## Code and tests
- Code: `packages/federation/src/sync/delivery.ts`, `packages/federation/src/sync/outbox.ts`
- Tests: `packages/federation/test/sync.test.ts`

## Remaining
- [ ] HTTP transport adapter and scheduler (relay app)
- [ ] Backpressure signals from peers
