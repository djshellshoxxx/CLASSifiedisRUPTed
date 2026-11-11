# PS-054-04 — Commands, queries and events: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-04.R01** unlock, lock and change_passphrase (which re-wraps the vault keystore under a new passphrase-derived key) operate in the vault with no statement; challenge, start, rotate and revoke for relay tokens are relay commands, and the start request carries a signature by the device key.
- **PS-054-04.R02** Every command emits its events in the same transaction as the state change, and rotate emits identity.session.revoked for the old session only when the grace ends.
- **PS-054-04.R03** The module consumes device key, recovery, identity document and erase events to end sessions - in the vault it revokes the affected relay tokens on every known relay through the outbox, and on a relay it ends tokens whose device key is no longer active in the stored document.
- **PS-054-04.R04** Vault lock and principal switch (unlocking another principal's vault on this device locks the current one first) drop the in-memory raw relay access tokens and the vault key in the same step, end the vault_unlock session with endReason locked or principal_switch, and send CLEAR_USER_CACHES { reason: lock|principal_switch, partition } to the F15.S01.M02 service worker; outbox entries stay queued unsent, and the next unlock re-runs the relay challenge-response before any relay call.
- **PS-054-04.R05** On a relay, identity.session.linked_keys is an in-process read for the host's anti-shill checks (F04.S02.M01 linked_host_registration, N11) that returns, for one relay access-token session and its rotation successors, the starting device key and the requestSignerKeys accepted with that token, never IP addresses, network ranges or timing, and is never served over HTTP.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.session.unlock` | identity.session.unlock | { passphrase \| platformKeyHandle, idleTimeoutMs? } | { sessionId, kind: vault_unlock, idleExpiresAt } | UNAUTHENTICATED, RATE_LIMITED, VALIDATION_FAILED | identity.session.started | no |
| `identity.session.lock` | identity.session.lock | { sessionId, reason?: locked\|principal_switch (default locked) } | { sessionId, status: revoked, droppedRelayTokens: int, cacheMessage: CLEAR_USER_CACHES } | NOT_FOUND | identity.session.revoked | yes (Idempotency-Key) |
| `identity.session.change_passphrase` | identity.session.change_passphrase | { currentPassphrase, newPassphrase } | { rewrappedKeyCount, lockedOtherSessions } | UNAUTHENTICATED, VALIDATION_FAILED, RATE_LIMITED, CONFLICT_STATE | identity.session.revoked | no |
| `identity.login_challenge.issue` | identity.login_challenge.issue | { did, relayId } | { challengeId, nonce, expiresAt } | RATE_LIMITED, VALIDATION_FAILED |  | no |
| `identity.session.start` | identity.session.start | { challengeId, did, deviceKeyPublic, nonce, signature, identityDocument?: classrup.identity.portable_doc/v1 (sent on first login to a relay or when asked to refresh) } | { sessionId, token (shown once), idleExpiresAt, absoluteExpiresAt } | UNAUTHENTICATED, RATE_LIMITED, VALIDATION_FAILED, DEPENDENCY_UNAVAILABLE | identity.session.started | no |
| `identity.session.rotate` | identity.session.rotate | { expectedRevision } | { sessionId, token (shown once), idleExpiresAt, absoluteExpiresAt, oldTokenGraceUntil } | UNAUTHENTICATED, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED | identity.session.started | no |
| `identity.session.revoke` | identity.session.revoke | { sessionId?, allOthers?: boolean, deviceKeyPublic?: string (end every token of this DID started with that key) } | { revokedCount } | NOT_FOUND, UNAUTHENTICATED | identity.session.revoked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.session.linked_keys` | identity.session.read_linkage | { publicKey } | { items: [{ sessionChainId, did, deviceKeys: publicKey[] (starting key plus requestSignerKeys), status }] } - no IP prefix, user agent or times | FORBIDDEN |
| `identity.session.list_own` | identity.session.read_own | { kind?: vault_unlock\|relay_token, status?: active\|all, limit? (1..50) } | { items: [{ sessionId, kind, relayId?, startedAt, lastSeenAt, uaLabel?, ipPrefix?, status }] } | UNAUTHENTICATED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.session.started` | P3 | { sessionId, kind, did, relayId?, startedAt } |
| `identity.session.revoked` | P3 | { sessionId, kind, did, reason: locked\|principal_switch\|idle\|absolute\|user_revoked\|device_revoked\|recovery\|erased\|limit\|rotated\|passphrase_changed } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.device_key.revoked` | vault - lock vault unlock sessions of that device at once and queue identity.session.revoke with deviceKeyPublic on every relay where this vault holds a session, after the reissued document; reason device_revoked |
| `identity.recovery.completed` | vault - queue identity.session.revoke for every relay token of the revoked keys on each known relay through the outbox and lock the vault session with reason recovery |
| `identity.portable_doc.published` | relay runtime only, origin relay_stored - end within 60 s every token whose deviceKeyPublic is no longer active in the stored document, endReason device_revoked (CAP-6) |
| `security.role.assigned` | relay only - rotate or end sessions of the DID so new relay privileges apply from the next request |
| `security.role.revoked` | relay only - end sessions of the DID so the removed relay privileges apply from the next request |
| `privacy.deletion.completed` | final cleanup only - the DeletionPort steps already ended sessions and deleted stored token hashes; remove leftovers with reason erased |

### Module errors

_None._

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** No signed statements are produced (N2). Lock and principal switch post CLEAR_USER_CACHES { reason: lock|principal_switch, partition } to the F15.S01.M02 service worker after the raw relay tokens and the vault key are dropped. On a relay, a request that bears a valid token and also carries an F11.S01.M03 request signature by a device key other than the session's key adds that key to requestSignerKeys (at most 20); identity.session.linked_keys is called in-process by the host's anti-shill checks only. The login signature is a challenge response over classrup-login:v1:<relayId>:<nonce>, domain-separated from every statement prefix. Key status comes from F07.S02.M01 (KeyStatusPort and the relay's stored documents). In the vault, identity.session.revoke for relay tokens is queued per relay in the sync outbox after the reissued identity document, so a relay that comes back online first stores the document and then processes the revoke.

### Example

```
relay command: identity.login_challenge.issue { "did": "did:key:z6Mk…", "relayId": "relay.example.org" }
-> { "challengeId": "0192f410-…", "nonce": "…43 chars…", "expiresAt": "2026-11-04T10:02:00.000Z" }
relay command: identity.session.start { "challengeId": "0192f410-…", "did": "did:key:z6Mk…", "deviceKeyPublic": "…", "nonce": "…", "signature": "…", "identityDocument": { "type": "classrup.identity.portable_doc/v1", … } }
-> 201 { "sessionId": "0192f411-…", "token": "…43 chars…", "idleExpiresAt": "2026-11-11T10:00:00.000Z", "absoluteExpiresAt": "2026-12-04T10:00:00.000Z" }
any start failure -> 401 { "code": "UNAUTHENTICATED" } (same body and timing class for every reason)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T04 | integration | PS-054-03.R03, PS-054-04.R02, PS-054-06.R01 | rotate a token with an injected clock | old session rotating and accepted for 30 s, then revoked with reason rotated and identity.session.revoked emitted at grace end, not at the rotate call; new token works; one transaction |
| TEST-PS-054-09.T06 | contract | PS-054-04.R01, PS-054-04.R02 | each command and the query run | outputs and events validate against registry schemas; revoked reason values include rotated and passphrase_changed |
| TEST-PS-054-09.T07 | integration | PS-054-04.R03 | identity.device_key.revoked, identity.recovery.completed, security.role.assigned and erase cleanup delivered | vault queues revokes per relay and locks; relay ends role-affected sessions; documented reasons set |
| TEST-PS-054-09.T18 | integration | PS-054-04.R03, PS-054-05.R03 | injected clock - A1 revoked in the vault while sessions exist on relays R and S | vault publishes the new document to R and S and queues revokes; each relay ends A1's tokens within 60 s of storing the document with endReason device_revoked |
| TEST-PS-054-09.T19 | integration | PS-054-04.R01, PS-054-02.R05, PS-054-05.R01 | change_passphrase with a crash midway; then a full change; weak new passphrase | after the crash the old passphrase unlocks and the new does not; after success the old fails with UNAUTHENTICATED and other tabs are locked; weak passphrase VALIDATION_FAILED |
| TEST-PS-054-09.T22 | integration | PS-054-04.R04, PS-054-03.R02 | P1 unlocked with relay tokens for R and S and 3 queued outbox entries locks the vault; then P2 unlocks its own vault on the same device while P1 is unlocked | on lock the raw tokens and vault key are gone from memory, the session ends with endReason locked, CLEAR_USER_CACHES reason lock is posted to the F15.S01.M02 worker stub and the entries stay unsent; P2's unlock locks P1 with endReason principal_switch and CLEAR_USER_CACHES reason principal_switch; P1's next unlock re-runs challenge-response before sending |
| TEST-PS-054-09.T23 | abuse | PS-054-04.R05, PS-054-05.R03 | session of seller key S1 on host H accepts a signed request by key B1 with S1's token; linked_keys called in-process for B1 and over HTTP | in-process result lists S1 and B1 in one session chain without IP prefix, user agent or times; the HTTP call is refused with FORBIDDEN |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F15.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
