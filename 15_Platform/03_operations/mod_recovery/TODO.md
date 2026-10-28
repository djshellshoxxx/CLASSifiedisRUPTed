# TODO: F15.S03.M03 recovery

**Status:** IMPLEMENTED; relay wiring pending.

## Implemented
- [x] `replayEvents` with durable checkpoints, `rebuildProjection`, `redeliverOutbox` (`packages/platform/src/ops/recovery.ts`; `packages/platform/test/recovery.test.ts`)
- [x] Runbooks as typed data: relay loss, data corruption, key compromise (`packages/platform/src/ops/runbooks.ts`)
- [x] Drill tracking with state machine, RTO judgement and overdue report (`packages/platform/src/ops/drills.ts`)

## Remaining
- [ ] Projection handlers from feature packages (relay registers them)
- [ ] Asynchronous outbox delivery to remote peers
- [ ] Real drills: none have been performed

Package overview: `packages/platform/README.md`. Traceability: `packages/platform/traceability.json`.
