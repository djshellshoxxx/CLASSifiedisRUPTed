# Design B-2 — Vault encryption at rest (adversarial / data-loss lens)

Repository `/home/user/CLASSifiedisRUPTed`, branch `claude/difficult-project-parts-dcqlup`. Paths are repo-relative; `file:line` cites current source.

## 1. Summary and scope

Every object store of a vault (`TABLES`, `packages/kernel/src/storage/memory-driver.ts:22`) holds only AEAD envelopes under keyed-pseudonymous keys. The only plaintext values are two reserved `meta` entries: the existing writer token (`storage/indexeddb.ts:17`, random, information-free) and a new **bootstrap blob** `meta/'at-rest'` (salt, passphrase-wrapped identity, wrapped data-encryption key). The in-memory working set stays plaintext; the codec sits only at `persist` (`indexeddb.ts:78-104`) and `loadSnapshot` (`indexeddb.ts:55-68`), and because `@noble/ciphers` XChaCha20-Poly1305 is synchronous the synchronous `DriverTx` (`driver.ts:146-209`) is untouched.

**MVP.** (a) `classrup.vault.at_rest/v1` bootstrap and `classrup.vault.row/v1` envelope; (b) one scrypt per unlock after migration: identity `Sealed` and DEK wrap share one salt, the wrap key is HKDF-separated from the same scrypt output; (c) migration of alpha vaults in **one** IndexedDB readwrite transaction (atomic across stores of one database; no resumable marker and no third on-disk state); (d) fail-closed open with typed errors; a sealed vault cannot be opened without the codec, a plaintext row inside a sealed vault is corruption; (e) `lock()` zeroes DEK and derived keys; (f) `classrup.vault.alpha_backup/v1` unchanged; (g) passphrase change by rewrapping without touching rows (~40 lines on the same bootstrap-write primitive); (h) no PWA change.

**Deferred.** (1) Row rollback/deletion detection: per-row AEAD cannot tell an older *valid* ciphertext from the current one; detection needs an authenticated set digest per commit, itself rollback-able without an anchor outside the browser (section 5). (2) Read-only legacy session when migration cannot complete: origin quota is freed by freeing disk, which needs no open vault, so fail closed. (3) Hiding store names and counts: padding cost without a threat. (4) Worker scrypt, unlock backoff, idle lock (PS-128 03.R01/03.R03): UI concerns. (5) Zeroizing the plaintext working set: unestablishable with JavaScript strings and GC.

## 2. Data model and on-disk formats

### 2.1 Bootstrap — `meta` store, literal key `'at-rest'`, plain object

```json
{ "format": "classrup.vault.at_rest/v1", "vaultId": "<base64url 16 random bytes>", "principal": "did:key:z6Mk…",
  "kdf": { "name": "scrypt", "N": 131072, "r": 8, "p": 1, "salt": "<base64url 16 bytes>" },
  "identity": { "format": "classrup.identity-key/v1", "principal": "did:key:z6Mk…",
    "secret": { "format": "classrup.sealed/v1", "kdf": "scrypt-131072-8-1", "cipher": "xchacha20poly1305",
      "salt": "<equals kdf.salt>", "nonce": "<24 B>", "ciphertext": "<pkcs8 + 16 B tag>" } },
  "dek": { "cipher": "xchacha20poly1305", "nonce": "<base64url 24 bytes>", "ciphertext": "<base64url 48 bytes>" },
  "createdAt": "2026-11-11T10:00:00.000Z", "sealedAt": "2026-11-11T10:00:00.000Z" }
```

Bounds: canonical JSON ≤ 16 KiB; exactly these keys; `kdf` must *equal* the pinned parameters (a larger N could exhaust memory; `identity.ts:38` caps `maxmem` at 256 MiB); `identity` passes the checks of `unlockIdentity` (`identity.ts:92-96`) and `validateSealed` (`identity.ts:19-27`); `identity.principal === principal`. DEK wrap AAD = `canonicalJson(['classrup.vault.at_rest/v1','dek', vaultId, principal, kdf])` (`hash/canonical.ts:36-38`), so vault id, principal and KDF parameters are authenticated (PS-128 01.R01, V02/V03 `mod_key/module.spec.yaml:61-62`). DEK = 32 random bytes; wrap key = `hkdf(sha256, scryptOut, undefined, 'classrup.vault.at_rest/v1;dek-wrap', 32)` (`@noble/hashes/hkdf.d.ts:70`). The identity `Sealed` uses `scryptOut` directly with the identity domain AAD exactly as `identity.ts:48,56`, so `unlockIdentity` and the backup bundle stay compatible.

### 2.2 Row envelope — every other value in every store

Stored key (out-of-line, `indexeddb.ts:47`): `storedKey = base64url(HMAC-SHA256(kIdx, canonicalJson([table, key])))` (43 chars; deterministic so `put` overwrites and `delete` hits the same slot). Stored value `{ f: 'classrup.vault.row/v1', n: Uint8Array(24), c: Uint8Array }`. Plaintext = `u32be(headerLen) ‖ header ‖ payload`; header = `JSON.stringify({ k: key, r: row })` where for `blobs` `r` is the `BlobRow` (`driver.ts:127-137`) without `bytes` and `payload` is the bytes, otherwise `payload` is empty. AAD = `canonicalJson(['classrup.vault.row/v1', vaultId, table, storedKey])`; after decryption `header.k` must re-hash to `storedKey`. Keys: `kRow = hkdf(sha256, dek, undefined, '…;row', 32)`, `kIdx = hkdf(…;'key', 32)`. Bounds: plaintext ≤ 8 MiB per row (blobs ≤ 5 MiB by `tx.ts:406`; envelopes ≤ 1 MiB); overhead 40 B + header; nonce from `crypto.getRandomValues` per encode (collision over 2^40 writes < 2^-110). Pseudonymous keys are required: record keys carry tenant DID, type and id, and blob keys are **content hashes** (`tx.ts:439-442`) that would let a reader test "does this vault hold file X".

### 2.3 Legacy layout (read-only)
Plaintext `RecordRow` at records key `'local-vault\u0001vault.identity\u0001root'` with `data` = JSON of `ProtectedIdentity` (`vault.ts:6-8,129`); all other rows plaintext. Reserved plaintext meta keys: `'writer'`, `'at-rest'`; the memory driver writes neither (`outbox_seq`, `memory-driver.ts:173-176`, is encrypted like any row).

### 2.4 On-disk states
`EMPTY` (no bootstrap, no legacy row, all counts 0 besides `writer`), `LEGACY` (legacy row, no bootstrap), `SEALED` (bootstrap), `CORRUPT` (anything else: bootstrap plus a non-envelope row, legacy row plus bootstrap, rows without either, envelope rows in a LEGACY vault, undecryptable envelope). `CORRUPT` is terminal for that database: delete site data, restore from backup.

## 3. Algorithms and state machines

**Handle (kernel)**: `closed → opened` (Web Lock `indexeddb.ts:126-139,164`, `openDb`, `claimWriter` `:71-76`, read `meta/'at-rest'`, `count()` per store) `→ loaded` (`open`/`migrate` returns `Storage`) `→ closed` (`storage.close()` releases via `onClose`, `:118-121`). Guards: `open()` without codec when a bootstrap exists → `DEPENDENCY_UNAVAILABLE {dependency:'storage', reason:'vault_sealed'}` (the no-downgrade guard; it also protects direct callers such as `tests/integration/mutiny-persistence.test.ts:52`); `open({codec})` with neither bootstrap nor `seal` → `reason:'vault_unsealed'`. No timeouts: Web Locks use `ifAvailable`, scrypt is bounded by parameters, IndexedDB transactions auto-commit.

**Vault**: `EMPTY --create|restoreBackup--> SEALED`; `LEGACY --unlock--> SEALED`; `SEALED --unlock--> SEALED`; `SEALED --changePassphrase--> SEALED`; `* --tamper--> CORRUPT` (terminal). Session: `opened --create|unlock|restore--> unlocked --lock()--> locked` (terminal; `vault.ts:95`).

**Unlock, SEALED** (one scrypt): (1) `validateBootstrap` — malformed, unknown format, wrong parameters → `SECURITY_WRAPPED_KEY_INVALID` before derivation; (2) `scryptOut = scryptAsync(pass, salt, {N:131072,r:8,p:1,dkLen:32,maxmem})` (`identity.ts:38`); (3) `openIdentityWithKek(bootstrap.identity, scryptOut)` — AEAD failure → `SECURITY_UNLOCK_FAILED` (generic on purpose, `mod_key/module.spec.yaml:88`); (4) `unwrapDek` → failure → `SECURITY_UNLOCK_FAILED`, identity locked; (5) zero `scryptOut` and wrap key; (6) `createRowCodec(dek, vaultId)`; (7) `handle.open({codec})`: `loadSnapshot` decodes every row (failure → `DEPENDENCY_UNAVAILABLE reason:'vault_corrupt'`, codec destroyed, handle closed, no session) → `runRetentionSweep` (`indexeddb.ts:177`; first encrypted commit) → `activate`. Nothing is written before step 7, so a wrong passphrase touches no data (PS-128 06.R02). Cost: scrypt 1–8 s + decrypt at ~50–150 MB/s in JS (10 MB ≈ 0.1–0.2 s) + O(rows) HMAC; memory ≈ snapshot plus transient envelopes (2–3× during load).

**Migration, LEGACY** (one scrypt, one transaction): (1) `handle.peek('records', LEGACY_KEY)` → `validateProtectedIdentity`; (2) `scrypt(pass, legacy.secret.salt)`; (3) `openIdentityWithKek` — failure → `SECURITY_UNLOCK_FAILED`, nothing written; (4) random `dek`, `vaultId`; bootstrap with `kdf.salt = legacy.secret.salt` and `identity` = legacy `ProtectedIdentity` unchanged (no re-seal; next unlock is one derivation); (5) `handle.migrate({codec, bootstrap, drop:[{table:'records', key: LEGACY_KEY}]})`: `loadSnapshot` plaintext (an envelope-shaped value here → `vault_corrupt`); one readwrite transaction over all eleven stores: fence read as `indexeddb.ts:92-97`; `meta/'at-rest'` must be absent (else abort → `vault_superseded`); for every `(table, key, row)`: `delete(key)` and, unless dropped, `put(encoded.value, encoded.storedKey)`; `put(bootstrap,'at-rest')`; `completion`. All requests are issued synchronously, so the transaction cannot auto-commit half way. Abort: `QuotaExceededError` → `DEPENDENCY_UNAVAILABLE reason:'quota_exceeded'`, fence → `vault_superseded`, other DOMExceptions rethrown; disk unchanged, vault stays LEGACY, unlock fails closed; (6) driver over the loaded snapshot minus dropped keys, sweep, activate. O(bytes) encryption + O(rows) requests; transient memory 2×.

**Create, EMPTY**: counts must be zero else `vault_corrupt('orphan_rows')`; random salt; `scryptOut`; `createProtectedIdentityWithKek(scryptOut, salt)` (mirrors `identity.ts:79-89` with the derivation lifted out); `dek`, `vaultId`, bootstrap; `handle.open({codec, seal: bootstrap})`; `handle.seal()` flushes it in one fenced transaction. Failure before the flush leaves EMPTY (PS-128 06.R01).

**Restore, EMPTY**: validation unchanged (`vault.ts:143-176`); `unlockIdentity` at `vault.ts:152` becomes `scrypt(pass, bundle.protectedIdentity.secret.salt)` + `openIdentityWithKek` (the bundle `unseal` at `:143` necessarily uses the bundle's own salt); bootstrap with that salt and a fresh DEK; `handle.open({codec, seal})`; the restore transaction (`vault.ts:178-186`, minus the identity `put`) commits and `persist` carries the pending bootstrap in the **same** IndexedDB transaction as the rows, so a failed restore leaves EMPTY rather than a sealed vault with a foreign identity and no records; zero records → `handle.seal()` afterwards (harmless if it fails).

**Pending bootstrap (kernel)**: `createIndexedDbDriver` wraps the memory driver's `commit` (`memory-driver.ts:322-332`): `await inner.commit(); if (pending) await flush()`. `persist` adds `'meta'` when `pending` is set, puts it after the changes and clears it only on completion; the early return at `memory-driver.ts:325` is why the explicit flush exists. `handle.seal()` is `raw.transaction(() => ok(undefined))` with `pending` set, so everything runs under the storage lock (`storage.ts:24-39`).

**Change passphrase**: `scrypt(current, salt)` → `unwrapDek` must succeed (else `SECURITY_UNLOCK_FAILED`); `newSalt`; `scrypt(next, newSalt)` (rule of `identity.ts:29-33`; violation → `SECURITY_PASSPHRASE_WEAK`); `rewrapIdentity` decrypts pkcs8 under the old key and re-seals under the new with a fresh nonce, zeroing in `finally`; `wrapDek`; `handle.seal(newBootstrap)` (same `vaultId`). Rows untouched; two derivations; live codec unchanged.

**Lock**: `identity.lock()` (`identity.ts:75`), `codec.destroy()` (`fill(0)` on dek, kRow, kIdx; later calls throw `SECURITY_VAULT_LOCKED`), then the existing close (`vault.ts:67-72`). `scryptOut`, wrap keys and passphrase bytes are zeroed in `finally` on every path.

## 4. Public API

### 4.1 Kernel — new `packages/kernel/src/storage/at-rest.ts` (isomorphic, no crypto)

```ts
export const AT_REST_META_KEY = 'at-rest';
export const RESERVED_META_KEYS: ReadonlySet<string>;              // 'writer', 'at-rest'
export const MAX_BOOTSTRAP_BYTES = 16 * 1024;
export interface AtRestBootstrap { readonly format: string; readonly [field: string]: unknown }
export interface EncodedRow { readonly storedKey: string; readonly value: object }
export interface DecodedRow { readonly key: string; readonly row: object }
export interface AtRestCodec {
  readonly format: string;                                         // 'classrup.vault.row/v1'
  storedKey(table: TableName, key: string): string;                // deterministic; used for deletes
  encode(table: TableName, key: string, row: object): EncodedRow;  // sync
  decode(table: TableName, storedKey: string, value: unknown): DecodedRow;
  destroy(): void;                                                 // zero keys; later calls throw
}
export function looksLikeEnvelope(value: unknown): boolean;        // plain object, string f, Uint8Array n and c
export function checkBootstrap(value: unknown): AtRestBootstrap;   // shape + size, else vaultCorrupt('meta','bootstrap')
export type CorruptDetail = 'format' | 'aead' | 'plaintext_row' | 'key_mismatch' | 'orphan_rows' | 'bootstrap';
export function vaultCorrupt(table: TableName, detail: CorruptDetail): AppErrorException;
// DEPENDENCY_UNAVAILABLE { dependency:'storage', reason:'vault_corrupt', table, detail }; never key, nonce or row bytes.
```

The kernel never sees key material: `AtRestCodec` is injected, `packages/kernel/package.json` keeps `zod` as its only dependency, and `tools/deps/deps.mjs:9-15` layering holds (identity, layer 2, imports kernel, layer 0).

### 4.2 Kernel — `packages/kernel/src/storage/indexeddb.ts`

```ts
export interface IndexedDbDriverOptions { readonly writer?: string; readonly onClose?: () => void;
  readonly codec?: AtRestCodec; readonly seal?: AtRestBootstrap }              // extends :106-110
export function createIndexedDbDriver(db: IDBDatabase, snapshot: Snapshot, opts?: IndexedDbDriverOptions): StorageDriver; // :113 unchanged
export interface IndexedDbVaultHandle {
  readonly name: string;
  readonly bootstrap: AtRestBootstrap | undefined;
  readonly rowCounts: Readonly<Record<TableName, number>>;                      // meta excludes reserved keys
  peek(table: TableName, key: string): Promise<object | undefined>;              // raw value at a literal key
  open(opts?: { readonly codec?: AtRestCodec; readonly seal?: AtRestBootstrap }): Promise<Storage>;
  migrate(opts: { readonly codec: AtRestCodec; readonly bootstrap: AtRestBootstrap;
    readonly drop?: ReadonlyArray<{ readonly table: TableName; readonly key: string }> }): Promise<Storage>;
  seal(bootstrap?: AtRestBootstrap): Promise<void>;                              // after open/migrate; fenced replace
  close(): Promise<void>;
}
export function openIndexedDbVault(opts: IndexedDbOptions): Promise<IndexedDbVaultHandle>;
export function openIndexedDbStorage(opts: IndexedDbOptions): Promise<Storage>; // unchanged = (await openIndexedDbVault(opts)).open()
```

`loadSnapshot` with a codec: every value outside reserved meta keys must satisfy `looksLikeEnvelope` and decode, else `vaultCorrupt(table, 'plaintext_row'|'format'|'aead'|'key_mismatch')`; without a codec an envelope-shaped value → `vaultCorrupt(table,'format')`. `persist` encodes each `Change` (`memory-driver.ts:26-30`) and deletes by `codec.storedKey`; a change on a reserved meta key throws a plain `Error`. `AppErrorException` from the codec passes through; anything else becomes `vaultCorrupt(table,'format')` so no library message leaks. The contract suite (`storage.contract.test.ts:11-13`) stays plaintext.

### 4.3 Kernel — `packages/kernel/src/browser.ts` (`:2`)
Add: `openIndexedDbVault`, `type IndexedDbVaultHandle`, `type AtRestCodec`, `type AtRestBootstrap`, `type TableName`, `AT_REST_META_KEY`, `looksLikeEnvelope`, `vaultCorrupt`.

### 4.4 Identity — new `packages/identity/src/at-rest.ts` (`@noble/*` 2.4.0 already pinned there)

```ts
export const AT_REST_FORMAT = 'classrup.vault.at_rest/v1'; export const ROW_FORMAT = 'classrup.vault.row/v1';
export const vaultErrors = defineErrors({ SECURITY_UNLOCK_FAILED: { status: 401, retryable: false },
  SECURITY_WRAPPED_KEY_INVALID: { status: 422, retryable: false }, SECURITY_VAULT_LOCKED: { status: 403, retryable: false },
  SECURITY_PASSPHRASE_WEAK: { status: 422, retryable: false } });            // app-error.ts:59-70; mod_key spec :86-92
export class VaultError extends AppErrorException { constructor(error: AppError, message: string) }
export interface VaultBootstrap extends AtRestBootstrap { /* shape of 2.1 */ }
export function validateBootstrap(input: unknown): VaultBootstrap;            // SECURITY_WRAPPED_KEY_INVALID
export function validateProtectedIdentity(input: unknown): ProtectedIdentity; // identity.ts:92-96 checks
export function deriveKek(passphrase: string, salt: Uint8Array): Promise<Uint8Array>;   // identity.ts:29-40
export function openIdentityWithKek(p: ProtectedIdentity, scryptOut: Uint8Array): Promise<UnlockedIdentity>;
export function createProtectedIdentityWithKek(scryptOut: Uint8Array, salt: Uint8Array): Promise<{ identity: UnlockedIdentity; protectedIdentity: ProtectedIdentity }>;
export function rewrapIdentity(p: ProtectedIdentity, oldKek: Uint8Array, newKek: Uint8Array, newSalt: Uint8Array): Promise<ProtectedIdentity>;
export function dekAad(b: Pick<VaultBootstrap, 'vaultId' | 'principal' | 'kdf'>): Uint8Array;
export function wrapDek(dek: Uint8Array, scryptOut: Uint8Array, aad: Uint8Array): VaultBootstrap['dek'];
export function unwrapDek(w: VaultBootstrap['dek'], scryptOut: Uint8Array, aad: Uint8Array): Uint8Array;
export function createRowCodec(dek: Uint8Array, vaultId: string): AtRestCodec & { readonly vaultId: string };
export function newBootstrap(i: { identity: ProtectedIdentity; dek: Uint8Array; scryptOut: Uint8Array; salt: Uint8Array; vaultId?: string; now: string }): VaultBootstrap;
```

`identity.ts` is untouched; the helper duplicates the domain constant `identity.ts:8` and the pkcs8 import/self-test (`identity.ts:100-105`); test 3 proves equivalence with `unlockIdentity`/`createIdentity`. The single cross-slice touch: **one appended line** `export * from './at-rest.ts';` in `packages/identity/src/index.ts` (slice C), because `packages/identity/package.json` exports only `"."` and `deps.mjs` refuses relative imports across packages.

### 4.5 Vault — `packages/vault/src/vault.ts`

```ts
export interface VaultOptions extends IndexedDbOptions { readonly codecs?: readonly BackupCodec[] }          // :35 unchanged
export interface UnlockedVault { principal; identity; storage; lock(); exportBackup(passphrase);
  changePassphrase?(current: string, next: string): Promise<void> }                                        // :36-44 + optional
export interface Vault { isInitialized(); create(p); unlock(p); restoreBackup(input, p); close();
  atRest(): Promise<'empty' | 'legacy' | 'sealed' | 'unencrypted'> }                                        // :45-51 + status
export function openVault(options: VaultOptions): Promise<Vault>;      // :53 unchanged; = vaultFromHandle(await openIndexedDbVault(...))
export function vaultFromHandle(handle: IndexedDbVaultHandle, codecs?: readonly BackupCodec[]): Vault;      // new
export function vaultFromStorage(raw: Storage, codecs?: readonly BackupCodec[]): Vault;  // :59 unchanged: unencrypted seam, legacy layout
```

Internally a `Backend` seam (`status`, `create`, `unlock`, `restore`, `changePassphrase?`) with `handleBackend` (sealed) and `storageBackend` (today's code, verbatim, for the memory seam of `vault.test.ts:29-33`). `activate` (`vault.ts:79-121`) is shared; `exportBackup` is unchanged except `protectedIdentity` comes from the bootstrap. `isInitialized` = `bootstrap !== undefined || peek(legacy) !== undefined`. Errors are `VaultError`; the wrong-passphrase message stays `'Incorrect passphrase or damaged encrypted data'` so `tests/browser/alpha.spec.ts:91` and the PWA `report()` (`apps/pwa/src/main.ts:42-46`) keep working; `main.ts:128-196` needs no change.

**Compatibility.** Alpha vault → first unlock migrates. Alpha bundle → restores into a sealed vault (its `protectedIdentity` reused as-is). Sealed vault → same bundle format, readable by the alpha code. Memory seam unchanged. Direct `openIndexedDbStorage` on a sealed name → `vault_sealed`, never garbage.

## 5. Threat model and failure handling

| # | Case | Outcome (fail closed; nothing written unless stated) |
|---|---|---|
| 1 | Copy of IndexedDB files, no passphrase | Visible: store names, counts, 43-char pseudonyms, ciphertext lengths, bootstrap (principal, salt, pinned KDF), writer token. Hidden: ids, types, tenant, timestamps, blob hashes, all values. One scrypt (N=2^17, ~128 MiB) per guess |
| 2 | Flipped ciphertext or tag byte | AEAD fails in `loadSnapshot` → `DEPENDENCY_UNAVAILABLE vault_corrupt {table, detail:'aead'}`; codec destroyed; handle closed |
| 3 | Row moved between keys or tables; row copied from another vault (even same principal restored twice) | AAD binds `[format, vaultId, table, storedKey]` → `aead` |
| 4 | Plaintext row or legacy identity row injected into a sealed vault | not envelope-shaped → `plaintext_row`; the legacy probe is ignored once a bootstrap exists |
| 5 | Bootstrap deleted | rows without bootstrap/legacy → `atRest()='empty'`, `rowCounts>0` → `create`/`restore` refuse (`orphan_rows`); the user cannot be tricked into overwriting |
| 6 | Bootstrap replaced by attacker's | user's passphrase → `SECURITY_UNLOCK_FAILED`; rewriting every row too would require the passphrase already |
| 7 | Bootstrap with N=1024, unknown format, extra keys, salt or principal mismatch | `SECURITY_WRAPPED_KEY_INVALID` before derivation (V02) |
| 8 | Wrong passphrase, sealed or legacy | `SECURITY_UNLOCK_FAILED`; zero writes; retry allowed |
| 9 | Interrupted migration (tab closed, crash, quota) | one transaction: disk is entirely LEGACY or entirely SEALED; quota → `quota_exceeded`, unlock fails, retry after freeing disk |
| 10 | Two tabs | Web Lock (`indexeddb.ts:164`) refuses the second open (`vault_locked`); without Web Locks the fence in `persist`, `migrate`, `seal` aborts the older tab (`vault_superseded`) and its working set is undone (`memory-driver.ts:328-330`) |
| 11 | Failed encrypted commit | undo journal restores the working set (PS-119 06.R02; `indexeddb.test.ts:79-101` extended) |
| 12 | Lock during an awaited write | existing guard (`vault.ts:82-89`) rejects; codec destroyed, so a late `persist` throws `SECURITY_VAULT_LOCKED` rather than writing with zeroed keys |
| 13 | **Rollback of one row to an older valid ciphertext** | **Not detected.** The old envelope was made with the same key under the same AAD; AEAD cannot tell "older" from "current", and a commit counter in the AAD does not help (the old row carries its own consistent old counter). Only an authenticated set digest (Merkle root over `(storedKey, nonce)` or a commit journal) in the bootstrap would detect it, and it is rollback-able with the rows unless anchored outside the browser. Consequence: a consumed idempotency row, expired lease, withdrawn revision or released blob reference can be revived offline; CAS (`tx.ts:113-118`) prevents concurrent-writer confusion, not this rewind |
| 14 | Row deletion; whole-database rollback; bootstrap rollback to an older passphrase wrap | Not detected (same reason); a passphrase change does not revoke an older copy |
| 15 | Malicious extension at runtime | out of scope: same-origin code reads the plaintext working set and keys; CSP/SRI per PS-128 T02 |
| 16 | Unknown `f` or bootstrap format | rejected, never guessed (PS-128 10.R02); an older alpha client would load envelopes as rows and misbehave, decrypting nothing |
| 17 | Clock | not used by this layer; `createdAt`/`sealedAt` informational |
| 18 | Resource bounds | row plaintext ≤ 8 MiB (`PAYLOAD_TOO_LARGE` on encode), bootstrap ≤ 16 KiB; all rows decrypted at open; practical vault ~200 MB (memory 2–3×, 1–4 s decode) |
| 19 | Key material in errors/logs | codec errors carry `table` and `detail` only; `VaultError.message` is a fixed sentence; test 14 asserts no key or nonce bytes in `JSON.stringify(error)`; retention logs unchanged (PS-119 07.R01) |

This layer rejects, never freezes: freezing is a domain concept needing readable state. `DEPENDENCY_UNAVAILABLE` inherits `retryable:true` (`codes.ts:22`), wrong for `vault_corrupt`; `PLATFORM_STORE_MIGRATION_DRIFT` (`codes.ts:33`) was rejected because its spec meaning is kernel-migration drift; the README states `vault_corrupt` is resolved only by restore.

## 6. Test plan

Spec rows appended after PS-128 T15 (`mod_key/module.spec.yaml:169`) and PS-119 T17 (`mod_storage/module.spec.yaml:325`):

- PS-128 `T16 | integration | 01.R01,02.R02,10.R03 | alpha vault with plaintext identity record and rows unlocked once | all rows and the identity re-wrapped under one bootstrap in one transaction; second unlock does one scrypt; raw IndexedDB holds no plaintext row`
- PS-128 `T17 | abuse | 01.R01,02.R03,07.R01 | flipped byte, row moved, row from another vault, plaintext row injected, bootstrap with N=1024 or unknown format | open fails closed with one typed code per case; no key, nonce or row bytes in errors`
- PS-128 `T18 | property | 01.R01,06.R02 | random tables, keys, rows; single-bit change to value, key, table or vault id | exact round trip; every change rejected; nonces unique`
- PS-128 `T19 | chaos | 06.R01,06.R02,03.R01 | wrong passphrase; quota or supersession during migration; lock mid-session | nothing written; vault entirely plaintext or entirely sealed; keys zeroed and SECURITY_VAULT_LOCKED afterwards`
- PS-128 `T20 | integration | 10.R01,10.R02,10.R03 | export from sealed vault, restore, change passphrase | alpha_backup/v1 round trip; restored vault sealed with fresh DEK; rewrap leaves rows byte-identical, old passphrase fails`
- PS-119 `T18 | integration | 01.R03,06.R02,10.R01 | IndexedDB adapter with injected codec | rows round-trip identically; raw stores hold only envelopes under pseudonymous keys; failed encrypted commit restores the working set; sealed vault without codec refused`

Files: `packages/kernel/src/storage/at-rest.test.ts`, additions to `indexeddb.test.ts`, adaptations in `packages/vault/src/vault.test.ts`, `tests/integration/vault-encryption.test.ts`, `tests/integration/vault-encryption-codec.test.ts` (fast-check 4.10.2, `import fc from 'fast-check'` as `machine/machine.test.ts:1`). A `tamper(factory, name, fn)` helper opens the database raw (`indexeddb.test.ts:54-60`).

1. Unit, kernel, `TEST-PS-119-09.T18`: `checkBootstrap` rejects arrays, prototypes, missing `format`, > 16 KiB; `looksLikeEnvelope` accepts `{f,n,c}` only.
2. Unit, kernel, T18: new handle → `bootstrap undefined`, counts zero; plaintext `open()` equals `openIndexedDbStorage`; contract suite green on all adapters.
3. Unit, identity, `TEST-PS-128-09.T16`: `createProtectedIdentityWithKek` output unlocks via `unlockIdentity(p, passphrase)` with identical signatures; `openIdentityWithKek` on `createIdentity` output matches `unlockIdentity`; DEK wrap round trip; flipped AAD field → `SECURITY_UNLOCK_FAILED`.
4. Unit, identity, `TEST-PS-128-09.T04`: bootstrap with N=1024, `r=1`, unknown format, extra key, `secret.salt !== kdf.salt`, principal mismatch → `SECURITY_WRAPPED_KEY_INVALID`; a spy proves scrypt never ran.
5. Property, `TEST-PS-128-09.T18`: `fc.record` of table ∈ `TABLES`, unicode key ≤ 512 chars (including `\u0001`), JSON-safe row (blobs with `bytes` ≤ 64 KiB) → `decode(encode(...))` deep-equals; `storedKey` deterministic and distinct per `(table,key)`; 10 000 encodes give distinct nonces.
6. Property, T18: sampled single-bit flips in `c` (32 positions plus tag), another `table`, another `storedKey`, another `vaultId`, changed `f` → `vault_corrupt` with `detail` ∈ {aead, format}; no partial data.
7. Integration, kernel, T18: 50 record/outbox/blob rows through a codec driver; raw open shows only `{f,n,c}` values, no key containing `\u0001`, no value containing `'private'`; reopen with codec → equal working set; without → `vault_sealed`.
8. Integration, kernel, T18: QuotaExceededError on an encrypted commit (as `indexeddb.test.ts:79-98`) → working set restored, next commit persists.
9. Integration, vault, `TEST-PS-128-09.T16`: alpha vault built with today's layout (plaintext identity record, 20 records, 2 blobs, outbox via `openIndexedDbStorage`); `openVault().unlock` reads everything; raw stores hold only envelopes and `at-rest`; legacy key absent; scrypt spy = 1 on this and on the next unlock.
10. Integration, vault, T16: `atRest()` `legacy` → `sealed`; `isInitialized` true before and after.
11. Integration, vault, `TEST-PS-128-09.T19`: wrong passphrase on LEGACY and SEALED → `SECURITY_UNLOCK_FAILED`; raw stores byte-identical before and after; message matches `/Incorrect passphrase|damaged/`.
12. Chaos, vault, T19: proxy throws `QuotaExceededError` on the migration transaction → `quota_exceeded`; raw stores unchanged (plaintext, no `at-rest`); un-inject → migration succeeds.
13. Chaos, vault, T19: migration under `grantsEveryone` locks after a newer writer claim → `vault_superseded`, nothing written.
14. Abuse, vault, `TEST-PS-128-09.T17`: on fresh copies: flip a byte; swap two values; move a value to `outbox`; copy a row from a second sealed vault of the same principal; add a plaintext `RecordRow`; add the legacy identity row; delete `at-rest` then `create` → details {aead, aead, aead, aead, plaintext_row, plaintext_row, orphan_rows}; no session exists; `JSON.stringify(error)` contains no key or nonce encoding.
15. Integration, vault, T19: after `lock()`, `codec.encode` → `SECURITY_VAULT_LOCKED`; key arrays all zero; `identity.sign` rejects (`vault.test.ts:23`).
16. Integration, vault, `TEST-PS-128-09.T20`: `exportBackup` of a sealed vault lacks record text; restore into a new name → sealed, different `vaultId`, records readable; restore into `vaultFromStorage(createMemoryStorage())` still works; a hand-crafted alpha bundle (`alpha-security.test.ts:236-241`) restores.
17. Integration, vault, T20: `changePassphrase`: row values byte-identical; old passphrase → `SECURITY_UNLOCK_FAILED`; new unlocks with one scrypt; weak new passphrase → `SECURITY_PASSPHRASE_WEAK`, bootstrap unchanged.
18. Integration, vault, T19 (06.R01): `create` with the bootstrap flush aborted → rejects, `isInitialized` false, counts zero; retry succeeds.
19. Integration, vault, T20: `restoreBackup` whose restore transaction fails (`CONFLICT_REVISION` injected via a codec `restoreData` hook) → `isInitialized` false, no `at-rest`, no rows.
20. Negative, kernel, T18: `persist` change on `meta/'writer'` or `'at-rest'` throws; `open({codec})` without bootstrap or `seal` → `vault_unsealed`.
21. Regression: existing `indexeddb.test.ts`, `vault.test.ts`, `alpha-security.test.ts`, `mutiny-persistence.test.ts` unchanged and green; `deps:check` 0 errors; `spec:check` 0 errors, no new warnings.
22. Documented limit: an older valid ciphertext restored into one slot opens successfully with the old revision, asserted on purpose with a comment to section 5 row 13 so any future detection must flip this test.

## 7. Open questions resolved

1. **Where does the cipher live?** `packages/identity/src/at-rest.ts`; the kernel gets an injected `AtRestCodec`. Kernel has no noble dependency and must stay layer 0; vault has none either; identity already pins both libraries.
2. **Sync or async codec?** Sync: `xchacha20poly1305` (`@noble/ciphers/chacha.d.ts:218`) and `hmac` (`@noble/hashes/hmac.d.ts:49`) are synchronous, so all requests of one IndexedDB transaction are issued without awaits (an await lets it auto-commit). WebCrypto AES-GCM rejected for that and its 12-byte nonce.
3. **One scrypt per unlock?** Shared salt for identity `Sealed` and DEK wrap, HKDF-separated wrap key; migration reuses the legacy salt so the identity is not re-sealed; create and restore seal the identity under a caller-supplied derivation.
4. **Atomic or resumable migration?** Atomic single transaction: IndexedDB gives cross-store atomicity; a marker scheme adds a third on-disk state and the "half-plaintext accepted later" risk. Limit: transaction size equals vault size.
5. **Plaintext keys?** No, HMAC pseudonyms: keys leak blob content hashes and ids; one HMAC per change.
6. **Vault identifier in AAD?** Random `vaultId`, not the principal: a principal may own several databases (original and restored) and rows must not move between them.
7. **Error for corrupted rows?** `DEPENDENCY_UNAVAILABLE {reason:'vault_corrupt'}` (permitted by the task), distinct from `SECURITY_UNLOCK_FAILED` so users are not told to retry a passphrase already proven correct.
8. **Plaintext session when migration cannot complete?** No; fail closed, otherwise encryption becomes optional and silent.
9. **Passphrase change?** Included, API only; no PWA UI in this slice.
10. **Who touches `identity/src/index.ts`?** One appended line in the merge step (4.4).
11. **Does `vaultFromStorage` encrypt?** No; it is the unencrypted memory seam and says so via `atRest()`; production goes through `openVault`.

## 8. Honest limits

- Rollback, deletion and whole-database restore of ciphertext are undetectable (section 5, rows 13–14); a passphrase change does not revoke old copies. The alpha has no anchor outside the browser to fix this.
- Metadata leaks: store names, row counts, ciphertext sizes, the principal and salt in the bootstrap, write timing.
- Memory: the plaintext working set, decoded strings and noble's internal buffers are not zeroized; only key arrays are. Same-origin code or a compromised extension reads everything while unlocked.
- Scale: the whole vault is decrypted at open and migrated in one transaction; beyond ~200 MB this is impractical, and a quota-limited device may be unable to migrate (fails closed, retry after freeing space).
- No unlock backoff, Worker derivation or idle lock (PS-128 UI requirements).
- An older alpha client cannot read a sealed vault and may misbehave rather than fail cleanly.
- Not audited; `@noble/ciphers` 2.x has no third-party audit (PS-128 T05). The README will claim only: confidentiality and integrity of individual stored values against an offline reader without the passphrase, and fail-closed detection of modification, substitution and plaintext injection.
