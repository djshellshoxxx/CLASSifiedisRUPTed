# PS-118-04 — Commands, queries and events: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-04.R01** The module registers relay commands and queries for identity (rotate, revoke) and status through the shared command bus, plus the HTTP routes /.well-known/classrup-relay.json and /media/v1/*; vault commands are not defined here.
- **PS-118-04.R02** Rotation and revocation are the only relay commands that change identity, and each emits platform.relay_identity.rotated for relay-local consumers.
- **PS-118-04.R03** The dispatcher consumes no domain events; it delivers events produced by other modules to their consumers.
- **PS-118-04.R04** Every relay route that accepts bytes for storage or forwarding (mailbox put of F08.S01.M01, index and publication intake of F06.S01.M01 and F11.S01.M02, federation inbox POST /fed/v1/inbox, media upload PUT /media/v1, auction bid intake of F04.S01.M02) returns in its response field receipt a classrup.platform.relay_receipt/v1 from ReceiptPort.issue - the RFC 8785 JCS body { relayId, keyId, destination, digest, cid?, receivedAt, epoch, seq } signed with Ed25519 over the bytes of context 'classrup-relay-receipt:v1', a 0x0A byte and the JCS body, where digest is sha256- plus base64url SHA-256 of the exact request bytes received (the ciphertext for mailbox puts) and cid is present only for P0 public statements; vaults verify it against the published key set including retired keys.
- **PS-118-04.R05** Statements signed by this module and their signer role relay_identity are registered with F11.S01.M01 (N2) - classrup.platform.relay_receipt/v1, classrup.platform.relay_rotation/v1 and classrup.platform.relay_key_revocation/v1; the restore announcements classrup.platform.relay_restore/v1 written by F15.S03.M03 are served here unchanged.
- **PS-118-04.R06** The public media route GET /media/v1/sha256-<base64url> is handled before the command bus and sends Cache-Control public, max-age=31536000, immutable, ETag equal to the content address, Content-Type of the blob, X-Content-Type-Options nosniff, Cross-Origin-Resource-Policy cross-origin, Access-Control-Allow-Origin echoing an allowlisted PWA origin with Vary Origin, and never Set-Cookie (exempt from the bus's no-store policy).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `platform.relay_identity.rotate` | platform.relay_identity.rotate | { reason (≤ 200 chars), expectedRevision } with Idempotency-Key — relay command, relay_operator or admin, or local CLI | { keyId, publicKey, retiredKeyId, rotationStatementCid } | FORBIDDEN, CONFLICT_REVISION, IDEMPOTENCY_KEY_REUSED, PLATFORM_RELAY_IDENTITY_MISSING, RATE_LIMITED | platform.relay_identity.rotated | yes (Idempotency-Key) |
| `platform.relay_identity.revoke` | platform.relay_identity.revoke | { keyId, reason: compromised\|lost\|superseded, expectedRevision, useCertificate?: boolean } — relay command dispatched only by the local CLI (relay identity revoke) with filesystem access to RELAY_DATA_DIR; no prior-key authorization; exempt from the 24 h rotation limit | { keyId, revokedAt, revocationStatementCid, activeKeyRemaining: boolean } | FORBIDDEN, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | platform.relay_identity.rotated | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `platform.relay_identity.get` | platform.relay_identity.read_public | { includeRetired?: boolean } — relay query, public; also served as /.well-known/classrup-relay.json | { relayId, displayName, publicUrl, keys: [{ keyId, seq, publicKey, status, prevKeyId?, createdAt, retiredAt?, revokedAt?, rotationStatement?, revocationStatement? }], restoreAnnouncements: classrup.platform.relay_restore/v1[] (newest 10), receiptEpoch, software: { name, version }, features: string[] } |  |
| `platform.relay.get_status` | platform.relay.read_status | { } (no input) — relay query, relay_operator or admin | { state, uptimeMs, nodeVersion, sqliteDriver: 'node:sqlite', dispatcher: { lagMs, deadLetters, lastBatchAt }, draining, activeKeyId } | FORBIDDEN |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `platform.relay_identity.rotated` | P0 | { relayId, change: rotated\|revoked, newKeyId?, retiredKeyId?, revokedKeyId?, reason?, at } |

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_RELAY_RUNTIME_UNSUPPORTED | 500 | no | Node version below 22.18 or node:sqlite unavailable (startup exit 78) |
| PLATFORM_RELAY_CONFIG_INVALID | 500 | no | environment configuration failed validation (startup exit 78) |
| PLATFORM_RELAY_DRAINING | 503 | yes | relay is shutting down; retry after the Retry-After seconds |
| PLATFORM_RELAY_IDENTITY_MISSING | 500 | no | key file absent, does not match the stored active key, or no active key exists |
| PLATFORM_RELAY_DUPLICATE_INSTANCE | 500 | no | another process holds the dispatcher lease for this database |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# minimal environment
RELAY_ENV=production RELAY_PUBLIC_URL=https://relay.example.org RELAY_DATA_DIR=/var/lib/classrup
RELAY_DB_PATH=/var/lib/classrup/relay.sqlite RELAY_ALLOWED_ORIGINS=https://app.example.org RELAY_PORT=8787
$ node apps/relay/src/main.ts      # Node >=22.18 strips types natively, no build step
GET /.well-known/classrup-relay.json -> 200 { "relayId": "relay:7k3mqxw2a9b4c5d6e7f8g9h0jk",
  "keys": [{ "keyId": "relay:7k3mqxw2a9b4c5d6e7f8g9h0jk#k2", "seq": 2, "status": "active", "prevKeyId": "relay:7k3mqxw2a9b4c5d6e7f8g9h0jk#k1" },
           { "keyId": "relay:7k3mqxw2a9b4c5d6e7f8g9h0jk#k1", "seq": 1, "status": "retired" }], "receiptEpoch": 0 }
POST /mailbox/v1/mbx_9f2 (ciphertext) -> 201 { "receipt": { "relayId": "relay:7k3m...", "keyId": "relay:7k3m...#k2",
  "destination": "relay:7k3m.../mailbox/mbx_9f2", "digest": "sha256-Hc4...", "receivedAt": "2026-11-04T10:00:01.120Z", "epoch": 0, "seq": 88121, "sig": "..." } }
GET /media/v1/sha256-Qm3... -> 200 Cache-Control: public, max-age=31536000, immutable; Access-Control-Allow-Origin: https://app.example.org; Vary: Origin
kill -TERM <pid>  -> /readyz 503, in-flight finish within 10 s, WAL archived by the hook, TRUNCATE, exit 0
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T07 | contract | PS-118-04.R01, PS-118-04.R02, PS-118-04.R05 | well-known document, identity query, status query, rotate, revoke | payloads validate against registry schemas; rotation, revocation and receipt statements are registered in the F11.S01.M01 registry with signer role relay_identity and restore announcements are served unchanged; rotated event emitted once per change with change rotated or revoked |
| TEST-PS-118-09.T08 | integration | PS-118-04.R03, PS-118-06.R01, PS-118-06.R03 | flaky consumer fails 3 times then succeeds; always-failing consumer; kill -9 mid-batch | ordered at-least-once delivery, dead letter after 8 attempts, no lost events after restart, inbox suppresses duplicates |
| TEST-PS-118-09.T19 | contract | PS-118-04.R04, PS-118-07.R04 | mailbox put to A, index write, federation inbox batch and media upload; rotate; verify each receipt with the vault verifier; present A's receipt for mailbox B | receipts validate as classrup.platform.relay_receipt/v1 with context classrup-relay-receipt:v1, digest of the exact bytes (ciphertext for the mailbox) and no cid for the mailbox put; keyId resolves to the right key after rotation; A's receipt rejected for B |
| TEST-PS-118-09.T22 | contract | PS-118-04.R06, PS-118-02.R04 | GET /media/v1 for a P0 blob from an allowlisted and a foreign origin, for an encrypted blob and for a missing blob | P0 blob served with Cache-Control public, max-age=31536000, immutable, ETag, nosniff, CORP cross-origin, ACAO only for the allowlisted origin, Vary Origin, no Set-Cookie and no no-store; encrypted and missing both 404 |
| TEST-PS-118-09.T24 | integration | PS-118-06.R01, PS-118-04.R02, PS-118-02.R04 | rotate replayed with the same Idempotency-Key and body, with the same key and a different body, with a stale expectedRevision, and a second rotation 2 h later | original response replayed; IDEMPOTENCY_KEY_REUSED; CONFLICT_REVISION; RATE_LIMITED |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
