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
**Other domain records are plaintext in IndexedDB.** This foundation does not
claim whole-database encryption or physical erasure of browser storage/memory.

`exportBackup(passphrase)` encrypts a signed alpha record bundle for exactly the
registered codecs. `restoreBackup(bundle, passphrase)` validates signature,
identity, record schemas and optional async codec validators before committing
all records and the encrypted identity in one transaction to a new empty vault.
Use `backupCodec(repo)` and attach a `validate` callback for records containing
peer evidence. The application must register every supported domain record type;
unknown types are rejected. Indexes are regenerated from current schemas.

This is an explicitly scoped `classrup.vault.alpha_backup/v1` format, **not** a
complete CTR-IOX-001 export or the 24-word recovery protocol. It excludes blobs,
outbox/inbox, lease and delivery state. Export is bounded by the federation
primitive's 1 MiB signed-envelope limit and 10,000 records. The preserved signing
identity still uses the original passphrase. There is no password reset,
delegated device identity, device rotation/revocation, recovery notice or
72-hour dispute workflow in this slice. Users must review coordination after a
restore; a copied signing identity can create conflicting commitments.
