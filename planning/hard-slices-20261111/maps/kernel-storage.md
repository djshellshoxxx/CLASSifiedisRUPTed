# Map: kernel-storage (`packages/kernel/src/storage/*`)

Paths are relative to `/home/user/CLASSifiedisRUPTed/packages/kernel/src/storage/` unless noted. Branch `claude/difficult-project-parts-dcqlup`. Facts from files outside the assigned set are marked **[outside]**.

## 1. Layering

```
Repo/Scope (repo.ts, scope.ts)      typed, tenant-scoped, zod-validated, Result-returning
   └─ Tx (tx.ts)                    unit of work: CAS, leases, idempotency, outbox/inbox/DLQ, sync, blobs, migrations
        └─ DriverTx (driver.ts)     synchronous row ops; JSON text in/out; no semantics
             ├─ memory-driver.ts    reference impl + undo journal; also the IndexedDB working set
             ├─ indexeddb.ts        memory driver + persist(changes) into IDB + writer fence + Web Lock
             └─ sqlite.ts           (not in this set; `DriverKind 'sqlite'` branches exist in tx.ts)
Storage (storage.ts)                serializes begin/commit/rollback around a driver
```

Semantics live once in `tx.ts`; drivers only store rows. `DriverTx` is **synchronous** (`driver.ts:145`); the only async `Tx` method is `blobs.put` (WebCrypto SHA-256, `tx.ts:439-442`).

## 2. Driver port — `driver.ts`

Row shapes (all `readonly`):
- `RecordRow` L5-15: `{tenant, type, id, revision:number, data:string, idx:IndexValues, createdAt, updatedAt}`. `data` is JSON text: "every adapter stores and returns identical text" (L10). `IndexValues = readonly [string|null ×4]` (L3), `IndexSlot = 1|2|3|4` (L2).
- `RecordFilter` L19 `{slot, op:'eq'|'lt'|'lte'|'gt'|'gte', value}`; `RecordQuery` L25-34 `{tenant,type,filters,orderSlot:0|IndexSlot,dir,after?:{value:string|null,id},limit}`. `orderSlot 0` = by id; 1..4 = by that index then id, rows with null index excluded (L29).
- `OutboxRow` L36-46 (`seq` assigned by driver, `envelope:string`), `InboxRow` L50-59 (`status: 'done'|'retry'|'dead'`), `PendingQuery` L61, `IdempotencyRow` L68-78 (`response:string`), `LeaseRow` L80-87 (`fence:number`), `DeadLetterRow` L89-98, `SyncRow` L102-115 (`state: SyncState = 'prepared'|'transport_acknowledged'|'peer_accepted'|'failed'` L100; `receipt:string|null`), `SyncListQuery` L117, `BlobRow` L127-137 (`bytes:Uint8Array`, `privacy:'P0'|'P1'|'P2'|'P3'`, `encrypted:boolean`), `MigrationRow` L139-143 `{id, checksum, appliedAt}`.

`interface DriverTx` L146-209: namespaces `records {get,upsert,remove,query}`, `outbox {append(Omit<OutboxRow,'seq'>):number, get, pending, oldestUndelivered, purgeBefore(occurredAt):number}`, `inbox {get,upsert}`, `idempotency {get,upsert,purgeExpired(now):number}`, `leases {get,upsert}`, `deadLetters {get,upsert,remove,list(consumer|undefined,limit),purgeBefore}`, `sync {get,upsert,heads(now,limit),list(q)}`, `blobs {get,upsert,remove,holders(tenant,ref):number,attach,detach,orphans(createdBefore,limit)}`, `migrations {list():MigrationRow[], insert(row)}`. Doc contracts on L156-164, L184, L190, L198-203.

```ts
export type DriverKind = 'memory' | 'indexeddb' | 'sqlite';                       // L211 (closed union)
export interface StorageDriver { readonly kind: DriverKind; begin(mode:'read'|'write'): DriverTx;
  commit(): void | Promise<void>; rollback(): void; close(): void | Promise<void>; } // L214-220
```
"The storage wrapper serializes begin/commit/rollback; drivers need no locking" (L213).

## 3. Storage wrapper — `storage.ts`

```ts
export interface Storage { readonly kind: DriverKind;
  transaction<T,E>(fn:(tx:Tx)=>Result<T,E>|Promise<Result<T,E>>, opts?:{mode?:TxMode}): Promise<Result<T,E>>;
  read<T>(fn:(tx:Tx)=>T|Promise<T>): Promise<T>; ping(): Promise<boolean>; close(): Promise<void>; } // L10-22
export function createStorage(driver: StorageDriver): Storage   // L58
export function createMemoryStorage(): Storage                   // L93
```
- `createLock` L24-39: promise-chain mutex; `transaction` and `close` both run under it. **Not re-entrant**: `transaction()` inside `fn` deadlocks (KERNEL_API rule 8).
- `runTx` L41-56: `createTx(driver.begin(mode), driver.kind)`; exception in `fn` → `rollback()` + rethrow; `!result.ok || mode==='read'` → `rollback()`, return result; else `await driver.commit()`. A rejected `commit()` propagates to the caller.
- `read` L70: runs in `'read'` mode, unwraps; `guard()` L61 throws `Error('storage is closed')` after close. `close` L82 idempotent, calls `driver.close()`.

## 4. Unit of work — `tx.ts`

`createTx(d: DriverTx, kind: DriverKind = 'memory')` L531-543; `type Tx = ReturnType<typeof createTx>` L546. Stores:

**records** L120-169. `StoredRecord<T>` L11-19 `{tenantId,type,id,revision,data:T,createdAt,updatedAt}` (note `tenantId` vs row `tenant`). `PutRecordInput` L21-30 `{tenant,type,id,data:unknown,idx,expectedRevision,now:number}`.
- `checkRevision` L109: non-integer or <0 → **throws** `RangeError`.
- `casCheck` L113-118: `expected>=1 && !current` → `NOT_FOUND`; `current.revision ?? 0 !== expected` → `CONFLICT_REVISION {params:{currentRevision}}`. New revision = current+1; `createdAt` kept from current; `updatedAt = toIso(now)`.
- `jsonText` L103: `JSON.stringify` undefined → throws `TypeError`.
- `remove` L145: missing → `NOT_FOUND`, then CAS.
- `restore(rec, idx)` L161-167: existing with same revision **and identical JSON text** → `'identical'`; existing different → `CONFLICT_REVISION`; absent → upsert as-is (revision/timestamps kept) → `'restored'`.

**leases** L180-228 (`Lease` L32-39, `LeaseRequest` L41-46, `DEFAULT_LEASE_TTL_MS = 15 min` L96, `MAX_LEASE_TTL_MS = 24 h` L97). `checkTtl` throws `RangeError` outside 1 ms..24 h. "active" = row with `expiresAt > toIso(now)` (string compare). `acquire`: other active holder → `PRECONDITION_FAILED {reason:'lease_held',resourceId}`; same holder keeps `acquiredAt`/`fence`; new acquisition `fence = (prior?.fence ?? 0)+1` where `prior` may be an expired row. `renew`: no row → `NOT_FOUND`; other holder → `PRECONDITION_FAILED` if active else `EXPIRED`; own expired → `EXPIRED`. `release`: not active → ok; other holder → `PRECONDITION_FAILED`; sets `expiresAt = now`.

**idempotency** L230-243: `lookup(ref, now)` undefined when `expiresAt <= now`; `save` stringifies `response ?? null`; `purgeExpired(now)`.

**outbox** L250-278: `append(env: EventEnvelope): number` maps envelope fields to the row; `pending(consumer, types, now, limit): PendingEvent[]` (`{seq, envelope}` L245); `oldestUndelivered`; `purgeBefore(before:number)`.

**inbox** L286-306: `markDone(m, attempts)`, `markRetry(m, attempts, nextAttemptAt:number, code)`, `markDead(m, attempts, code)` also upserts a `DeadLetterRow`. `InboxMark` L280 `{consumer, envelope, now}`.

**deadLetters** L323-342: `list(consumer|undefined, limit=100)`, `get`, `requeue(consumer,eventId,now)` → needs DL row and inbox row with `status==='dead'`, else `NOT_FOUND`; resets to `retry`, `attempts:0`, due now. `purgeBefore`.

**sync** L369-404: `enqueue(EnqueueStatement)` throws `TypeError` unless `envelope.cid`/`type` are strings; `ref = cid`, state `'prepared'`. `transition(id, event: SyncEvent, patch, now)`: unknown id → `NOT_FOUND`; `syncMachine.next` undeclared → `CONFLICT_STATE {params:{state,event}}` (**[outside]** `machine/machine.ts:58`). `heads(now,limit)`, `list(q)` default limit 100.

**blobs** L467-522: `MAX_BLOB_BYTES = 5 MiB` L406; `BLOB_REF_RE = /^blob:sha256-[A-Za-z0-9_-]{43}$/` L407; `CONTENT_TYPE_RE = /^[a-z]+\/[a-z0-9.+-]{1,90}$/` L408. `blobCheck` L444-451: `PAYLOAD_TOO_LARGE {limitBytes}`; `VALIDATION_FAILED` fields `contentType/INVALID_FORMAT`, `privacy/INVALID_VALUE`, and for `kind==='sqlite'` non-P0 plaintext → `privacy/PLAINTEXT_NOT_PUBLIC`. `put` dedupes by content address and lowers stored privacy to the more public class (string `<`). `attach` → `VALIDATION_FAILED ref/INVALID_BLOB_REF` if malformed; attaching before the blob exists is allowed (`present:false`). `detach` deletes at 0 holders; encrypted deletions are pushed to `shredded()` (per-transaction list, dies on rollback). `collectOrphans(createdBefore, limit=100)`. Comment L426: bytes are "ciphertext for encrypted blobs (F08)" — **encryption of blobs is caller-side; the kernel treats bytes as opaque.**

**migrations** L524-529: passthrough.

## 5. Repositories — `repo.ts`

```ts
export function defineRepo<S extends z.ZodType, const K extends string = never>(def:{type; schema:S; indexes?; blobs?}): RepoDef<z.output<S>,K>  // L26-38
export function readRepo<T,K>(s: RepoScope, def: RepoDef<T,K>): ReadRepo<T,K>   // L141
export function writeRepo<T,K>(s: RepoScope, def: RepoDef<T,K>): Repo<T,K>      // L167
```
- `TYPE_RE = /^[a-z0-9]+\.[a-z0-9_]+$/` L20; >4 indexes throws. Slots = key order `i+1` (L36); **append, never reorder** (L23-24). Result is `Object.freeze`d.
- `RepoScope` L117-121 `{tx, tenantId, now:()=>number}`.
- `put` L171-179: `schema.safeParse` failure **throws** `Error('repo <type>: data does not match its schema')` (not a Result); idx = `indexValues` L111 (`undefined → null`); then `syncBlobRefs` L153-165 with holder `` `${def.type}/${id}` ``.
- `restore` L185-192: schema failure → `VALIDATION_FAILED data/SCHEMA_MISMATCH`; overrides `tenantId`/`type` from scope/def; `'identical'` skips blob sync.
- `query` (`runQuery` L123-139): `limit` default 50, else integer 1..500 (`MAX_LIMIT` L81) or `VALIDATION_FAILED limit/OUT_OF_RANGE`; unknown `orderBy`/`where` key → `UNKNOWN_INDEX`; cursor = `encodeText(JSON.stringify([value|null, id]))` (L138), decode failure → `cursor/INVALID_CURSOR`, null value with index ordering → `INVALID_CURSOR`. Fetches `limit+1`; `nextCursor` value is recomputed from the last item's `data` via `indexValues`, not from stored `idx`.

## 6. Scopes — `scope.ts`

`ScopeOptions` L57-64 `{tx, tenantId, clock: Clock, ids: IdGen, deliveryEligible}`. `readScope(o)` L70 → `{repo, blobs:ReadBlobs}`; `writeScope(o)` L120 → `{repo, leases, sync, blobs}`. `sync.enqueue` throws `Error('sync.enqueue: definition is not deliveryEligible')` L110; `sync.get/retry` are tenant-filtered (L104-107, L116); `blobs.shredded()` returns refs for this tenant only (L81). `recordPeerAck(tx, tenantId, destination, ref, ack, now)` L96-101: idempotent when already `peer_accepted`, `NOT_FOUND` when unknown.

## 7. Migrations — `migrations.ts`

```ts
export interface Migration { readonly id: string; readonly up: (tx: Tx, now: number) => Result<void, AppError>; } // L8-13
export async function migrationStatus(storage, list): Promise<MigrationStatus /*{applied,pending}*/>         // L28
export async function runMigrations(storage, list, clock: Clock): Promise<Result<readonly string[], AppError>> // L35-50
```
Duplicate ids throw; each migration runs in its own `storage.transaction`; skipped if `tx.migrations.list()` has the id; on success inserts `{id, checksum:'data', appliedAt: clock.iso()}` (checksum is the literal `'data'`, never computed); first `err` aborts the loop and returns it. `up` is synchronous and must be idempotent (L11). Table: `schema_migrations`, keyed by id, listed by `(appliedAt, id)` (memory-driver L281).

## 8. Machines & maintenance

`machines.ts`: `inboxMachine` L5 (`pending→done|retry|dead`, `retry→…`, `dead→retry on 'requeue'`), `syncMachine` L21 (`prepared→transport_acknowledged|peer_accepted|prepared(retry_later)|failed`, `transport_acknowledged→peer_accepted`, `failed→prepared(retry)|peer_accepted`); `SyncEvent` L34.
`maintenance.ts`: `OUTBOX_RETENTION_MS = 7 d` L12, `DEAD_LETTER_RETENTION_MS = 30 d` L14; `sweepRetention(tx, now, opts): RetentionReport` L31 (dead letters first, then outbox, then idempotency); `runRetentionSweep(storage, clock, opts)` L38.

## 9. Memory driver — `memory-driver.ts`

- `TABLES = ['records','outbox','inbox','idempotency','leases','dead_letter','sync_outbox','blobs','blob_refs','schema_migrations','meta'] as const` L22. `Change {table,key,row|undefined}` L26; `Snapshot = Partial<Record<TableName, ReadonlyArray<readonly [string, Row]>>>` L31.
- Keys: `k(...parts)` joins with `SEP='\u0001'` L39-40. records `tenant␁type␁id`; outbox `eventId`; inbox `consumer␁eventId`; idempotency `tenant␁actor␁command␁key`; leases `tenant␁resourceId`; dead_letter `consumer␁eventId`; sync_outbox `id`; blobs `tenant␁ref`; blob_refs `tenant␁ref␁holder`; schema_migrations `id`; meta `'outbox_seq'` → `{value:n}`.
- `MemoryState` L53-88 keeps secondary group sets (`groupOf` L42: records by `(tenant,type)`, inbox by consumer, blob_refs by `(tenant,ref)`).
- All ordering/filtering uses `compareUtf8` (**[outside]** `hash/canonical.ts:60`, byte-wise UTF-8). `records.query` L161-169: filter (null index never matches) → drop null order slot → `isAfter` cursor → sort `(orderValue, id)` with direction sign → slice.
- `outbox.append` L172-178 increments `meta.outbox_seq`; **keyed by `eventId`, a duplicate overwrites silently**. `pending` L180-192 blocks aggregates with a not-yet-due retry. `purgeBefore` L203-211 keeps events held by any dead letter and deletes all consumers' inbox rows for purged events.
- Journal: one module-level `journal` per driver (L315); `begin('read')` → `null` so any write throws `Error('write in a read transaction')` L145. `commit` L322-332: no-op without `persist` or with no changes; else `await persist(changesOf(state, j))` (dedup by key, final state, L299-303); on rejection `undo` (reverse order, L305-310) and rethrow. `rollback` L333 undoes.
- Blob `bytes` are copied on get/upsert (`slice()` L266/268).
- `MemoryDriverOptions` L287-293 `{snapshot?, persist?, kind?: 'memory'|'indexeddb', onClose?}`.

## 10. IndexedDB adapter — `indexeddb.ts`

```ts
export const VAULT_DB_VERSION = 1;                                                              // L16
export interface VaultLocks { request(name, {mode:'exclusive', ifAvailable:true}, cb:(lock:object|null)=>Promise<void>): Promise<unknown> } // L20-22
export function createIndexedDbDriver(db: IDBDatabase, snapshot: Snapshot, opts: IndexedDbDriverOptions = {}): StorageDriver // L113
export interface IndexedDbOptions { name; indexedDB?: IDBFactory; locks?: VaultLocks; clock?: Clock; retention?: RetentionOptions; random?: RandomFill } // L141-153
export async function openIndexedDbStorage(opts: IndexedDbOptions): Promise<Storage>           // L160-188
```
**Serialization**: one object store per `TABLES` entry, created with `createObjectStore(t)` (no keyPath → out-of-line keys, L47). Each row is stored by `store.put(c.row, c.key)` (L87) under the memory key string, structured-cloned as-is: `RecordRow.data` stays a JSON **string** inside a plain object, `idx` an array of plaintext strings/nulls, `BlobRow.bytes` a `Uint8Array`, meta `{value}`/`{token}`. `loadSnapshot` L55-68 reads every store with `getAllKeys()`+`getAll()` in one readonly tx and filters the `'writer'` key out of `meta` (L63) so it never enters the working set.

**Open sequence** L160-188: Web Lock → `openDb` (`onupgradeneeded` only creates missing stores; `onblocked` rejects) → `conn.onversionchange = close` → 16 random bytes → base64url token → `claimWriter` (puts `{token}` at `meta/'writer'`, L71-76) → `loadSnapshot` → `createStorage(createIndexedDbDriver(db, snapshot, {writer, onClose: release}))` → `runRetentionSweep` (failure → `AppErrorException`) → return. On any failure: close storage if built, else `db.close()` + `release()`.

**Web Lock**: name `` `classrup-storage:${opts.name}` `` L164, `mode:'exclusive', ifAvailable:true`; `acquireLock` L126-139 resolves a release function (held until `release()`), or `undefined` → throws `vaultBusy('vault_locked')`. `locks` defaults to `globalThis.navigator?.locks`; when absent, release is a no-op and only the fence applies (L146, L164). Release happens via driver `close` → `db.close(); opts.onClose?.()` (L118-121), i.e. on `storage.close()`.

**Writer fence** (`persist` L78-104): when `writer` is set, `'meta'` is added to the readwrite store list; inside that IDB transaction it reads `meta/'writer'`; token equal → writes changes; else sets `superseded`, `tx.abort()` → rejection mapped to `vaultBusy('vault_superseded')`. The memory driver then `undo`s the journal and rethrows, so `storage.transaction` rejects with `AppErrorException` and the working set equals the last durable state.

Error codes: `DEPENDENCY_UNAVAILABLE {dependency:'storage', reason:'vault_locked'|'vault_superseded'}` (thrown as `AppErrorException`, L24-26; **[outside]** `codes.ts:22` marks it `retryable:true`, status 503). Plain `Error`s: `'IndexedDB is not available'`, `'IndexedDB open blocked by another connection'`, `'IndexedDB request/transaction failed|aborted'`.

## 11. Where an encrypt-at-rest layer can go (facts the code imposes)

1. **Async boundary available only in the IndexedDB adapter**: `persist(changes)` (async, L78) and `loadSnapshot` (async, L55). Everything above (`DriverTx`, `Tx.records.*`, `Repo.put/get/query`) is synchronous, so a WebCrypto codec cannot sit in `DriverTx` or in `Repo` without changing those signatures. The memory working set would stay plaintext; only `Change.row` → IDB and IDB → `Snapshot` would be transformed. `createIndexedDbDriver` already wires `persist`/`onClose` through `createMemoryDriver` options (L114-122), and `IndexedDbDriverOptions` L106-110 is the natural place for a codec option.
2. **What is plaintext in a stored row**: the key string (`tenant␁type␁id`), `idx` values, `revision`, timestamps, and `data`. Query/order/cursor logic reads `idx` from the in-memory row, so encrypting `idx` at rest is compatible with queries only if it is decrypted on load.
3. **Repo-codec option**: `writeRepo.put` passes `parsed.data` to `tx.records.put` (L175) and `toStored` does `JSON.parse(row.data)` (tx.ts L100); both synchronous. `indexValues` is computed from plaintext data (L175, L188) either way.
4. **Existing pattern**: blobs carry caller-supplied ciphertext with an `encrypted` flag and `shredded()` for key deletion; **[outside]** `packages/vault/src/vault.ts:15-35` defines a `BackupCodec` with async `restoreData` used for export/import, not at-rest storage.
5. **Schema**: `VAULT_DB_VERSION = 1`; `onupgradeneeded` only adds missing stores. No format/version marker exists on rows; a migration between plaintext and ciphertext rows would need its own marker (none in these files). `migrations.ts` runs after `openIndexedDbStorage` has already loaded the snapshot and swept retention, so it cannot transform rows before load.
6. The contract suite never inspects raw IDB contents, so an at-rest codec is invisible to it; `indexeddb.test.ts` **[outside]** does read raw stores (`storeCount`, `rawOpen`).

## 12. Contract suite — `contract-suite.ts`

```ts
export type StorageFactory = () => Promise<Storage> | Storage;              // L15
export function storageContractSuite(adapter: string, factory: StorageFactory): void  // L42
```
Framework: **vitest** (`describe/it/expect/afterEach`), zod. Exported via `@classrup/kernel/testing` (**[outside]** `testing/index.ts:9`). Wiring **[outside]** `storage.contract.test.ts:11-13`:
```ts
storageContractSuite('memory', () => createMemoryStorage());
storageContractSuite('sqlite', () => openSqliteStorage({ path: ':memory:' }));
storageContractSuite('indexeddb', () => openIndexedDbStorage({ name: `vault-${++n}`, indexedDB: new IDBFactory() }));  // fake-indexeddb 6.2.6
```
Fixtures: `T0 = 2026-11-04T10:00:00.000Z` L17; `createFakeClock(T0)`, `createDeterministicIds({seed:7})` L53-54; repo `test.item` with indexes `status, price, name` (slots 1,2,3) L18-22; `env(id, aggregateId, revision, type?)` envelope builder L24-40; `scoped(tx, tenantId='tenant-a')` = `writeScope(... deliveryEligible:true)` L55. Every storage from `make()` is closed in `afterEach` (L50-52). Tests (titles carry `TEST-PS-119-09.Txx`): T01 CAS/JSON round trip (L57) and query/cursor (L81), T02 atomic rollback across stores (L115), T03 leases (L153), T04 outbox pending/DLQ requeue (L179), T05 sync heads/transitions (L207), T17 blobs ×2 (L235, L286), T09 retention ×2 (L321, L354). Assertions are exact: UTF-8 ordering (`['i1','i3','i6','i2']`), ISO timestamps, error `code`+`params`, `s.kind !== 'sqlite'` gates the plaintext-P2 case (L252).
To test a new driver: `createStorage(createYourDriver())` in a factory and call the suite from a `*.test.ts`. `DriverKind` (driver.ts L211) and `MemoryDriverOptions.kind` (L291) are closed unions; a new kind needs both widened. For IDB-based tests Node has no `navigator.locks`; `indexeddb.test.ts` **[outside]** builds a `fakeLocks(): VaultLocks` and passes `locks:`.

## 13. Public surface

`index.ts` L106-114 exports: `createStorage, createMemoryStorage, Storage, TxMode`; from tx.ts `DEFAULT_LEASE_TTL_MS` + types `DeadLetter, IdempotencyRecord, Lease, ShreddedBlob, SignedEnvelope, StoredRecord, SyncEntry, Tx`; maintenance (`runRetentionSweep, sweepRetention`, constants); `defineRepo` + repo types; `recordPeerAck` + scope types; `migrationStatus, runMigrations, Migration, MigrationStatus`; `inboxMachine, syncMachine`; types `DriverKind, DriverTx, StorageDriver, SyncState`; `createMemoryDriver`. **Not exported from core**: `createTx`, `readScope`, `writeScope`, `readRepo`, `writeRepo`, `TABLES`, `Change`, `Snapshot`, base64url helpers, `isBlobRef`, `blobRefOf`, `MAX_BLOB_BYTES`. `browser.ts` L2 exports `openIndexedDbStorage, VAULT_DB_VERSION, IndexedDbOptions, VaultLocks` only (`createIndexedDbDriver` is reachable only by path). `base64url.ts`: `bytesToBase64url` L5, `base64urlToBytes` L11, `encodeText` L21, `decodeText` L25 (fatal UTF-8 decode → `undefined`).
`KERNEL_API.md` rules L21-31: `0` creates; revision lives on the record not in `data`; ≤4 indexes, append-only; JSON only, money as decimal strings, no `bigint`; transactions serialized and non-re-entrant; blob rules; idempotency records successes only.

## 14. Pitfalls

- Programmer errors **throw** (schema mismatch in `put`, bad `expectedRevision`, bad TTL, non-serializable JSON, `enqueue` without `deliveryEligible`, write in read tx); domain failures return `Result`. Thrown errors inside `fn` roll back and rethrow.
- `Tx` is sync except `blobs.put`; `fn` may be async but must not call `storage.transaction`.
- Record JSON text is compared byte-for-byte in `restore` ('identical'); key order in `data` matters.
- `idx` is derived at write time; changing an index function does not rewrite stored `idx` (needs a data migration via `runMigrations`).
- Timestamps are ISO strings compared lexically everywhere (`expiresAt`, `occurredAt`, `createdAt`); `toIso` from `clock/clock.ts` is the only producer.
- `outbox.append` does not reject duplicate `eventId`.
- `claimWriter` runs before `loadSnapshot`; a second `openIndexedDbStorage` on the same name without Web Locks succeeds and fences the first at its next commit (not at open).
- `openIndexedDbStorage` runs the retention sweep as its first write; a superseded/failed sweep aborts the open.
- Index/order comparisons are UTF-8 byte order, not locale; cursor validity assumes stable ordering.
