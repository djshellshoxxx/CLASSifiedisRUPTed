# Design B-1 — Private-record encryption at rest for the browser vault

Lens: applied cryptography engineering (key hierarchy, nonce/AAD discipline, KDF reuse, downgrade/rollback resistance, memory hygiene). Repository `/home/user/CLASSifiedisRUPTed`; `file:line` cites current source.

## 1. Summary and scope

Every IndexedDB object store of a vault (`TABLES`, `packages/kernel/src/storage/memory-driver.ts:22`) is stored as opaque `(HMAC-named key → XChaCha20-Poly1305 ciphertext)` pairs. The only plaintext left is `meta/'writer'` (the fence token, `indexeddb.ts:17,71-76`) and a new `meta/'bootstrap'` document carrying the KDF salt, the wrapped data-encryption key (DEK) and the wrapped Ed25519 signing key. The memory working set stays plaintext; transformation happens only at the two async seams the map names: `persist(changes)` (`indexeddb.ts:78-104`) and `loadSnapshot` (`indexeddb.ts:55-68`).

Key hierarchy (one scrypt per unlock after migration):

```
passphrase ─scrypt(N=2^17,r=8,p=1,salt16)─▶ ikm(32)
ikm ─HKDF-SHA256(info="classrup.vault.bootstrap/v1:kek")─▶ KEK ─unwraps─▶ DEK(32)  [AAD = bootstrap header]
DEK ─HKDF(":row")─▶ k_row (row AEAD)   DEK ─HKDF(":name")─▶ k_name (HMAC row names)   DEK ─HKDF(":identity")─▶ k_id (pkcs8 wrap)
ikm (raw) ─▶ alpha `classrup.sealed/v1` interop only (identity.ts:8,36-40)
```

MVP: (a) kernel `at-rest.ts` (row format, AAD, framing, sealed adapter, two-phase container with an atomic 1→2 schema upgrade); (b) identity `key-material.ts` (DEK/KEK/HKDF, wraps, cipher, error registry); (c) vault create/unlock/restore/export rewired, forward migration of alpha vaults on first successful unlock, passphrase change by DEK re-wrap; (d) tests and appended spec rows. Deferred, each justified: **DEK rotation** (re-encrypting all rows under a new keyId needs a resumable job; confidentiality does not need it and signing-key rotation belongs to slice C); **global rollback/deletion detection** (a sealed per-commit manifest of `(name, nonce)` costs O(rows) per commit or a hash tree; §5 states exactly what is and is not detected); **unlock backoff and idle auto-lock** (PS-128 03.R03, session policy; scrypt already costs ≥1 s per guess); **Web Worker KDF** (latency only); **sealing the plaintext `openIndexedDbStorage` path** (kernel-only callers and contract tests keep it; a sealed database refuses that opener by schema version).

## 2. Data model and on-disk formats

### 2.1 Schema version as the downgrade guard
`SEALED_VAULT_DB_VERSION = 2` is added beside `VAULT_DB_VERSION = 1` (`indexeddb.ts:16`, kept for `rawOpen`, `indexeddb.test.ts:54-60`). Invariant: **a version-1 database is plaintext (alpha or empty); a version-2 database is sealed and always holds `meta/'bootstrap'`**. The alpha client opens with `factory.open(name, 1)` (`indexeddb.ts:45`) and gets `VersionError` on a v2 database, so an old client can never read, "create over" or sweep (`runRetentionSweep`, `indexeddb.ts:177`) a sealed vault. The plaintext opener keeps version 1 and maps `VersionError` to `DEPENDENCY_UNAVAILABLE {dependency:'storage', reason:'db_version'}`; versions ≥3 are refused the same way.

### 2.2 Bootstrap document — `meta/'bootstrap'` (plaintext JSON, ≤ 4096 bytes)
```json
{ "format": "classrup.vault.bootstrap/v1",
  "principal": "did:key:z6Mk…",
  "kdf": { "name": "scrypt", "N": 131072, "r": 8, "p": 1, "salt": "<base64url 16>" },
  "cipher": "xchacha20poly1305",
  "keyId": "<base64url 16 random bytes>",
  "identity": { "nonce": "<base64url 24>", "ciphertext": "<base64url 64>" },
  "dek":      { "nonce": "<base64url 24>", "ciphertext": "<base64url 48>" },
  "migratedFrom": "classrup.identity-key/v1" | null,
  "createdAt": "RFC3339 ms", "rewrappedAt": "RFC3339 ms" }
```
Validation before any derivation (PS-128 V02): exact lengths (salt 16, nonces 24, `dek.ciphertext` 48 = 32 + tag, `identity.ciphertext` 64 = 48-byte pkcs8 Ed25519 + tag), exact KDF parameters (the `validateSealed` policy, `identity.ts:24-25`), `principal` parsed by `publicKeyFromDid` (`packages/security/src/cryptography/index.ts:29-39`), sorted key set equal to exactly these ten names. Failure → `SECURITY_WRAPPED_KEY_INVALID {reason}`.

**DEK wrap AAD** = UTF-8 of `canonicalJson(bootstrap minus "dek")` (`packages/kernel/src/hash/canonical.ts:36`): salt, KDF parameters, keyId, identity wrap and `migratedFrom` are all authenticated by the KEK. **Identity wrap AAD** = `"classrup.vault.bootstrap/v1:identity" ‖ 0x00 ‖ keyId(16) ‖ 0x00 ‖ principal`; after unwrap the pkcs8 key is imported non-extractable and a random challenge is signed and verified against the principal's public key (as `identity.ts:100-104`).

### 2.3 Sealed row — one IndexedDB entry per working-set row
IndexedDB key: `name = HMAC-SHA256(k_name, table ‖ 0x00 ‖ key)` as 43-char base64url (`bytesToBase64url`, `base64url.ts:5`), so record IDs, tenant DIDs, consumer names, idempotency keys and event IDs are neither readable nor confirmable without the passphrase. Value (structured clone): `{ f: 'classrup.vault.row/v1', s: Uint8Array }` with `s = nonce(24) ‖ ciphertext ‖ tag(16)`. Plaintext frame: `0x01 ‖ u16be(len key) ‖ key ‖ u32be(len json) ‖ json ‖ tail`; `json = JSON.stringify(row)`, except for `blobs` where `json` omits `bytes` and `tail` is the raw bytes (`BlobRow`, `driver.ts:127-137`, ≤ 5 MiB per `tx.ts:406`). Frame bound 16 MiB; non-empty `tail` outside `blobs` → `at_rest_format`.

**Row AAD** = `"classrup.vault.row/v1" ‖ 0x00 ‖ table ‖ 0x00 ‖ keyId(16) ‖ 0x00 ‖ name(32)`, binding format version, table, vault/key identifier and slot. After decryption the frame's `key` is re-named and must equal the slot name (defense in depth).

Reserved plaintext meta keys: `'writer'`, `'bootstrap'`. Every other meta row (today only `outbox_seq`, `memory-driver.ts:173-175`) is sealed; the memory driver never sees the reserved keys because `loadSnapshot` filters them (as `indexeddb.ts:63` does for `writer`).

### 2.4 Unchanged and seam formats
`classrup.sealed/v1` (`identity.ts:10-17`), `classrup.identity-key/v1` (`identity.ts:61`) and `classrup.vault.alpha_backup/v1` (`vault.ts:113,149`) are produced and consumed exactly as today; exports stay restorable by the alpha client. The alpha record `vault.identity/root` (`vault.ts:6-8`) is read only from version-1 databases and removed by the migration transaction. `vaultFromStorage(raw)` (`vault.ts:59`) keeps working through a `MemoryBackend` that stores the same bootstrap as record `{tenant:'local-vault', type:'vault.bootstrap', id:'root'}` with unsealed rows (documented test seam), so `vault.test.ts:29-34` passes unchanged.

## 3. Algorithms and state machines

### 3.1 Container states (per database)
```
empty(v1, no rows) ─create/restore─▶ sealed(v2)       plaintext(v1, alpha identity row) ─unlock+migrate─▶ sealed(v2)
sealed(v2) ─unlock|changePassphrase─▶ sealed(v2)       any ─(blocked|quota|encode failure during upgrade)─▶ unchanged
```
`sealed` is absorbing. Guards: the upgrade runs only after the passphrase proved itself (identity unwrapped, challenge verified); `onblocked` → `vault_locked`; the writer token is re-checked inside the upgrade transaction. No timeouts: the upgrade is one IndexedDB `versionchange` transaction that either commits (version 2) or aborts (version stays 1). No persisted "migrating" marker exists, so no half-plaintext vault can ever be accepted later.

### 3.2 Atomic migration/initialization inside `onupgradeneeded` (1 → 2)
Every step is a synchronous IndexedDB request callback (noble and the memory driver are synchronous; nothing is awaited), so the transaction never goes inactive:
1. `meta.get('writer')` must equal our token, else `abort()` → `vault_superseded`.
2. For each store: `getAllKeys()` + `getAll()` (`writer` skipped).
3. `createMemoryDriver({ snapshot, persist: capture })` (`memory-driver.ts:312`), `createTx(driver.begin('write'))` (`tx.ts:531`), run the caller's `stage(tx)`; `driver.commit()` calls `persist` synchronously before its first `await` (`memory-driver.ts:325-327`), so `captured: Change[]` is complete on return. `err` → `rollback()`, `abort()`.
4. Final rows = v1 rows overlaid with `captured`; each → frame → `cipher.seal(frame, aad)`; name → key.
5. `clear()` every store, `put` every sealed row, re-`put` `{token}` at `writer`, `put` bootstrap. Completion ⇒ version 2; the plaintext rows from step 4 become the working set (no second read).
Complexity O(bytes) AEAD + O(rows) HMAC; memory peak ≈ plaintext rows + sealed copies of the largest store. A 10 000-record, ~10 MiB vault migrates in well under a second of CPU; blobs (≤ 5 MiB each) dominate.

### 3.3 Unlock of a sealed vault (exactly one scrypt)
`validateBootstrap` → `ikm = scryptAsync(pass, salt, {N:131072, r:8, p:1, dkLen:32, maxmem:256 MiB})` (`identity.ts:38`) → `KEK = hkdf(sha256, ikm, undefined, info, 32)` → `xchacha20poly1305(KEK, dek.nonce, aad).decrypt` → failure: zero `ikm, KEK`, throw `SECURITY_UNLOCK_FAILED` (generic, nothing written) → derive `k_row, k_name, k_id` → unwrap pkcs8 → non-extractable import → challenge verify → zero pkcs8, ikm, KEK → `container.attach(cipher)`: decode every row (first failure → zero keys, `DEPENDENCY_UNAVAILABLE at_rest_*`, no `Storage` returned) → `createStorage(createIndexedDbDriver(db, snapshot, {writer, cipher, onClose}))` → `runRetentionSweep` (`maintenance.ts:38`, first sealed write) → `activate`.

### 3.4 Unlock of an alpha (v1) vault — the migration unlock
Read `vault.identity/root` → validate `ProtectedIdentity` and `validateSealed` (`identity.ts:19-27`) → `ikm = scrypt(pass, secret.salt)` → `openAlphaSecret(ikm, secret)` = `xchacha20poly1305(ikm, nonce, DOMAIN).decrypt` with `DOMAIN` equal to `identity.ts:8` (wrong passphrase → `SECURITY_UNLOCK_FAILED`, nothing written) → challenge verify → `DEK(32), keyId(16)` from `crypto.getRandomValues` → **reuse `secret.salt` and `ikm`** (`KEK = HKDF(ikm)`), so the migration unlock also costs one scrypt → bootstrap with `migratedFrom:'classrup.identity-key/v1'` → §3.2 with `stage = tx => tx.records.remove('local-vault','vault.identity','root', stored.revision)` (`tx.ts:145`) → sweep → activate.

### 3.5 Create, restore, export, passphrase change, lock
- **create**: version 1 and no identity row (else `'Vault already exists'`); passphrase policy of `identity.ts:29-34`; `generateKey('Ed25519', extractable)` → pkcs8 + raw public → `didFromPublicKey` (`security/cryptography/index.ts:20`) → non-extractable import → fresh salt → one scrypt → bootstrap → §3.2 without stage. Atomic (PS-128 06.R01).
- **restoreBackup**: validation as `vault.ts:140-176`; `unseal(bundle)` (scrypt 1) → `scrypt(pass, protectedIdentity.secret.salt)` + `openAlphaSecret` (scrypt 2) → bootstrap with that salt/ikm (no third derivation) → §3.2 with `stage = tx => tx.records.restore(record, idx)` per record (`tx.ts:161`). Failure leaves version 1 and `isInitialized() === false` (`alpha-security.test.ts:189-190`).
- **exportBackup(pass)**: `ikm = scrypt(pass, bootstrap.kdf.salt)` → KEK → unwrap DEK, `equalBytes` with the session DEK (constant time, `@noble/ciphers/utils.js`) else `SECURITY_UNLOCK_FAILED` → unwrap pkcs8 under `k_id` → `protectedIdentity = {format:'classrup.identity-key/v1', principal, secret: sealAlphaSecret(ikm, salt, pkcs8)}` (no KDF) → zero → records, manifest and `seal` exactly as `vault.ts:102-116` (scrypt 2). Same two derivations as today; the bundle now reflects the current passphrase.
- **changePassphrase(current, next)**: scrypt(current) → unwrap and compare DEK → fresh salt → scrypt(next) → KEK' → re-wrap DEK with a fresh nonce and the new header as AAD (`rewrappedAt` updated) → `writeBootstrap` (one readwrite transaction on `meta` under the writer fence). Rows and keyId untouched.
- **lock()**: `active = false`, `identity.lock()`, `storage.close()` (drains the serialized lock, `storage.ts:82-87`), then `cipher.destroy()` zeroes DEK-derived keys; an in-flight commit either completes or is rolled back by the guard (`vault.ts:87`), never half-sealed.

## 4. Public API

### 4.1 Kernel — `packages/kernel/src/storage/at-rest.ts` (new, no crypto dependency)
```ts
export const ROW_FORMAT = 'classrup.vault.row/v1';
export const MAX_FRAME_BYTES = 16 * 1024 * 1024;
export type AtRestReason = 'at_rest_integrity' | 'at_rest_format' | 'at_rest_plaintext' | 'db_version';
export interface AtRestCipher {
  readonly keyId: Uint8Array;                                        // 16 bytes, bound into every AAD
  seal(plaintext: Uint8Array, aad: Uint8Array): Uint8Array;          // fresh 24-byte nonce ‖ ct ‖ tag
  open(sealed: Uint8Array, aad: Uint8Array): Uint8Array | undefined; // undefined on any authentication failure
  name(input: Uint8Array): Uint8Array;                               // deterministic keyed 32-byte name
  destroy(): void;                                                   // zeroes key material; later calls throw
}
export interface SealedValue { readonly f: typeof ROW_FORMAT; readonly s: Uint8Array }
export function rowName(cipher: AtRestCipher, table: TableName, key: string): string;
export function sealRow(cipher: AtRestCipher, table: TableName, key: string, row: object): { readonly idbKey: string; readonly value: SealedValue };
export function openRow(cipher: AtRestCipher, table: TableName, idbKey: string, value: unknown): { readonly key: string; readonly row: object } | { readonly reason: AtRestReason };
export function atRestFailure(reason: AtRestReason, table?: TableName): AppErrorException; // DEPENDENCY_UNAVAILABLE {dependency:'storage', reason, table}
```
`openRow` classifies: value without `f` → `at_rest_plaintext`; wrong `f`, `s` not a `Uint8Array`, `s.length < 40`, oversize or bad framing → `at_rest_format`; AEAD or name mismatch → `at_rest_integrity`.

### 4.2 Kernel — `packages/kernel/src/storage/indexeddb.ts` (additions; existing exports unchanged)
```ts
export const SEALED_VAULT_DB_VERSION = 2;
export interface IndexedDbDriverOptions { readonly writer?: string; readonly onClose?: () => void; readonly cipher?: AtRestCipher }
export interface SealedVaultContainer {
  readonly version: 1 | 2;
  readonly bootstrap: unknown;                   // meta/'bootstrap' of a v2 database, else undefined
  readRecord(tenant: string, type: string, id: string): Promise<RecordRow | undefined>;   // v1 only; loads the records store into a memory driver and uses tx.records.get (no key-format duplication)
  initialize(input: { readonly cipher: AtRestCipher; readonly bootstrap: object; readonly stage?: (tx: Tx) => Result<void, AppError> }): Promise<Storage>; // v1 → v2 (§3.2)
  attach(cipher: AtRestCipher): Promise<Storage>; // v2 only (§3.3); rejects on the first bad row
  writeBootstrap(bootstrap: object): Promise<void>; // v2 only, under the writer fence
  close(): Promise<void>;
}
export async function openSealedVault(opts: IndexedDbOptions): Promise<SealedVaultContainer>;
```
`openSealedVault` reuses `acquireLock` (`indexeddb.ts:126-139`), `openDb` without a version argument (creation still runs `onupgradeneeded` 0→1, `:46-48`), `conn.onversionchange = close` (`:171`), the writer token and `claimWriter` (`:172-175`). `persist` gains the cipher branch (`delete(rowName(...))` / `put(value, idbKey)` instead of `:86-87`). `browser.ts:2` additionally exports `openSealedVault, SEALED_VAULT_DB_VERSION, type SealedVaultContainer, type AtRestCipher, type AtRestReason`. The kernel stays at layer 0 with `zod` as its only dependency (`tools/deps/deps.mjs` `LAYERS`).

### 4.3 Identity — `packages/identity/src/key-material.ts` (new; `identity.ts` untouched)
```ts
import type { AtRestCipher } from '@classrup/kernel/browser';   // type-only; identity (layer 2) → kernel (layer 0)
export const SECURITY_ERRORS = defineErrors({ SECURITY_UNLOCK_FAILED: { status: 401, retryable: false }, SECURITY_WRAPPED_KEY_INVALID: { status: 422, retryable: false }, SECURITY_ENVIRONMENT_UNSUPPORTED: { status: 422, retryable: false } }); // F16.S02.M01 codes; defineErrors at app-error.ts:59
export class VaultKeyException extends AppErrorException { constructor(error: AppError, message: string) } // fixed sentence, never secrets (app-error.ts:76-83)
export const BOOTSTRAP_FORMAT = 'classrup.vault.bootstrap/v1';
export interface VaultBootstrap { /* §2.2, readonly */ }
export interface VaultKeys { readonly principal: string; readonly identity: UnlockedIdentity; readonly cipher: AtRestCipher; lock(): void }
export function validateBootstrap(input: unknown): VaultBootstrap;                        // SECURITY_WRAPPED_KEY_INVALID {reason}
export function checkEnvironment(): void;                                                 // SECURITY_ENVIRONMENT_UNSUPPORTED
export function deriveIkm(passphrase: string, salt: Uint8Array): Promise<Uint8Array>;     // scryptAsync, identity.ts:38 parameters
export function openAlphaSecret(ikm: Uint8Array, sealed: Sealed): Uint8Array | undefined;
export function sealAlphaSecret(ikm: Uint8Array, salt: Uint8Array, plaintext: Uint8Array): Sealed;   // interoperable with identity.ts seal/unseal
export function generateSigningKey(): Promise<{ principal: string; privateKeyPkcs8: Uint8Array; identity: UnlockedIdentity }>;
export function createVaultKeys(input: { readonly ikm: Uint8Array; readonly salt: Uint8Array; readonly privateKeyPkcs8: Uint8Array; readonly principal: string; readonly migratedFrom: string | null; readonly now: string; readonly random?: RandomFill }): Promise<{ bootstrap: VaultBootstrap; keys: VaultKeys }>;
export function unlockVaultKeys(bootstrap: VaultBootstrap, passphrase: string): Promise<VaultKeys>;  // exactly one scryptAsync
export function rewrapBootstrap(bootstrap: VaultBootstrap, keys: VaultKeys, current: string, next: string, now: string): Promise<VaultBootstrap>;
export function unwrapIdentityForExport(bootstrap: VaultBootstrap, keys: VaultKeys, passphrase: string): Promise<ProtectedIdentity>;
export function createAtRestCipher(dek: Uint8Array, keyId: Uint8Array, random?: RandomFill): AtRestCipher;  // xchacha20poly1305 (@noble/ciphers/chacha.js), hmac+sha256, hkdf (@noble/hashes); pinned 2.4.0, already dependencies (identity/package.json:20-21)
```
`packages/identity/src/index.ts` re-exports these (append only). No raw key bytes are reachable from returned objects (PS-128 04.R02).

### 4.4 Vault — `packages/vault/src/vault.ts`
`openVault`, `vaultFromStorage`, `Vault`, `UnlockedVault`, `BackupCodec`, `backupCodec` keep their signatures (`vault.ts:15-56`); one additive method `changePassphrase(current: string, next: string): Promise<void>` on `UnlockedVault`. Internally a `VaultBackend` (`readBootstrap`, `readAlphaIdentity`, `initialize(bootstrap, keys, stage)`, `attach(keys)`, `writeBootstrap`, `close`) has an `IndexedDbBackend` over `SealedVaultContainer` and a `MemoryBackend` over a plain `Storage`. `apps/pwa/src/main.ts` needs no change: it only calls `openVault/create/unlock/restoreBackup/exportBackup/lock` (`main.ts:144-155,181-196`) and shows `error.message` (`main.ts:42-46`); the `SECURITY_UNLOCK_FAILED` exception carries `'Incorrect passphrase or damaged encrypted data'` so `tests/browser/alpha.spec.ts:91` (`/Incorrect passphrase|damaged/`) keeps passing. Existing `Error` texts (`'Vault does not exist'`, `'Vault already exists'`, `'Restore requires a new empty vault'`, `'Vault locked'`) are kept.

## 5. Threat model and failure handling

Adversary: offline read/write access to the profile, an extension writing to the database, an old alpha client on the same profile, local resource exhaustion. Out of scope: code in the vault origin while unlocked (PS-128 T02), memory forensics.

| Case | Behaviour | Error |
|---|---|---|
| Wrong passphrase (sealed or alpha vault) | DEK or alpha-secret tag fails; zeroed; nothing written | `SECURITY_UNLOCK_FAILED` (generic by design) |
| Bootstrap field edited (salt, N, keyId, principal, identity wrap, migratedFrom) | exact checks reject before scrypt, else AAD mismatch | `SECURITY_WRAPPED_KEY_INVALID` / `SECURITY_UNLOCK_FAILED` |
| Flipped ciphertext byte, truncated `s`, wrong `f`; row moved to another key, table or vault | first failing row aborts `attach`; no `Storage` returned | `DEPENDENCY_UNAVAILABLE at_rest_integrity` / `at_rest_format` |
| Plaintext row injected into a v2 vault | whole open fails | `at_rest_plaintext` |
| Old alpha client opens a sealed vault; new client finds version ≥ 3 | `VersionError`; nothing read, swept or written | `db_version` |
| Second tab / older connection | Web Lock and writer fence unchanged (`indexeddb.ts:92-103`), re-checked inside the upgrade | `vault_locked` / `vault_superseded` |
| Quota or crash during migration/restore | `versionchange` aborts; version stays 1; retry later | IndexedDB error surfaced |
| Quota during a sealed commit | `undo` restores the working set (`memory-driver.ts:328-331`) | rethrown |
| **Rollback of one row to an older ciphertext in the same slot under the same keyId** (sealed `outbox_seq` included) | **accepted** | not detected |
| **Deletion of a row, or re-insertion of a deleted slot's old ciphertext** | **accepted** | not detected |
| Rollback of the bootstrap after a passphrase change | old passphrase works again; rows unchanged | not detected |
| Resource bounds | frame ≤ 16 MiB, bootstrap ≤ 4 KiB, blobs ≤ 5 MiB, scrypt `maxmem` 256 MiB; peaks as §3.2 | `at_rest_format`, upstream `PAYLOAD_TOO_LARGE` |

Nonces are 24 CSPRNG bytes per seal, never counter-derived (collision ≈ n²/2¹⁹³); bootstrap timestamps are authenticated but never compared, so no clock anomaly affects crypto. Why single-row rollback is not detected: AEAD authenticates *this ciphertext under this AAD*; an earlier ciphertext of the same slot was produced with an identical AAD (same table, name, keyId, format) and therefore verifies. Detection needs state the attacker cannot roll back with the row (a sealed per-commit manifest or an external anchor), which is deferred. Rows from other vaults, formats, tables or slots and any bit flip are rejected because at least one AAD component differs. Open is all-or-nothing (reject, never freeze or degrade). Errors and logs carry `table` and `reason` only, never keys, nonces, names or row content (PS-119 07.R01).

Memory hygiene: `ikm`, KEK, pkcs8 and DEK subkeys are `fill(0)` in `finally`; signing keys are non-extractable `CryptoKey`s (`identity.ts:86,100`); `cipher.destroy()` zeroes on lock. The passphrase string, noble's transient buffers and structured clones cannot be wiped, only garbage-collected.

## 6. Test plan

Trace IDs reuse existing rows where the scenario matches and append rows to `16_Security/02_cryptography/mod_key/module.spec.yaml` (PS-128: `T16 | integration | 01.R01,02.R02,03.R01,06.R01,06.R02,10.R03 | …`, `T17 | integration | 01.R02,10.R02 | …`) and `15_Platform/02_backend/mod_storage/module.spec.yaml` (PS-119: `T18 | integration | 01.R03,06.R02,07.R01,10.R02 | …`, `T19 | contract | 01.R03,04.R01,02.R04 | …`). Every `covers` ref already exists, so `pnpm spec:check` stays at 0 errors with no new warning.

Kernel (`packages/kernel/src/storage/at-rest.test.ts`; test double = a synchronous toy AEAD with a non-cryptographic tag over key‖nonce‖aad‖ct, clearly labelled; no noble in the kernel):
1. `TEST-PS-119-09.T18` frame round-trip for every table incl. blobs and unicode keys → identical row and key.
2. `TEST-PS-119-09.T18` property (fast-check 4.10.2): random `(table,key,row)` → `sealRow`/`openRow` identity; flipped byte, other table, other `idbKey` or other keyId → `at_rest_integrity`; legacy object → `at_rest_plaintext`; wrong `f`/short `s`/oversize → `at_rest_format`.
3. `TEST-PS-119-09.T18` sealed adapter: raw stores (`rawOpen`/`storeCount`, `indexeddb.test.ts:46-60`) contain only 43-char keys and `{f,s}` values; no plaintext substring.
4. `TEST-PS-119-09.T08` failed sealed commit (quota proxy, `indexeddb.test.ts:79-98`) restores the working set; next commit persists.
5. `TEST-PS-119-09.T18` corrupt one byte, swap two values, inject a plaintext object → `attach` rejects with the matching reason and `table`; no `Storage`.
6. `TEST-PS-119-09.T18` plaintext `openIndexedDbStorage` on v2 and `openSealedVault` on version 3 → `db_version`.
7. `TEST-PS-119-09.T18` `initialize` with `stage` returning `err`, and with a blocking second connection → version 1 and rows intact; `vault_locked` for the blocked case.
8. `TEST-PS-119-09.T19` `storageContractSuite('indexeddb-sealed', …)` (`contract-suite.ts:42`) with the toy cipher: identical results to the other adapters.

Identity (`packages/identity/src/key-material.test.ts`):
9. `TEST-PS-128-09.T03` property: random plaintext/AAD seal/open round trip; every single-bit flip of sealed or AAD → `undefined`.
10. `TEST-PS-128-09.T12` 100 000 seals → 100 000 distinct nonces (spec says 1 000 000; CI runs 100 000, documented).
11. `TEST-PS-128-09.T04` bootstrap with `N:1024`, wrong `format`, missing salt, extra field, 15-byte salt → `SECURITY_WRAPPED_KEY_INVALID`; `scryptAsync` spy never called.
12. `TEST-PS-128-09.T16` `createVaultKeys` then `unlockVaultKeys`: `scryptAsync` called exactly once; wrong passphrase and every edited bootstrap field → `SECURITY_UNLOCK_FAILED`.
13. `TEST-PS-128-09.T16` `sealAlphaSecret` output accepted by `unseal` (`identity.ts:53`); `openAlphaSecret` opens `seal` output (`DOMAIN` interop).
14. `TEST-PS-128-09.T09` no property of `VaultKeys` holds 32/48 raw key bytes; `sign` after `lock()` rejects; `cipher.seal` after `destroy()` throws.
15. `TEST-PS-128-09.T16` `rewrapBootstrap`: old passphrase fails, new unlocks, `keyId`/`identity` unchanged.

Integration (`tests/integration/vault-encryption.test.ts`, fake-indexeddb, real cipher):
16. `TEST-PS-128-09.T16` create → records/outbox/blob → lock → raw dump has only sealed values, `meta` holds exactly `writer` + `bootstrap` in plaintext, and contains no record text, principal or type name.
17. `TEST-PS-128-09.T17` alpha fixture (plaintext `vault.identity` record + rows at version 1) → wrong passphrase: still version 1, rows untouched; right passphrase: version 2, identity row gone, all data readable, one `scryptAsync` call.
18. `TEST-PS-128-09.T11` abort/quota injected into the upgrade → version 1, plaintext intact, next unlock succeeds.
19. `TEST-PS-128-09.T16` sealed vault: flipped byte / swapped rows / injected plaintext row → `unlock` rejects with `at_rest_*`, no session.
20. `TEST-PS-128-09.T15` export from a migrated vault restores into a fresh `openVault` and into `vaultFromStorage(createMemoryStorage())`; the bundle passes `unlockIdentity` (alpha compatibility); after `changePassphrase` only the new passphrase opens the export.
21. `TEST-PS-128-09.T15` alpha opener `openIndexedDbStorage` on the sealed database rejects and leaves it unchanged.
22. `TEST-PS-128-09.T16` `lock()` during an awaited write (as `vault.test.ts:36-56`) rolls back; afterwards `cipher.seal` throws and `identity.sign` rejects.
23. `TEST-PS-119-09.T08` sealed reopen across the same `IDBFactory` keeps records and outbox sequence (as `indexeddb.test.ts:63-77`).
24. `TEST-PS-128-09.T16` `isInitialized` on v2 opens transactions on `meta` only (spy on `IDBDatabase.transaction`).

`packages/vault/src/vault.test.ts` keeps both tests and adds a `changePassphrase` round trip.

## 7. Open questions resolved

1. **Where does crypto live?** Identity (already depends on `@noble/hashes`/`@noble/ciphers` 2.4.0); the kernel receives an injected synchronous `AtRestCipher`. `deps:check` stays acyclic; no new dependency.
2. **Atomic or resumable migration?** Atomic inside the 1→2 `versionchange` transaction: all-or-nothing plus a hard version-based downgrade guard, no marker to authenticate, no partial window.
3. **Reuse the alpha salt/ikm or derive fresh?** Reuse through HKDF domain separation: one scrypt for the migration unlock, two (as today) for restore; the salt is public and the derived secret is passphrase-equivalent either way.
4. **Wrap the signing key under KEK or DEK?** Under a DEK-derived subkey: passphrase change rewrites one 48-byte wrap, export rebuilds the alpha `ProtectedIdentity` without an extra derivation, and the KEK lives only microseconds.
5. **Encrypt IndexedDB keys?** Yes, HMAC names under `k_name`; plain hashes would allow confirmation attacks on guessable IDs.
6. **Error codes?** Kernel: `DEPENDENCY_UNAVAILABLE` with `reason`, the family already used for `vault_locked` (`indexeddb.ts:24-26`); `retryable:true` is inherited and documented as "retry after restoring a backup". Vault/identity: F16.S02.M01 codes via `defineErrors`, thrown as `VaultKeyException` with fixed messages.
7. **Keep `vaultFromStorage`?** Yes, as the unsealed memory backend with the same bootstrap document.
8. **Passphrase change in MVP?** Yes: one bootstrap rewrite, no new format.
9. **`isInitialized` on v1 vaults** reads the plaintext `records` store once through the memory driver (alpha vaults only); v2 reads `meta` only.
10. **Revision in AAD?** No: it would not prevent rollback (the older ciphertext carried its own matching AAD) and would complicate `restore`.

## 8. Honest limits

Established: confidentiality of row content, keys and identifiers at rest, per-slot integrity against modification, relocation, cross-vault substitution and plaintext injection, and a hard refusal of older clients. Not established: detection of single-slot rollback, deletion or re-insertion of old ciphertext; rollback of the bootstrap (passphrase-change undo); hiding of per-table row counts, database size or write timing; protection against code in the unlocked origin; wiping of the passphrase string or transient buffers; DEK rotation; unlock rate limiting; any third-party audit of `@noble/*` (PS-128 T05). No "secure", "audited" or "production-ready" claim is made; the vault README must state the above.
