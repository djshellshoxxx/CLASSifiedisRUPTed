# TODO — F11.S01.M03 mod_signatures

**Status:** IMPLEMENTED — Ed25519 author sig, relay countersign bound to hash+authorSig, signed batches, dual-signed migration proofs; domain-separated contexts. Signatures prove assertion, not truth.

## Implemented
- [x] Author signature (federated-record), relay countersignature (relay-countersign), signed batches (federation-batch)
- [x] Migration proofs (account-migration) and blocklist signatures; domain-separated contexts

## Code and tests
- Code: `packages/federation/src/protocol/signatures.ts`
- Tests: `packages/federation/test/records.test.ts`, `packages/federation/test/sync.test.ts`

## Remaining
- [ ] Key transparency log for relay keys
- [ ] Relay key rotation procedure
