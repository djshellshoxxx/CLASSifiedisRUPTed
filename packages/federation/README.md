# Signed alpha statement primitive

`signEnvelope` and `verifyEnvelope` implement root-key Ed25519 signatures with
W3C did:key public-key binding, strict JSON/JCS input validation and bounded
canonicalization. CID is `sha256-` plus lowercase hex SHA-256 of the canonical
envelope excluding `cid` and `sig`; the signature covers canonical envelope
including CID but excluding `sig`. Input is detached before asynchronous crypto;
verified output is recursively frozen.

The verifier checks exact envelope fields, supported v1 type syntax, canonical
DID/base64url/timestamp representations, sequence/previous-CID syntax, content
hash, signature and optional author/type/freshness constraints. Future timestamps
beyond five minutes are rejected. JSON limits: 1 MiB, depth 32, 50,000 nodes.

A valid signature is **not** domain authority or replay admission. Every receiver
must validate its exact payload schema, author role, owner/subject binding,
expiry, revision, previous commitment and conflicting evidence before mutation.
This primitive does not implement delegated devices, key revocation, transport,
global author-stream gap buffering or tombstone retention. The current alpha
listing exchange uses per-subject publication chains; full CTR-FED-001 FED-3
per-author sequencing remains incomplete. Unknown semantic extension fields
cannot grant privileges.
