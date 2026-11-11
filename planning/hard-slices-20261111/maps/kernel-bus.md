# Subsystem map: kernel-bus (`packages/kernel`)

Paths are relative to `packages/kernel/src/` on branch `claude/difficult-project-parts-dcqlup`. Only the listed files were mapped; `storage/*`, `outbox/dispatcher.ts` and `observability/*` are described only as the bus uses them.

## 1. Defining commands, queries, subscribers (`bus/define.ts`)

Contexts handed to handlers:

- `HandlerContext` (15-23): `actor: Actor`, `tenantId`, `correlationId`, `clock: Clock`, `ids: IdGen`, `ports: Ports`, `log: Logger`.
- `CommandContext` (27-33) adds `commandId`, `expectedRevision: number | undefined` (from `DispatchOptions`, e.g. HTTP If-Match), `tx: WriteScope`, `emit: Emit`.
- `QueryContext` (35-37): `tx: ReadScope` only (no emit).
- `ConsumerContext` (39-43): `causationId`, `tx: WriteScope`, `emit`.
- `Emit` (25): `<D extends EventDef>(def: D, input: EmitInput<PayloadOf<D>>) => EventEnvelope<PayloadOf<D>>`.

Specs (handlers may return `T | Promise<T>`):

- `CommandSpec<I extends z.ZodType, O>` (47-63): `name`, `module`, `capability`, `input: I`, `output?: z.ZodType<O>`, `idempotent: boolean` (required), `surface?: Surface` (`'vault' | 'relay' | 'both'`, line 13), `auth?: 'required' | 'public'`, `deliveryEligible?`, `hideForbidden?` (FORBIDDEN→NOT_FOUND), `resource?(input: z.output<I>): ResourceRef | undefined`, `successStatus?: 200 | 201 | 202`, `handler(ctx: CommandContext, input: z.output<I>): Awaitable<Result<O, AppError>>`.
- `QuerySpec<I, O>` (65-76): same minus `idempotent`, `deliveryEligible`, `successStatus`; `handler(ctx: QueryContext, input)`.
- `SubscriberSpec<D extends EventDef>` (78-85): `name` (consumer ID used for inbox dedupe), `module`, `events: readonly D[]`, `deliveryEligible?`, `handler(ctx: ConsumerContext, envelope: EventEnvelope<PayloadOf<D>>): Awaitable<Result<void, AppError>>`.

Factories (all return `Object.freeze`d defs with `kind` discriminator):

- `defineCommand<I, O>(spec): CommandDef<I, O>` (108-111): defaults `surface: 'vault'`, `auth: 'required'`.
- `defineQuery<I, O>(spec): QueryDef<I, O>` (113-116): same defaults.
- `defineSubscriber<D>(spec): SubscriberDef<D>` (118-123): adds `types: string[]` from `events[].type`; throws if `events` empty.

Name invariants (throw plain `Error` at definition time):

- `OP_RE = EVENT_TYPE_RE = /^[a-z0-9]+\.[a-z0-9_]+\.[a-z0-9_]+$/` (98; envelope.ts:42) for command/query `name` **and** `capability` (messages: `name must be <slug>.<entity>.<verb>`, `capability ... must be <slug>.<resource>.<action>`).
- `MODULE_RE = /^F\d\d(\.S\d\d(\.M\d\d)?)?$/` (99) for `module`, e.g. `F01.S04.M01`.
- `CONSUMER_RE = /^[a-z0-9]+(\.[a-z0-9_]+)+$/` (100) for subscriber names, e.g. `notify.offer_made`.

Type-erased forms: `AnyCommand`, `AnyQuery`, `AnySubscriber`, `AnyDefinition` (93-96).

`Registry` (125-133): `add(...defs): Registry` (chainable), `command(name)`, `query(name)`, `subscriber(name)`, `commands()`, `queries()`, `subscribers()`. `createRegistry()` (136-158): commands and queries share one namespace (a query named like an existing command throws `duplicate query <name>`, line 142); subscribers have their own namespace.

## 2. The bus pipeline (`bus/bus.ts`)

Stage order (comment lines 2-3): flag → authn → rate limit → validation → authorize → idempotency → handler in Tx → outbox → idempotent response → audit.

Types:

- `IDEMPOTENCY_TTL_MS = 86_400_000` (35).
- `BusOptions` (37-53): required `registry`, `storage: Storage`, `clock`, `ids`, `authz: AuthzPort`; optional `audit`, `flags`, `rateLimit`, `eventSink`, `logger`, `metrics`, `ports`, `origin` (provenance string, default `'local'`), `idempotencyTtlMs`.
- `DispatchContext` (55-63): `actor`, `tenantId`, `correlationId?`, `origin?: Origin` (`'local' | 'remote'`, default local), `network?` (truncated /24 or /48, never raw IP).
- `DispatchOptions` (65-68): `idempotencyKey?`, `expectedRevision?`.
- `CommandOutcome` (70-76): `value`, `status`, `replayed`, `events: readonly EventEnvelope[]`, `correlationId`. `QueryOutcome` (78-82): `value`, `status: 200`, `correlationId`.
- `Bus` (84-88): `dispatch(ctx, name, rawInput, opts?) → Promise<Result<CommandOutcome, AppError>>`, `query(ctx, name, rawInput) → Promise<Result<QueryOutcome, AppError>>`, `registry`.

Behaviour, in order, for `dispatch` (251-268) / `runCommand` (203-223):

1. `reachable` (98-100): unknown name, or `origin === 'remote'` and `def.surface === 'vault'` → `NOT_FOUND`. A `local` origin reaches every surface, including `'relay'`.
2. `gate` (133-140): `flags.isEnabled({tenantId, module, actor, operation})` false → `FEATURE_DISABLED`; `def.auth === 'required'` and `actor.kind === 'anonymous'` → `UNAUTHENTICATED`; `rate.check(...)` not allowed → `RATE_LIMITED` with `retryAfterMs` set both top-level and in `params`; then `parseInput(def.input, raw)` → `VALIDATION_FAILED`.
3. `validateKey` (102-108): non-idempotent commands ignore the key. Idempotent commands require it: missing → `VALIDATION_FAILED` fields `[{path:'idempotencyKey', code:'REQUIRED'}]`; not UUIDv7 → code `INVALID_UUIDV7`; embedded timestamp >24 h in the future → `ID_TIMESTAMP_SKEW`.
4. `authorize` (142-147): `o.authz.authorize(actor, def.capability, def.resource?.(parsed), {tenantId, operation, kind, origin, now})`. Deny mapping: `FORBIDDEN` + `hideForbidden` → `NOT_FOUND`; code `NOT_FOUND` → `appError('NOT_FOUND')` (params dropped); otherwise `errorFromCode(code, params)`. A denial writes an audit entry with `decision: 'deny'`, `outcome: 'denied'` (commands only).
5. `execute` (171-194), inside `o.storage.transaction(async (tx) => ...)`: `requestHash(raw)` is SHA-256 of canonical JSON of the **raw, pre-validation** input; idempotency ref is `{tenant, actor: actorKey(actor), command: def.name, key}`. `tx.idempotency.lookup(ref, now)` hit with equal hash → `{value: prior.response, status: prior.status, replayed: true}`; different hash → `IDEMPOTENCY_KEY_REUSED`. Then `writeScope({tx, tenantId, clock, ids, deliveryEligible: def.deliveryEligible === true})`, `makeEmitter(...)` with `causationId = commandId = o.ids.next()`, handler context with `log: log.child({module, correlationId})`. Handler `Err` is returned as-is (the test `TEST-PS-117-09.T11` in `bus/bus.test.ts` asserts records, outbox and idempotency roll back on `err` or throw; the rollback lives in `storage/storage.ts`, not mapped). On `Ok`: `checkOutput` (196-201) validates against `def.output` if present (mismatch **throws** `Error` → surfaces as `INTERNAL`) and `jsonNormalize`s the value; `status = def.successStatus ?? 200`; `tx.idempotency.save({...ref, requestHash, status, response: value ?? null, createdAt, expiresAt: now + ttl})`.
6. Exceptions: `toAppError` (110-112) maps `AppErrorException` to its carried error, anything else to `appError('INTERNAL')` (message text never leaks). `runCommand` audits `decision:'allow'`, `outcome:'error'` and rethrows; `dispatch` catches again and converts to `Err`.
7. `publish` (240-247): only when `r.ok && !replayed` and `eventSink` set; sink failures are logged as `event_sink.failed`, never surfaced. Replays return `events: []`.
8. `finish` (225-235): metrics `classrup_command_total{module,outcome,code}`, `classrup_command_duration_ms{module,outcome}` (and `classrup_query_*`); outcome label `ok | replayed | rejected (<500) | failed (>=500)`; logs `command.completed` / `command.failed` (and `query.*`).

`writeAudit` (149-167): `AuditEntry` with `actor: envelopeActor(actor)`, `capability`, `operation`, optional `resource {type,id}`, `decision`, `outcome`, `code` on error; failures logged as `audit.write_failed`. Queries are never audited.

`runQuery` (287-301): gate → authorize (no audit) → `o.storage.transaction(fn, { mode: 'read' })` with `readScope({tx, tenantId, clock})`; output passes `checkOutput`.

Storage/tx surface used by the bus (defined in unmapped `storage/tx.ts`, `storage/scope.ts`): `storage.transaction(fn, opts?)`, `tx.idempotency.lookup/save`, `tx.outbox.append(env)`, `readScope(...)`, `writeScope(...)`. Handlers use `ctx.tx.repo(def)` → `get(id)`, `require(id): Result`, `query(q): Result<Page>`, `put(id, data, {expectedRevision}): Result<StoredRecord>`, `remove(id, {expectedRevision}): Result<void>` (`storage/repo.ts:61-75`) and `ctx.tx.sync.enqueue(destination, {cid, type, payload?})` → `{id, state}` (`testing/sample-module.ts:81`).

## 3. Emit (`bus/emit.ts`)

`EmitterOptions` (9-19): `tx`, `tenantId`, `actor`, `ids`, `clock`, `correlationId`, `causationId`, `origin`, `collected: EventEnvelope[]`. `makeEmitter(o): Emit` (21-36) calls `buildEnvelope(def, input, {eventId: ids.next(), tenantId, actor: envelopeActor(actor), occurredAt: clock.iso(), correlationId, causationId, origin})`, then `o.tx.outbox.append(env)` and pushes to `collected`. Emit is synchronous; it throws (programmer error) on bad payload/revision.

## 4. Ports (`bus/ports.ts`)

- `Actor` (9): `{kind:'anonymous'} | {kind: ActorKind; id; roles: readonly string[]}`; `ActorKind = EnvelopeActorKind` (`'user'|'system'|'relay'|'federated'|'operator'`). `ANONYMOUS` (10). `actorKey` (12): `'anonymous'` or id. `envelopeActor` (16): anonymous → `{kind:'system', id:'anonymous'}`.
- `ResourceRef {type, id}` (20). `Origin` (25). `AuthzContext {tenantId, operation, kind: 'command'|'query'|'endpoint', origin, now}` (27-33). `AuthzDecision = {allow:true} | {allow:false; code: string; params?}` (35). `AuthzPort.authorize(actor, capability, resource | undefined, context)` (38-40), sync or async, default deny.
- `FlagPort.isEnabled(q: FlagQuery)` (50-52); `FlagQuery {tenantId, module, actor, operation}` (42-47).
- `RateLimitPort.check(q: RateQuery) → RateDecision` (68-70); `RateQuery` (54-63) includes `kind`, `capability`, `now`, `network?`; `RateDecision = {allowed:true} | {allowed:false; retryAfterMs}` (65).
- `AuditEntry` (72-83), `AuditPort.record(entry)` (86-88).
- `Session {actor, tenantId}` (90); `SessionPort.resolve(token | undefined): Promise<Result<Session, AppError>>` (96-98).
- `errorFromCode(code, params?)` (101-104): common code → `appError`; otherwise `{code, status: 403, retryable: false, messageKey, params}`.
- Implementations: `allowAllAuthz` (106), `denyAllAuthz` (107, code `FORBIDDEN`), `RoleTable = Record<capability, roles[]>` (110) and `createRoleTableAuthz(table)` (112-123): unknown capability → `FORBIDDEN`; role `'anonymous'` grants everyone; anonymous actor otherwise → `UNAUTHENTICATED`; `'*'` grants any authenticated actor. `allFlagsOn` (125); `createStaticFlags(disabled)` (127-133) matches the module ID or its 3-char feature prefix (`q.module.slice(0,3)`), with `set(module, enabled)`. `unlimitedRate` (135); `rateKey(q)` (138-141) = `${tenantId}\u0001${who}\u0001${operation}` where `who` is `net:<prefix>` for anonymous callers with a network, else `actorKey`; `createFixedWindowRateLimiter({limit, windowMs, clock, maxKeys?=10000})` (147-170). `noopAudit` (172); `createMemoryAudit()` (174-177) exposes `entries`.
- `Ports = Readonly<Record<string, unknown>>` (179); `requirePort<T>(ports, name)` (182-186) throws `port <name> is not wired`.

## 5. Relay access tokens (`bus/access.ts`)

- `SignatureVerifier.verify(principal, message: Uint8Array, signature: string, repos: Pick<ReadScope,'repo'>)` (28-30): runs inside the login transaction; must read via `repos`, never `storage.transaction()`/`storage.read()` (not re-entrant).
- `RelayAccessOptions` (32-48): `storage`, `clock`, `ids`, `relayId`, `tenantId`, `verifier`, `rolesFor?`, `random?: RandomFill`, `nonceTtlMs?` (120 000), `maxPendingChallenges?` (10 000), `idleTimeoutMs?` (7 days), `absoluteTimeoutMs?` (30 days).
- `RelayAccess extends SessionPort` (67-79): `challenge()`, `login(input)`, `revoke(token)`, `loginIn(repos, input)`, `revokeIn(repos, token)`, `pendingChallenges()`, `purgeExpired()`.
- `loginMessage(relayId, nonce)` (95) = `` `classrup-login:v1:${relayId}:${nonce}` ``.
- Token repo `platform.access_token` (83-87): `{principal, roles: string[], lastUsedAt, absoluteExpiresAt}`, indexes on both timestamps; record id is `sha256Hex(token)`; tokens are 32 random bytes base64url (43 chars; input regex `/^[A-Za-z0-9_-]{43}$/`).
- Nonce store (102-133): in-process map, swept on `issue`, oldest dropped at capacity; `consume` deletes on lookup whether or not valid.
- `loginIn` (149-159): bad/expired nonce or failed verify → `UNAUTHENTICATED`; stores `roles: []`. `touch` (161-171): expired (absolute ≤ now or lastUsedAt + idle ≤ now) → `UNAUTHENTICATED`; refreshes `lastUsedAt` at most once per 60 s. `resolve` (201-208): `undefined` token → `{actor: ANONYMOUS, tenantId}`; `rolesFor` applied after the transaction. `purgeExpired` loops pages of `PURGE_PAGE = 500`.
- `relayAccessDefinitions(access)` (228-263): commands `platform.access_token.challenge`, `.login`, `.revoke` under module `ACCESS_MODULE = 'F15.S02.M02'`, `surface: 'relay'`, `auth: 'public'`; revoke is `idempotent: true` and returns `{revoked: true}`.

## 6. State machines (`machine/machine.ts`)

`Transition<S,E> {from, to, on}` (5-9); `MachineDef<S,E> {initial, terminal, transitions}` (11-15); `Machine<S,E>` (17-27) adds `states`, `can(state, event)`, `next(state, event): Result<S, AppError>`, `isTerminal(state)`, `edges(): string[]` (`"from -> to"`, no event). `defineMachine<const S, const E>(def)` (45-63) validates (29-43) and throws on: a terminal state with an outgoing transition; `(from, on)` mapping to two different `to` (identical duplicates allowed); `initial` absent from transitions; a terminal state that appears in no transition. `states` is derived solely from transitions. Undeclared transitions → `CONFLICT_STATE` with `params: {state, event}` (58).

## 7. Error model (`errors/*`)

- `ErrorSpec {status, retryable}` (codes.ts:2). `COMMON_ERRORS` (7-25): `VALIDATION_FAILED` 422, `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT_REVISION` 409, `CONFLICT_STATE` 409, `IDEMPOTENCY_KEY_REUSED` 422, `PRECONDITION_FAILED` 412, `EXPIRED` 410, `RATE_LIMITED` 429 (retryable), `FEATURE_DISABLED` 404, `PAYLOAD_TOO_LARGE` 413, `UNSUPPORTED_SCHEMA_VERSION` 400, `BLOCKED_PARTY` 403, `DEPENDENCY_UNAVAILABLE` 503 (retryable), `INTERNAL` 500 (retryable), `ID_TIMESTAMP_SKEW` 422. `PLATFORM_ERRORS` (30-34): `PLATFORM_BUS_UNSUPPORTED_MEDIA_TYPE` 415, `PLATFORM_BUS_METHOD_NOT_ALLOWED` 405, `PLATFORM_STORE_MIGRATION_DRIFT` 500.
- `AppError` (app-error.ts:9-17): `code`, `status`, `retryable`, `messageKey` (= `error.<code lowercased>`, 27-29), `params` (always present, `{}` default), `fields?: FieldIssue[]` (only when non-empty), `retryAfterMs?` (only when given). `FieldIssue {path, code}` (4-7). `AppErrorExtra {params?, fields?, retryAfterMs?}` (19-23).
- `appError(code: CommonCode | PlatformCode, extra?)` (38-41). `isAppError(x)` (43-47).
- `defineErrors<const C>(table): ErrorRegistry<C>` (59-70): each code must match `/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/` **and** contain `_`, must not shadow a common code, status integer 400-599. Returns `{codes, make(code, extra?), has(code)}`.
- `AppErrorException` (76-83): `Error` subclass carrying `.error: AppError`; `message` is the code. The bus maps it back; use it only where a `Result` cannot be returned.
- `Result<T, E = AppError> = Ok<T> | Err<E>` (result.ts:4-6); `ok(value)` / `ok()` (8-12), `err(e)` (14), `mapResult` (18), `andThen` (22), `unwrap` (27-30, throws; tests/composition roots only).
- `toProblemJson(error, correlationId?)` (problem.ts:20-32): `type: urn:classrup:error:<code>`, `title: code`, contract fields only, `null` for absent `correlationId`/`retryAfterMs`; `PROBLEM_CONTENT_TYPE = 'application/problem+json'` (4).

## 8. Validation (`validation/*`)

- `parseInput<S>(schema, raw): Result<z.output<S>, AppError>` (parse.ts:54-58) uses `safeParse(raw, { reportInput: true })`. `issuesToFields` (41-49): paths joined with `.`; `unrecognized_keys` → one `UNKNOWN_FIELD` per key at `parent.key`. `codeOf` (12-39): `invalid_type` → `REQUIRED` (input `undefined`) or `INVALID_TYPE`; `too_small`/`too_big`/`invalid_format`/`not_multiple_of`/`invalid_value`/`invalid_union`/`invalid_key`/`invalid_element` → same name upper-cased; `custom` → `issue.params.code` if string else `INVALID`.
- schemas.ts (zod `4.6.7` per `packages/kernel/package.json`; `z` re-exported at line 5): `strictObject` (8), `uuidv7<T>()` (10-15, refine code `INVALID_UUIDV7`, transforms to branded `Id<T>`), `isTimestamp`/`timestamp()` (19-28, exact `YYYY-MM-DDTHH:mm:ss.sssZ` round-trip, code `INVALID_TIMESTAMP`), `codePointLength`, `boundedString({min?, max})` (42-48, code points, codes `TOO_SMALL`/`TOO_BIG`), `money({sign?: 'any'|'positive'|'nonNegative'})` (61-70, `amount` decimal-integer string ≤78 digits, `-0` rejected, codes `INVALID_AMOUNT`/`INVALID_SIGN`/`INVALID_CURRENCY`, currency `/^[A-Z][A-Z0-9]{2,9}$/`), `revision()` (73-75, `z.int().min(1)`).

Custom refine codes must be passed as `{ params: { code: '...' } }` to reach `fields[].code`.

## 9. Canonical JSON and hashing (`hash/canonical.ts`)

`canonicalJson(value)` (36-38): keys sorted by `Object.keys().sort()` (UTF-16 order), no whitespace, `undefined`/functions/symbols dropped in objects and `null` in arrays, `toJSON` honoured, `TypeError` on non-finite numbers and bigint. `sha256Hex(text): Promise<string>` (42-47, WebCrypto). `requestHash(input)` (50-52) = `sha256Hex(canonicalJson(input))`. `jsonNormalize(value)` (55-57) = JSON round-trip (undefined preserved only at top level). `compareUtf8(a, b)` (60-70) = SQLite BINARY order.

## 10. IDs (`ids/uuidv7.ts`)

`Id<T extends string = string>` branded string (7); `IdGen.next<T>(): Id<T>` (9-11); `RandomFill = (bytes: Uint8Array<ArrayBuffer>) => void` (13); `MAX_ID_SKEW_MS = 86_400_000` (15); regex `/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/` (16, lowercase only). `webCryptoRandom` (21), `isUuidV7(value): value is Id` (25), `uuidV7Timestamp(id)` (30-33), `parseId<T>(value, path = 'id')` (35-38, `VALIDATION_FAILED` / `INVALID_UUIDV7`), `checkIdSkew(id, nowMs, maxSkewMs?)` (41-45, only future skew is rejected; `ID_TIMESTAMP_SKEW` params `{maxSkewMs}`), `encodeUuidV7(ms, counter, tail)` (54-71), `createUuidV7Generator({now?, random?})` (90-112, monotonic 42-bit counter; timestamp advances on overflow or a backwards clock), `createSeededRandom(seed)` (115-128, xorshift32), `createDeterministicIds({seed?=1, now})` (130-132).

## 11. Clock (`clock/clock.ts`)

`Clock {now(): number; iso(): string}` (2-7); `FakeClock` adds `advance(ms)` (non-negative finite, else `RangeError`) and `set(at: number | string)` (9-12). `toIso(ms)` (14), `parseIso(iso)` (18-21, throws `RangeError`), `createSystemClock()` (24-26), `createFakeClock(start = '2026-11-04T10:00:00.000Z')` (33-46). Never call `Date.now()` in handlers; use `ctx.clock`.

## 12. Events (`events/envelope.ts`)

`EventEnvelope<P>` (12-26): `eventId`, `type`, `version`, `tenantId`, `aggregate {type,id}`, `revision`, `actor {kind,id}`, `occurredAt`, `correlationId`, `causationId`, `privacy: 'P0'..'P4'`, `payload`, `provenance {origin, sig: string | null}`. `EventDef<T, S>` (28-33); `PayloadOf<D>` (35); `EventSink.publish(events)` (38-40, post-commit only). `defineEvent(type, version, privacy, payload)` (46-51): type must match `EVENT_TYPE_RE`, version integer ≥1. `EmitInput<P> {aggregate, revision, payload}` (53-57). `buildEnvelope(def, input, ctx)` (70-89) throws on payload mismatch or `revision < 1`; `sig` is always `null`. `collectingSink()` (91-94) exposes `events`.

## 13. Test harness (`testing/harness.ts`, `testing/sample-module.ts`, `testing/index.ts`)

Framework: vitest (root `vitest.config.ts`: `packages/*/src/**/*.test.ts`, node environment, `testTimeout: 20000`). Tests import `describe, expect, it` from `'vitest'`; titles carry trace IDs like `TEST-PS-117-09.T10 ...` (bus.test.ts). Typical pattern: a local `kernel()` helper wraps `createTestKernel({ definitions: sampleDefinitions(counters).all })`; assertions use `expect(r.ok && r.value).toMatchObject({...})` and `expect(!r.ok && r.error).toMatchObject({ code, status })`; storage is inspected with `k.storage.read((tx) => ...)`.

`createTestKernel(opts: TestKernelOptions = {}): TestKernel` (80-126):

- `TestKernelOptions` (28-39): `start?` (clock), `seed?` (ids, default 1), `definitions?`, `authz?: 'allow-all' | RoleTable | AuthzPort` (default allow-all; `authzOf` 74-78 detects a port by an `authorize` function), `disabledModules?`, `rateLimit?`, `ports?`, `random?` (outbox jitter, default `() => 0.5`).
- `TestKernel` (50-72): `clock: FakeClock`, `ids`, `storage` (memory), `registry`, `bus`, `outbox: OutboxDispatcher`, `metrics`, `logs: RingBufferSink` (10 000 entries, level `debug`), `logger`, `events: EventEnvelope[]` (post-commit `collectingSink`, shared by bus and outbox dispatcher), `audit: AuditEntry[]`, `tenantId: Id<'Tenant'>`, `actor` (user with roles `['member']`), `flags.set(module, enabled)`, `user(roles?)` → `{kind:'user', id: 'did:key:z6Mk' + uuid without dashes, roles}`, `cmd(name, input, opts?)`, `ask(name, input, opts?)`, `drainOutbox(): Promise<DispatchStats>`.
- `CallOptions` (41-48): `actor?`, `tenantId?`, `idempotencyKey?: string | 'auto' | 'none'` (default auto: a fresh `ids.next()` only if the registered command is `idempotent`), `expectedRevision?`, `correlationId?`.
- Bus origin is `'vault:test'` (92). The id sequence is shared: `tenantId` consumes the first id, the default actor the second; extra `ids.next()` calls shift every later id.

`sample-module.ts`: `SAMPLE_MODULE = 'F99.S01.M01'` (10); `itemRepo` type `sample.item` `{name, owner}` indexed by `owner` (11); events `sample.item.created` / `sample.item.renamed` v1 P1 (12-13); `SampleCounters {create, consumed: string[], failConsumer}` (15-19); `sampleDefinitions(counters?)` (21-111) returns `{create, rename, failing, publish, ping, get, consumer, all}`. It demonstrates `put(id, data, {expectedRevision: 0})` for creates, `require` + `put` with input `expectedRevision` for updates, `ctx.emit` after the write, `hideForbidden` + `resource`, `deliveryEligible` + `ctx.tx.sync.enqueue`, a public `surface: 'relay'` command and a subscriber.

`testing/index.ts` (package export `@classrup/kernel/testing`) re-exports the harness, fake clock, deterministic ids, memory storage, the test authz/flags/audit ports, `collectingSink`, `createRingBufferSink` and `storageContractSuite`.

## 14. Pitfalls checklist for implementers

1. Return `err(appError(...))` or `errors.make(...)`; never throw for domain failures. A thrown non-`AppErrorException` becomes an opaque `INTERNAL`.
2. Output schema mismatches throw → `INTERNAL`; outputs are JSON-normalised (Dates become strings, `undefined` keys vanish), and `undefined` is stored as `null` in the idempotency record.
3. Idempotent commands always need a UUIDv7 key; the harness supplies one unless `idempotencyKey: 'none'`. Replays carry `events: []` and skip the sink.
4. The request hash is over the raw input, so two bodies differing only in defaulted/optional fields are different requests.
5. `auth: 'required'` is checked before validation; capability checks happen after validation with `resource(input)`. Use `hideForbidden: true` for resources the actor may not know exist.
6. Emit only inside the handler with `revision >= 1`; emitted events are rolled back with the transaction on `Err`.
7. Commands and queries share one name namespace; names, capabilities and event types must match `<slug>.<entity>.<verb>`; modules must match `F\d\d(.S\d\d(.M\d\d)?)?`.
8. `defineErrors` codes must be `UPPER_SNAKE` with at least one underscore and must not reuse common codes.
9. Custom zod refinements need `params: { code }` to produce stable field codes; `unrecognized_keys` surfaces as `UNKNOWN_FIELD`.
10. `local` origin reaches `relay`-surface definitions; only `remote` origin is restricted to `relay`/`both`.
