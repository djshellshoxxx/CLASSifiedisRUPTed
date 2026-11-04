# PS-054-04 — Commands, queries and events: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-04.R01** unlock, lock and rotate-vault-key operate in the vault with no statement; challenge, start, rotate and revoke for relay tokens are relay commands, and the start request carries a signature by the device key.
- **PS-054-04.R02** Every command emits its events in the same transaction as the state change.
- **PS-054-04.R03** The module consumes device key, recovery and erase events to end sessions.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.session.unlock` | identity.session.unlock | { passphrase \| platformKeyHandle, idleTimeoutMs? } | { sessionId, kind: vault_unlock, idleExpiresAt } | UNAUTHENTICATED, RATE_LIMITED, VALIDATION_FAILED | identity.session.started | no |
| `identity.session.lock` | identity.session.lock | { sessionId } | { sessionId, status: revoked } | NOT_FOUND | identity.session.revoked | yes (Idempotency-Key) |
| `identity.login_challenge.issue` | identity.login_challenge.issue | { did, relayId } | { challengeId, nonce, expiresAt } | RATE_LIMITED, VALIDATION_FAILED |  | no |
| `identity.session.start` | identity.session.start | { challengeId, did, deviceKeyPublic, nonce, signature, identityDocument?: classrup.identity.portable_doc/v1 } | { sessionId, token (shown once), idleExpiresAt, absoluteExpiresAt } | UNAUTHENTICATED, EXPIRED, RATE_LIMITED, VALIDATION_FAILED | identity.session.started | no |
| `identity.session.rotate` | identity.session.rotate | { expectedRevision } | { sessionId, token (shown once), idleExpiresAt, absoluteExpiresAt } | UNAUTHENTICATED, CONFLICT_REVISION, EXPIRED | identity.session.started, identity.session.revoked | no |
| `identity.session.revoke` | identity.session.revoke | { sessionId?, allOthers?: boolean } | { revokedCount } | NOT_FOUND, UNAUTHENTICATED | identity.session.revoked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.session.list_own` | identity.session.read_own | { kind?: vault_unlock\|relay_token, status?: active\|all, limit? (1..50) } | { items: [{ sessionId, kind, relayId?, startedAt, lastSeenAt, uaLabel?, ipPrefix?, status }] } | UNAUTHENTICATED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.session.started` | P3 | { sessionId, kind, did, relayId?, startedAt } |
| `identity.session.revoked` | P3 | { sessionId, kind, did, reason } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.device_key.revoked` | end sessions started with that device key (relay tokens at the next identity document fetch, vault unlock sessions immediately) with reason device_revoked |
| `identity.recovery.completed` | end all relay tokens and lock the vault session with reason recovery |
| `security.role.assigned` | relay only - rotate or end sessions of the DID so new relay privileges apply from the next request |
| `security.role.revoked` | relay only - end sessions of the DID so the removed relay privileges apply from the next request |
| `privacy.deletion.completed` | vault erase - end all sessions and delete stored token hashes with reason erased |

### Module errors

_None._

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
relay command: identity.login_challenge.issue { "did": "did:key:z6Mk…", "relayId": "relay.example.org" }
-> { "challengeId": "0192f410-…", "nonce": "…43 chars…", "expiresAt": "2026-11-04T10:02:00.000Z" }
relay command: identity.session.start { "challengeId": "0192f410-…", "did": "did:key:z6Mk…", "deviceKeyPublic": "…", "nonce": "…", "signature": "…" }
-> 201 { "sessionId": "0192f411-…", "token": "…43 chars…", "idleExpiresAt": "2026-11-11T10:00:00.000Z", "absoluteExpiresAt": "2026-12-04T10:00:00.000Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T05 | unit | PS-054-02.R02, PS-054-04.R01 | vault unlock with wrong passphrase 6 times then correct; idle timeout 15 min | backoff schedule applied; unlock succeeds; auto-lock after 15 minutes measured with monotonic clock |
| TEST-PS-054-09.T06 | contract | PS-054-04.R01, PS-054-04.R02, PS-054-09.R02 | each command and the query run | outputs and events validate against registry schemas |
| TEST-PS-054-09.T07 | integration | PS-054-04.R03, PS-054-02.R03 | device key revoked, recovery completed, role assigned, erase events delivered | affected sessions end with documented reasons |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
