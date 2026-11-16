# PS-055-04 — Commands, queries and events: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-04.R01** Issue is a vault command that produces the signed statement classrup.identity.portable_doc/v1; receive is the vault intake of someone else's document; publish and the public read are relay endpoints.
- **PS-055-04.R02** The event identity.portable_doc.published is emitted when a document is issued locally and when a relay stores a verified document, in the same transaction as the state change.
- **PS-055-04.R03** Documents are public P0 statements and are only sent to relays the owner selected or directly to peers.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.portable_doc.issue` | identity.portable_doc.issue | { relays?: array of at most 5 URLs, expectedSeq } | { docId, seq, cid, statement: classrup.identity.portable_doc/v1 (signed), syncState: local_committed } | CONFLICT_STATE, CONFLICT_REVISION, VALIDATION_FAILED | identity.portable_doc.published | yes (Idempotency-Key) |
| `identity.portable_doc.receive` | identity.portable_doc.receive | { document: classrup.identity.portable_doc/v1, provenance } | { docId, status: current\|superseded\|contested\|history, did, seq } | IDENTITY_DOC_SIGNATURE_INVALID, IDENTITY_DOC_CHAIN_INVALID, VALIDATION_FAILED, BLOCKED_PARTY |  | yes (Idempotency-Key) |
| `identity.portable_doc.publish` | identity.portable_doc.publish | { document: classrup.identity.portable_doc/v1 } | { docId, seq, cid, storedAt } | IDENTITY_DOC_SIGNATURE_INVALID, IDENTITY_DOC_CHAIN_INVALID, VALIDATION_FAILED, RATE_LIMITED | identity.portable_doc.published | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.portable_doc.get` | identity.portable_doc.read_public | { did, seq?, includeHistory?: boolean } | { document: classrup.identity.portable_doc/v1, status, provenance, history?: array of at most 20 } | NOT_FOUND |
| `identity.portable_doc.list_contested` | identity.portable_doc.read_own | { limit? (1..50) } | { items: [{ did, versions: array, detectedAt }] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.portable_doc.published` | P0 | { did, seq, cid, origin: own\|relay_stored, issuedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.device_key.added` | own document becomes stale and the reissue prompt is shown |
| `identity.device_key.revoked` | own document becomes stale; reissue lists the key as revoked with revokesEffectiveAt |
| `identity.pseudonym.changed` | own document becomes stale until reissued |
| `privacy.deletion.completed` | vault erase - delete all documents; relays keep documents until a signed tombstone arrives (PRV-6) |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| IDENTITY_DOC_SIGNATURE_INVALID | 422 | no | DID derivation or Ed25519 signature check failed |
| IDENTITY_DOC_CHAIN_INVALID | 409 | no | seq or prev does not extend the stored chain |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command: identity.portable_doc.issue { "expectedSeq": 3, "relays": ["https://relay.example.org"] }
-> { "docId": "0192f430-…", "seq": 4, "cid": "sha256-Qm…", "syncState": "local_committed", "statement": { "v": 1, "type": "classrup.identity.portable_doc/v1", "author": "did:key:z6Mk…", "seq": 4, "prev": "sha256-Zx…", "payload": { "pseudonym": "Riverstone", "deviceKeys": [ … ], "relays": [ … ] }, "sig": "…" } }
relay query: POST /api/v1/query/identity.portable_doc.get { "did": "did:key:z6Mk…" } -> 200 { "document": { … }, "status": "current" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T07 | contract | PS-055-04.R01, PS-055-04.R02, PS-055-04.R03, PS-055-09.R02 | commands, queries and the event run | outputs, statement and payload validate against registry schemas |
| TEST-PS-055-09.T08 | integration | PS-055-04.R03, PS-055-05.R01 | device key added and pseudonym changed events | own current document becomes stale; reissue creates seq plus 1 and supersedes |
| TEST-PS-055-09.T13 | a11y | PS-055-04.R03, PS-055-01.R03 | identity document and contact screens with axe-core | zero serious or critical issues; contested warning announced |

## Dependencies

Module depends on: F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
