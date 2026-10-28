# TODO: F15.S01.M01 offline

**Status:** IMPLEMENTED (library); PWA wiring pending.

## Implemented
- [x] OfflineQueue: enqueue, per-aggregate FIFO, one in-flight item per aggregate (`packages/platform/src/pwa/offline.ts`; `packages/platform/test/pwa.test.ts`)
- [x] Stable idempotency keys across retries, collapse of repeated actions by caller key (same files)
- [x] Exponential backoff with full jitter, 8 attempts, `retryAfterMs` honoured (same files)
- [x] ErrorBody category classification: conflict surfaced and blocking, unauthenticated pauses, permanent failures stop (same files)
- [x] Reload recovery via QueueStorage port; `sending` items reset to `pending` (same files)
- [x] UX states online/offline/syncing/needs_attention; logout `clear()` (same files)

## Remaining
- [ ] IndexedDB `QueueStorage` adapter and queue UI in `apps/pwa` (not built yet)
- [ ] Encrypting queued inputs at rest on the device
- [ ] Cross-tab coordination (one flusher per origin, e.g. Web Locks)

Package overview: `packages/platform/README.md`. Traceability: `packages/platform/traceability.json`.
