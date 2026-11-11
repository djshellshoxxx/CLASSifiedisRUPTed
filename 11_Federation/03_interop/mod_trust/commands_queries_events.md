# PS-091-04 — Commands, queries and events: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-04.R01** The module exposes propose, accept, suspend, reinstate, remove and update commands plus list, get and resolve queries.
- **PS-091-04.R02** Each command states whether it is vault-local, produces a signed statement, or is a relay command, and emits its events in the same local transaction.
- **PS-091-04.R03** The module consumes rejection, fork and delivery failure events to maintain health scores and the flag event to pause peering.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `federation.peer.propose` | federation.peer.propose | [vault-local or relay-local command; produces signed statement classrup.federation.peer_offer/v1] { baseUrl, kind, direction, trustLevel? default standard } | { peerId, status: proposed, offerStatementCid, fingerprint } | FEDERATION_PEER_URL_INVALID, FEDERATION_KEY_MISMATCH, FEDERATION_PEER_LIMIT, VALIDATION_FAILED, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `federation.peer.accept` | federation.peer.accept | [vault-local or relay-local command; consumes and produces peer_accept statements classrup.federation.peer_accept/v1] { peerId, expectedRevision, fingerprintConfirmed: true } | { peerId, revision, status: active } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FED_SIGNATURE_INVALID, PRECONDITION_FAILED, FEATURE_DISABLED | federation.peer.added | yes (Idempotency-Key) |
| `federation.peer.suspend` | federation.peer.suspend | [vault-local or relay-local command] { peerId, expectedRevision, reason: operator\|health\|key_mismatch\|equivocation\|compromise } | { peerId, revision, status: suspended } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | federation.peer.suspended | yes (Idempotency-Key) |
| `federation.peer.reinstate` | federation.peer.reinstate | [vault-local or relay-local command] { peerId, expectedRevision, fingerprintConfirmed: true } | { peerId, revision, status: active } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, PRECONDITION_FAILED | federation.peer.reinstated | yes (Idempotency-Key) |
| `federation.peer.remove` | federation.peer.remove | [vault-local or relay-local command] { peerId, expectedRevision } | { peerId, revision, status: removed } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | federation.peer.removed | yes (Idempotency-Key) |
| `federation.peer.update` | federation.peer.update | [vault-local or relay-local command; key rotation consumes a statement classrup.federation.key_rotation/v1] { peerId, expectedRevision, trustLevel?, quotas?, rotation?: Envelope } | { peerId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, FEDERATION_KEY_MISMATCH |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `federation.peer.list` | federation.peer.read | { status?, kind?, cursor?, limit ≤ 50 } | { items: Peer[], nextCursor? } |  |
| `federation.peer.get` | federation.peer.read | { peerId } | { peer: Peer, quotaUse: { envelopesLastHour, batchesLastMinute, storedBytes } } | NOT_FOUND |
| `federation.peer.resolve_key` | federation.peer.resolve | { keyId } | { peerId, relayId, status, trustLevel, quotaRemaining } or none | FEDERATION_PEER_NOT_ALLOWED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `federation.peer.added` | P1 | { peerId, relayId, kind, direction, trustLevel } |
| `federation.peer.suspended` | P1 | { peerId, relayId, reason } |
| `federation.peer.reinstated` | P1 | { peerId, relayId } |
| `federation.peer.removed` | P1 | { peerId, relayId } |

### Events consumed

| Type | Effect |
|---|---|
| `federation.record.rejected` | lower the sending peer's health score by 5 per FED_SIGNATURE_INVALID (max 25 per hour), 2 per other code (max 10 per hour) |
| `federation.conflict.detected` | lower health by 20 for each peer that delivered a candidate and suspend with reason equivocation when two forks occur within 24 h |
| `federation.delivery.failed` | lower health by 1 per failed entry to the peer (max 10 per hour) |
| `platform.flag.changed` | when F11 turns off, freeze health scores and mark peer_relay peers dormant; selected_relay peers are unaffected |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FEDERATION_PEER_URL_INVALID | 422 | no | base URL is not https on 443, resolves to a non-public address or redirects |
| FEDERATION_KEY_MISMATCH | 409 | no | peer key differs from the pinned key without a valid rotation statement |
| FEDERATION_PEER_LIMIT | 409 | no | 200 peers per tenant reached or relay id already present |
| FED_SIGNATURE_INVALID | 400 | no | peer statement signature check failed |
| FEDERATION_PEER_NOT_ALLOWED | 403 | no | key id does not resolve to an active peer |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
federation.peer.propose { baseUrl: "https://relay.example", kind: "peer_relay", direction: "both" }
-> { peerId: "0192f3d0-...", status: "proposed", offerStatementCid: "sha256-Zk...", fingerprint: "7F3A 91C2 0B5D E418 ..." }
federation.peer.accept { peerId: "0192f3d0-...", expectedRevision: 1, fingerprintConfirmed: true }
-> { peerId: "0192f3d0-...", revision: 2, status: "active" }   emits federation.peer.added
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T01 | integration | PS-091-01.R01, PS-091-01.R02, PS-091-04.R02 | A proposes to B; B accepts with fingerprint confirmed | both Peer rows active with both opt-in flags; federation.peer.added emitted |
| TEST-PS-091-09.T07 | integration | PS-091-04.R03, PS-091-07.R01 | 6 invalid-signature rejections, then a fork event | health drops by 25 cap then 20; suspension below 40 and federation.peer.suspended emitted |
| TEST-PS-091-09.T08 | contract | PS-091-04.R01, PS-091-04.R02, PS-091-09.R03 | each command, query and event | validate against registry schemas; statements validate against classrup.federation.peer_offer/v1 and peer_accept/v1 |

## Dependencies

Module depends on: F11.S01.M03, F15.S04.M02, F07.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
