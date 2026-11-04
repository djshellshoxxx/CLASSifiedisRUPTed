# PS-054-01 — Domain schema: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-01.R01** A LoginChallenge stores only the hash of the nonce, the DID it was issued for, the relay it was bound to, and a 120 second expiry; it is relay-side ephemeral data.
- **PS-054-01.R02** A Session stores kind, DID, device key, token hash for relay sessions, idle and absolute expiry, and metadata; vault unlock sessions are in memory and never persisted.
- **PS-054-01.R03** Tokens and the vault key are P4 values that never appear in logs, events or exports; only SHA-256 hashes of tokens are stored on the relay.

## Specification

### LoginChallenge

Schema `classrup.identity.login_challenge/v1` · storage **relay** · privacy **P4** · retention **RET-EPHEMERAL**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — the relay namespace |
| did | did — DID the challenge was issued for |
| relayId | string — relay identifier bound into the signed message |
| nonceHash | string — SHA-256 of the 32-byte nonce, hex 64 characters |
| status | enum — issued \| consumed \| expired |
| ipPrefix | string — IPv4 /24 or IPv6 /48 truncation for rate limiting |
| expiresAt | timestamp — relay clock, createdAt plus 120 000 ms |
| consumedAt? | timestamp — relay clock |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- A challenge is consumed at most once and never after expiresAt.
- A DID has at most 5 outstanding issued challenges per relay.
- The raw nonce is never stored; only nonceHash.

### Session

Schema `classrup.identity.session/v1` · storage **relay+device** · privacy **P4** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| kind | enum — vault_unlock \| relay_token |
| did | did — principal |
| deviceKeyPublic | string — Ed25519 public key used, base64url 43 characters |
| relayId? | string — relay that issued a relay_token |
| tokenHash? | string — SHA-256 of the 256-bit token, hex 64 characters, relay_token only |
| startedAt | timestamp — holder's clock |
| lastSeenAt | timestamp — updated at most once per 5 minutes |
| idleExpiresAt | timestamp — lastSeenAt plus idle timeout (7 days relay, 15 minutes default for vault) |
| absoluteExpiresAt? | timestamp — startedAt plus 30 days, relay_token only |
| uaLabel? | string — coarse label such as 'Firefox on Android', at most 80 code points |
| ipPrefix? | string — /24 or /48 at start, relay_token only |
| status | enum — active \| revoked \| expired |
| endReason? | enum — locked \| idle \| absolute \| user_revoked \| device_revoked \| recovery \| erased \| limit |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Raw tokens and the vault key are never stored; vault_unlock rows exist only in memory.
- A relay_token session has tokenHash, relayId and absoluteExpiresAt; a vault_unlock session has none of them.
- A DID has at most 20 active relay_token sessions per relay; the 21st start revokes the least recently used with reason limit.

### Storage DDL

```sql
CREATE TABLE identity_login_challenge (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, did TEXT NOT NULL, nonce_hash TEXT NOT NULL, status TEXT NOT NULL,
  expires_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_challenge_nonce ON identity_login_challenge(nonce_hash);
CREATE TABLE identity_session (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, did TEXT NOT NULL, token_hash TEXT NOT NULL, status TEXT NOT NULL,
  idle_expires_at TEXT NOT NULL, absolute_expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_session_token ON identity_session(token_hash);
CREATE INDEX identity_session_did ON identity_session(tenant_id, did, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T01 | unit | PS-054-01.R01, PS-054-01.R02, PS-054-02.R01 | issue challenge then start with a valid signature | challenge consumed, session active, token returned once, only its hash stored |
| TEST-PS-054-09.T10 | abuse | PS-054-01.R03, PS-054-07.R01, PS-054-07.R02, PS-054-07.R03 | scan logs, events, URLs and exports for tokens, nonces, passphrases; 11 failed starts from one IP /24 for one DID | none found; 11th returns RATE_LIMITED |
| TEST-PS-054-09.T13 | a11y | PS-054-01.R01, PS-054-03.R01 | unlock screen and sessions list with axe-core and keyboard only | zero serious or critical issues; backoff text announced politely |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
