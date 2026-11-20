# Local alpha vault foundation

`openVault({name, codecs})` composes the existing kernel IndexedDB adapter with a
single user-held Ed25519 principal. `create(passphrase)` and `unlock(passphrase)`
return a revocable signing identity and guarded kernel storage. `lock()` drops
the signing key reference and closes the storage connection. Reopen the vault
before unlocking again. The kernel's Web Lock / writer fence protects concurrent
writers. Production code must use IndexedDB, not the memory contract-test seam.

Signing keys are encrypted with the ADR-0013 scrypt parameters (N=131072, r=8,
p=1), fresh 16-byte salt and XChaCha20-Poly1305 with a fresh 24-byte nonce.
Passphrases must contain 12–1024 UTF-8 bytes. Signing uses nonextractable
WebCrypto Ed25519 keys after creation/unlock; the DID binds the exact public key.
Domain row contents, secondary index values, blobs and delivery/idempotency state
are encrypted with AES-256-GCM and fresh 96-bit nonces. A random 256-bit storage
key is protected with the existing scrypt/XChaCha20-Poly1305 envelope; separate
HKDF-SHA-256 subkeys protect row contents and HMAC-SHA-256 row addresses. AAD binds
ciphertext to the database name, table and opaque stored key. An encrypted
inventory authenticates the exact durable row set and its ciphertext hashes,
including the protected identity, so partial deletion/replacement fails unlock.

The root identity uses a sealed `classrup.vault-identity/v2` wrapper containing an
authenticated storage-format marker. Removing the storage-key header from an
upgraded vault fails closed. Legacy plaintext rows migrate only after a correct
identity passphrase, with row replacement, old-key deletion, identity upgrade,
key header and inventory committed atomically. New create/restore operations
commit their identity, key header, domain rows and inventory together. Failed
migration leaves the original plaintext rows intact for retry. Older application
versions cannot open upgraded vaults; backups remain alpha-backup compatible.

Table names, row counts, ciphertext lengths and root identity timestamps remain
visible. This does not provide physical erasure of old browser pages or in-memory
JavaScript strings, protection from malicious same-origin scripts, or detection
of a complete database rollback (including a pre-migration plaintext snapshot).
Unlock adds bounded key-derivation work and loads/decrypts the working set; each
write updates the encrypted inventory. Very large vaults need further load and
memory qualification. Rotation, key deletion and complete recovery remain open.

`exportBackup(passphrase)` encrypts a signed alpha record bundle for exactly the
registered codecs. `restoreBackup(bundle, passphrase)` validates signature,
identity, record schemas and optional async codec validators before committing
all records and the encrypted identity in one transaction to a new empty vault.
Use `backupCodec(repo)` and attach a `validate` callback for records containing
peer evidence. The application must register every supported domain record type;
unknown types are rejected. Indexes are regenerated from current schemas.

`backupCoverage()` reports populated record types and counts for the unlocked
principal without returning record payloads. The PWA exposes this as **Check
backup coverage** and clears the result on lock. Export rechecks actual types in
its own read transaction and refuses unknown types instead of silently omitting
saved data. Coverage is bounded to 256 types and 10,000 records; the report marks
overflow explicitly. Successful coverage does not waive schema, signature,
passphrase or envelope-size validation. The accepted codec registry is copied
when the vault opens, so caller mutation cannot change export coverage.
See [the coverage contract](../../../docs/development/BACKUP_SCOPE.md).

This is an explicitly scoped `classrup.vault.alpha_backup/v1` format, **not** a
complete CTR-IOX-001 export or the 24-word recovery protocol. It excludes blobs,
outbox/inbox, lease and delivery state. Export is bounded by the federation
primitive's 1 MiB signed-envelope limit and 10,000 records. The preserved signing
identity still uses the original passphrase. There is no password reset,
delegated device identity, device rotation/revocation, recovery notice or
72-hour dispute workflow in this slice. Users must review coordination after a
restore; a copied signing identity can create conflicting commitments.

The PWA binds `createVaultAutoLock` to trusted user activity and tab visibility.
Default idle timeout is 15 minutes, configurable from 1–60 for that session;
five continuous minutes hidden also locks. Throttled timers cannot refresh an
already expired deadline. Lock hides and clears private views before storage
closure; stale asynchronous results cannot export into a replacement session.
Failed closure is visible and requires reload before reopening.

After three failed unlock attempts, local exponential backoff starts at one
second and caps at one minute. It survives closing/reopening the same vault in
one page, but resets on reload and is not an offline password-guessing defense.
Native Ed25519 errors report only a fixed operation stage, without key bytes or
native error details. New identity generation permits at most three sequential
native calls when the rejected value is a genuine `DOMException` named
`OperationError`. Other errors stop immediately. Export, import, signing,
verification, decryption and vault persistence are never retried by this policy.
Generation completes before a DID or identity is persisted; failed creation does
not rotate an existing identity or repeat a persistence transaction.

This is a bounded creation-availability mitigation, not a repair of WebKit's
native cryptography. The pinned Linux WebKit backend also deterministically
rejects some valid existing PKCS#8 keys containing leading zero bytes. Unlock and
restore preserve that identity and fail closed; they never generate a replacement
key. The unchanged [native diagnostic](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44268543372)
recorded seven generation `OperationError` failures in 512 trials, rejected the
leading-zero/all-zero import vectors, and passed the nonzero control. Its strict
assertions remain unchanged. A compatible browser build containing the reviewed
upstream fixed-width repair is still needed for complete native compatibility.
Device recovery and the conflicting canonical F07 session policy remain separate
unfinished contracts.
