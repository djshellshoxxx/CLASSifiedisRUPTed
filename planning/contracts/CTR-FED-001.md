# CTR-FED-001 — Federation envelope, provenance and tombstones

**Status:** APPROVED. **Owner:** F11.S01.M02 (mod_records).

## Envelope (D01)
```json
{ "v": 1, "type": "classrup.bazaar.listing/v1", "cid": "sha256-…", "author": "did:key:z6Mk…",
  "createdAt": "…", "seq": 3, "prev": "sha256-…", "payload": { }, "ext": { },
  "sig": "<base64url Ed25519 over JCS(envelope minus sig)>" }
```
- **FED-1** Only P0 records whose owner enabled federation for that record are exported. L2 maximum location.
- **FED-2** Signature: Ed25519 (RFC 8032) over RFC 8785 JCS bytes of the envelope without `sig`. `author` is a W3C did:key (multicodec ed25519-pub, base58btc). Invalid signature ⇒ reject `FED_SIGNATURE_INVALID`.
- **FED-3** Dedup by `cid`; per-author ordering by `seq` with `prev` hash chain; gaps buffered 24 h then fetched or dropped.
- **FED-4** Tombstone `{type:"classrup.federation.tombstone/v1", payload:{target:cid|id, reason}}` signed by author or origin relay; receivers delete content within 24 h and keep the tombstone 180 days.
- **FED-5** Relay-to-relay transport: HTTPS `POST /fed/v1/inbox` batches ≤ 100 envelopes, request signed by relay key; peers are explicit opt-in allowlist with per-peer quotas; blocklists (F11.S03.M02) apply before storage.
- **FED-6** Provenance stored locally: `{ originRelay, receivedAt, via[], verifiedAt }`. Federated records are read-only mirrors; the canonical owner is the origin.
