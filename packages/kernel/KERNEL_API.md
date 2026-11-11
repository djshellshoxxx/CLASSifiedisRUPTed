# @classrup/kernel — API guide for feature packages

Source of truth: `src/index.ts` (core), `src/node.ts`, `src/browser.ts`, `src/testing/index.ts`. Specs: F15.S02.M02 (bus), F15.S02.M03 (storage), F15.S03.M01 (observability).

## Entry points
- `@classrup/kernel` — isomorphic core (no `node:` imports).
- `@classrup/kernel/node` — `openSqliteStorage`, `createHttpHandler`, `startHttpServer` (relay only).
- `@classrup/kernel/browser` — `openIndexedDbStorage` (vault; loads the vault into memory at open; one tab owns it — coordinate tabs with Web Locks).
- `@classrup/kernel/testing` — `createTestKernel()` (`cmd`, `ask`, `drainOutbox`, `events`, `audit`, `logs`, `flags.set`, `user(roles)`), `storageContractSuite`.

## Core exports
- ids/clock: `createUuidV7Generator`, `createDeterministicIds`, `isUuidV7`, `parseId`, `checkIdSkew`, `Id<T>`, `IdGen`, `Clock`, `createSystemClock`, `createFakeClock`.
- errors: `Result`, `ok`, `err`, `AppError`, `appError`, `defineErrors`, `AppErrorException`, `COMMON_ERRORS`, `toProblemJson`.
- validation: `parseInput`, `strictObject`, `uuidv7`, `timestamp`, `boundedString`, `money`, `revision`.
- events: `defineEvent`, `EventEnvelope`, `EventSink`.
- bus: `defineMachine`, `defineCommand`, `defineQuery`, `defineSubscriber`, `createRegistry`, `createBus` (`dispatch`, `query`); ports `AuthzPort`, `FlagPort`, `RateLimitPort`, `AuditPort`, `SessionPort` (defaults provided); `createRelayAccess`, `relayAccessDefinitions` (relay access tokens via injected `SignatureVerifier` from @classrup/security).
- storage: `createStorage`, `createMemoryStorage`, `defineRepo` (`get`, `require`, `put`, `remove`, `restore`, `query`), leases, sync outbox, MediaBlob, `runMigrations`.
- delivery/observability: `createOutboxDispatcher`, `createSyncSender` (`recordPeerAck`), `createLogger`, `createRingBufferSink`, `redact`, `createMetricsRegistry`, `createReadiness`.

## Rules for feature modules
1. `defineCommand` / `defineQuery` / `defineSubscriber` require `module` (the F-ID, e.g. `F01.S04.M01`). `surface` defaults to `vault`; only `relay` or `both` definitions are reachable over HTTP.
2. Handlers return `Result`; a thrown error becomes `INTERNAL`.
3. Emit with `ctx.emit(eventDef, { aggregate, revision, payload })`; payloads are validated strictly.
4. Signed statements for other parties: `ctx.tx.sync.enqueue(...)`, only from definitions with `deliveryEligible: true`.
5. `repo.put(id, data, { expectedRevision })`; `0` creates. Revision lives on the stored record, not inside `data`.
6. A repo has at most 4 indexes; append new ones, never reorder.
7. Stored data is JSON: money as decimal strings (convert to `bigint` in domain code), never `bigint` in storage.
8. Transactions are serialized and not re-entrant: never call `storage.transaction` inside a handler; use `ctx.tx`.
9. Blobs: refs `blob:sha256-<base64url>`, ≤ 5 MiB, strip metadata first (F10.S02.M03); repos declared with `blobs:` refcount automatically; relays reject non-P0 plaintext blobs.
10. Idempotency: only successful results are recorded (CTR-IDM-001 IDM-9).
11. Outbox dispatcher retries consumer failures with backoff and dead-letters after 8 attempts; disabled modules pause without consuming attempts. Sync outbox retries retryable errors until the entry is 7 days old (then `failed` / `EXPIRED`); non-retryable errors fail immediately.
