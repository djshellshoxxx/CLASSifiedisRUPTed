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

## ADR-0016 amendment (review pass, 2026-11-11)
- **FED-7 (FED-2)** `cid = "sha256-" + base64url(SHA-256(JCS(envelope minus sig and cid)))`; `sig` = Ed25519 over `JCS(envelope minus sig)`, so the cid is signed. `author` is the principal did:key; `ext.signerKey` names the signing device key.
- **FED-8 (FED-3)** Chains are per `(author, signerKey, ext.stream)`, anchored on first sight; gaps are released with `chainGap` after 24 h; forks exist only on seq collisions.
- **FED-9 (FED-4)** Only author-signed tombstones are binding deletions. A relay operator removal is a signed `classrup.federation.relay_removal/v1` advisory that removes the item from that relay's index only (peers act only via their own operator review or block rules; vaults never purge; the author's vault ignores it). Tombstone stubs are kept at least max(180 days, the target type's `maxAge`); pending tombstones are applied only after the target's issuer check.
- **FED-10 (FED-5)** Relay-to-relay requests use RFC 9421 HTTP Message Signatures (ed25519; `@method`, `@target-uri`, `content-digest`, `created`, `keyid`, `nonce` = batchId). Participant statements travel only as sealed mailbox envelopes, never via `/fed/v1/inbox`.
- **FED-11 (FED-6)** Provenance (`receivedFromRelay`, `via`) is for display only; there is no canonical origin relay. A per-type registry `maxAge` (F11.S01.M01) replaces the fixed 180-day createdAt limit.
