# PS-118-04 — Commands, queries and events: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-04.R01** The module registers two relay commands or queries for identity and status through the shared command bus; vault commands and signed statements are not defined here.
- **PS-118-04.R02** Rotation is the only relay command that changes identity, and it emits one extra event for relay-local consumers.
- **PS-118-04.R03** The dispatcher consumes no domain events; it delivers events produced by other modules to their consumers.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `platform.relay_identity.rotate` | platform.relay_identity.rotate | { reason (≤ 200 chars) } — relay command, operator only | { keyId, publicKey, retiredKeyId } | FORBIDDEN, PLATFORM_RELAY_IDENTITY_MISSING, RATE_LIMITED | platform.relay_identity.rotated | no |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `platform.relay_identity.get` | platform.relay_identity.read_public | { includeRetired?: boolean } — relay query, public | { relayId, displayName, publicUrl, keys: [{ keyId, publicKey, status, createdAt, retiredAt? }], software: { name, version }, features: string[] } |  |
| `platform.relay.get_status` | platform.relay.read_status | { } (no input) — relay query, operator only | { state, uptimeMs, nodeVersion, sqliteDriver: 'node:sqlite', dispatcher: { lagMs, deadLetters, lastBatchAt }, draining } | FORBIDDEN |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `platform.relay_identity.rotated` | P0 | { relayId, newKeyId, retiredKeyId, rotatedAt } |

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_RELAY_RUNTIME_UNSUPPORTED | 500 | no | Node version below 22.18 or node:sqlite unavailable (startup exit 78) |
| PLATFORM_RELAY_CONFIG_INVALID | 500 | no | environment configuration failed validation (startup exit 78) |
| PLATFORM_RELAY_DRAINING | 503 | yes | relay is shutting down; retry after the Retry-After seconds |
| PLATFORM_RELAY_IDENTITY_MISSING | 500 | no | key file absent or does not match the stored active key |
| PLATFORM_RELAY_DUPLICATE_INSTANCE | 500 | no | another process holds the dispatcher lease for this database |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# minimal environment
RELAY_ENV=production RELAY_PUBLIC_URL=https://relay.example.org RELAY_DATA_DIR=/var/lib/classrup
RELAY_DB_PATH=/var/lib/classrup/relay.sqlite RELAY_ALLOWED_ORIGINS=https://app.example.org RELAY_PORT=8787
$ node apps/relay/src/main.ts      # Node >=22.18 strips types natively, no build step
GET /.well-known/classrup-relay.json -> 200 { "relayId": "relay:7k3mqx...", "keys": [{ "keyId": "0192...", "publicKey": "Zk3...", "status": "active" }], "software": { "name": "classrup-relay", "version": "0.1.0" } }
kill -TERM <pid>  -> /readyz 503, in-flight finish within 10 s, exit 0
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T07 | contract | PS-118-04.R01, PS-118-04.R02 | well-known document, identity query, status query, rotate | payloads validate against registry schemas, rotated event emitted once |
| TEST-PS-118-09.T08 | integration | PS-118-04.R03, PS-118-06.R01, PS-118-06.R03 | flaky consumer fails 3 times then succeeds; always-failing consumer; kill -9 mid-batch | ordered at-least-once delivery, dead letter after 8 attempts, no lost events after restart, inbox suppresses duplicates |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
