# PS-091-04 — Commands, queries and events: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-04.R01** The module exposes propose, receive_offer, accept, receive_accept, suspend, reinstate, remove and update commands plus list, get and resolve queries.
- **PS-091-04.R02** Each command states whether it is vault-local, produces a signed statement, or is a relay command, and emits its events in the same local transaction.
- **PS-091-04.R03** The module consumes rejection, conflict and delivery failure events to maintain health scores for relay-attributable faults only, plus the flag and deletion events.
- **PS-091-04.R04** Health penalties apply only to relay-attributable faults (invalid signatures, cids or canonical forms it forwarded, invalid request signatures, forwarding traffic relays never forward, quota breaches, receipts it signed that contradict each other, and equivocation signed by its own relay key); author forks, local-policy rejections and gap or buffer codes never change a peer's health.
- **PS-091-04.R05** Peer statements and signer roles are registered with F11.S01.M01 (N2); peer_offer by the proposing relay key, peer_accept by the accepting relay key, key_rotation by the current pinned key and relay_identity by the relay key it names, all signed through the StatementPublisherPort.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `federation.peer.propose` | federation.peer.propose | [relay-local command; produces signed statement classrup.federation.peer_offer/v1 through the StatementPublisherPort and posts it to the target's POST /fed/v1/peer-offer; in the vault it starts a selected_relay record] { baseUrl, kind, direction, trustLevel? default standard } | { peerId, status: proposed, offerStatementCid?, fingerprint } | FEDERATION_PEER_URL_INVALID, FEDERATION_KEY_MISMATCH, FEDERATION_PEER_LIMIT, VALIDATION_FAILED, FEATURE_DISABLED, RATE_LIMITED |  | yes (Idempotency-Key) |
| `federation.peer.receive_offer` | federation.peer.receive_offer | [relay command, POST /fed/v1/peer-offer, open to relays not yet allowlisted; consumes classrup.federation.peer_offer/v1] { offer: Envelope ≤ 8 KiB } | { peerId, status: proposed, origin: inbound\|merged, offerExpiresAt } | FED_SIGNATURE_INVALID, PAYLOAD_TOO_LARGE, RATE_LIMITED, FEDERATION_PEER_URL_INVALID, FEDERATION_PEER_LIMIT, VALIDATION_FAILED, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `federation.peer.accept` | federation.peer.accept | [relay-local command on an inbound proposed Peer; produces classrup.federation.peer_accept/v1 through the StatementPublisherPort and posts it to the proposer's POST /fed/v1/peer-accept; vault-local for selected_relay after the identity statement verified] { peerId, expectedRevision, fingerprintConfirmed: true, listInIdentityDoc? } | { peerId, revision, status: active } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FED_SIGNATURE_INVALID, PRECONDITION_FAILED, VALIDATION_FAILED, FEATURE_DISABLED | federation.peer.added | yes (Idempotency-Key) |
| `federation.peer.receive_accept` | federation.peer.receive_accept | [relay command, POST /fed/v1/peer-accept; consumes classrup.federation.peer_accept/v1] { accept: Envelope ≤ 8 KiB } matched to a proposed outbound Peer by offerStatementCid | { peerId, status: proposed\|active, awaitingFingerprint: boolean } | NOT_FOUND, FED_SIGNATURE_INVALID, PAYLOAD_TOO_LARGE, CONFLICT_STATE, PRECONDITION_FAILED | federation.peer.added | yes (Idempotency-Key) |
| `federation.peer.suspend` | federation.peer.suspend | [vault-local or relay-local command] { peerId, expectedRevision, reason: operator\|health\|key_mismatch\|equivocation\|compromise } | { peerId, revision, status: suspended } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | federation.peer.suspended | yes (Idempotency-Key) |
| `federation.peer.reinstate` | federation.peer.reinstate | [vault-local or relay-local command] { peerId, expectedRevision, fingerprintConfirmed: true } | { peerId, revision, status: active } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, PRECONDITION_FAILED | federation.peer.reinstated | yes (Idempotency-Key) |
| `federation.peer.remove` | federation.peer.remove | [vault-local or relay-local command] { peerId, expectedRevision } | { peerId, revision, status: removed } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | federation.peer.removed | yes (Idempotency-Key) |
| `federation.peer.update` | federation.peer.update | [vault-local or relay-local command; key rotation consumes a statement classrup.federation.key_rotation/v1] { peerId, expectedRevision, trustLevel?, quotas?, listInIdentityDoc?, rotation?: Envelope } | { peerId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, FEDERATION_KEY_MISMATCH |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `federation.peer.list` | federation.peer.read | { status?, kind?, origin?, cursor?, limit ≤ 50 } | { items: Peer[], nextCursor? } |  |
| `federation.peer.get` | federation.peer.read | { peerId } | { peer: Peer, quotaUse: { envelopesLastHour, batchesLastMinute, storedBytes } } | NOT_FOUND |
| `federation.peer.resolve_key` | federation.peer.resolve | { keyId } | { peerId, relayId, status, trustLevel, quotaRemaining } or none | FEDERATION_PEER_NOT_ALLOWED, FEDERATION_QUOTA_EXCEEDED |

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
| `federation.record.rejected` | relay-attributable codes only: lower the sending peer's health by 5 per FED_SIGNATURE_INVALID, FEDERATION_CID_MISMATCH or FEDERATION_ENVELOPE_NOT_CANONICALIZABLE it forwarded (max 25 per hour) and by 2 per FEDERATION_REQUEST_SIGNATURE_INVALID or FEDERATION_ORIGIN_MISMATCH (max 10 per hour); FEDERATION_NOT_ACCEPTED, FEDERATION_SIGNER_ROLE_INVALID, FEDERATION_TOMBSTONED, FEDERATION_RECORD_TIME_INVALID, FEDERATION_PAYLOAD_INVALID, gap and buffer codes are ignored |
| `federation.conflict.detected` | only when the conflict's author is the pinned relay key of a peer (equivocation signed by that relay): lower its health by 20 and suspend with reason equivocation on the second such conflict within 24 h; author forks and commitment conflicts are ignored |
| `federation.delivery.failed` | transport reasons (timeout, unreachable, 5xx) lower the destination peer's health by 1 per entry (max 10 per hour); reason receipt_equivocation (two receipts signed by the peer key for one cid with different outcomes) lowers it by 20; per-envelope rejections by the peer's own policy are ignored |
| `platform.flag.changed` | when F11 turns off, freeze health scores and mark peer_relay peers dormant; selected_relay peers are unaffected |
| `privacy.deletion.completed` | vault: delete the deleted principal's selected-relay list after the DeletionPort plan ran; relay peer records hold no user data and are unchanged |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FEDERATION_PEER_URL_INVALID | 422 | no | base URL is not https on 443, resolves to a non-public address or redirects |
| FEDERATION_KEY_MISMATCH | 409 | no | peer key differs from the pinned key without a valid rotation statement, or the rotation overlap ended |
| FEDERATION_PEER_LIMIT | 409 | no | 200 peers per tenant reached or relay id already present |
| FEDERATION_PEER_NOT_ALLOWED | 403 | no | key id does not resolve to an active allowlisted peer or registered device key |
| FEDERATION_QUOTA_EXCEEDED | 429 | yes | peer exceeded its envelope, batch or storage quota; retryAfterMs set |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
relay A: federation.peer.propose { baseUrl: "https://relay-b.example", kind: "peer_relay", direction: "both" }
-> { peerId: "0192f3d0-...", status: "proposed", offerStatementCid: "sha256-Zk...", fingerprint: "7F3A 91C2 0B5D E418 ..." }   POST https://relay-b.example/fed/v1/peer-offer
relay B: federation.peer.receive_offer { offer } -> { peerId: "0192f3d9-...", status: "proposed", origin: "inbound", offerExpiresAt: "2026-11-18T10:00:00.000Z" }
relay B operator: federation.peer.accept { peerId: "0192f3d9-...", expectedRevision: 1, fingerprintConfirmed: true } -> { status: "active" }   POST https://relay-a.example/fed/v1/peer-accept
relay A: federation.peer.receive_accept { accept } -> { peerId: "0192f3d0-...", status: "active", awaitingFingerprint: false }   emits federation.peer.added
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T01 | integration | PS-091-03.R04, PS-091-01.R01, PS-091-04.R02 | A proposes to B; B's receive_offer stores an inbound proposed Peer; B's operator accepts with fingerprint confirmed; A's receive_accept verifies it | both Peer rows active with both opt-in flags and fingerprintConfirmedAt; federation.peer.added emitted on both sides |
| TEST-PS-091-09.T07 | integration | PS-091-04.R03, PS-091-07.R01, PS-091-09.R02 | peer P forwards 6 envelopes with invalid signatures, then two conflicts among statements signed by P's relay key within 24 h | health drops by 25 (cap) then 20; suspension with reason equivocation and federation.peer.suspended emitted |
| TEST-PS-091-09.T08 | contract | PS-091-04.R01, PS-091-04.R05, PS-091-09.R03 | each command, query and event; peer_offer, peer_accept, key_rotation and relay_identity statements | validate against registry schemas and signer roles of F11.S01.M01 |
| TEST-PS-091-09.T19 | abuse | PS-091-04.R04 | malicious author forks twice via honest relays A and B; throwaway did:keys trigger FEDERATION_SIGNER_ROLE_INVALID, FEDERATION_NOT_ACCEPTED and gap codes through peer A | no health change and no suspension for A or B |
| TEST-PS-091-09.T23 | integration | PS-091-04.R03 | flag F11 off then on | peer_relay health frozen and peers dormant; selected relays keep working; scores resume |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F15.S04.M02, F07.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
