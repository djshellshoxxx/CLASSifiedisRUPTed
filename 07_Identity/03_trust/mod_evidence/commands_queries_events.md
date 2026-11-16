# PS-057-04 — Commands, queries and events: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-04.R01** issue, revoke and set_visibility are vault commands; issue and revoke produce the signed statements classrup.identity.attestation/v1 and classrup.identity.attestation_revocation/v1; receive is the vault intake of someone else's statement.
- **PS-057-04.R02** issue_relay is a relay command signed with the relay key and stores no personal data beyond the subject DID and date.
- **PS-057-04.R03** Every command emits its events in the same transaction as the state change.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.attestation.issue` | identity.attestation.issue | { kind: self_claim\|peer_met_in_person\|third_party, subjectDid, claimKey, label, contextRef?, validityDays?, audience: subject_only\|public, targetRelays? } | { attestationId, cid, statement: classrup.identity.attestation/v1, syncState: local_committed } | VALIDATION_FAILED, IDENTITY_ATTESTATION_KIND_INVALID, CONFLICT_STATE, BLOCKED_PARTY, RATE_LIMITED | identity.attestation.added | yes (Idempotency-Key) |
| `identity.attestation.receive` | identity.attestation.receive | { statement: classrup.identity.attestation/v1, provenance } | { attestationId, status, effectiveExpiresAt } | IDENTITY_ATTESTATION_SIGNATURE_INVALID, IDENTITY_ATTESTATION_KIND_INVALID, VALIDATION_FAILED, BLOCKED_PARTY, RATE_LIMITED | identity.attestation.added | yes (Idempotency-Key) |
| `identity.attestation.revoke` | identity.attestation.revoke | { attestationId, expectedRevision } | { attestationId, revision, revocation: classrup.identity.attestation_revocation/v1 } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | identity.attestation.revoked | yes (Idempotency-Key) |
| `identity.attestation.set_visibility` | identity.attestation.set_visibility | { attestationId, visibility: public\|contacts\|private, expectedRevision } | { attestationId, revision } | NOT_FOUND, CONFLICT_REVISION |  | yes (Idempotency-Key) |
| `identity.attestation.issue_relay` | identity.attestation.issue_relay | { subjectDid, kind: relay_verified_email, validityDays? (1..365, default 365), checkNote? (0..140 code points, no email) } | { attestationId, cid, statement: classrup.identity.attestation/v1 } | VALIDATION_FAILED, CONFLICT_STATE, FORBIDDEN, RATE_LIMITED | identity.attestation.added | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.attestation.list_for_subject` | identity.attestation.read_view | { subjectDid, includeInactive?: boolean, cursor?, limit? (1..50) } | { items: [TrustAttestation with signer pseudonym and lastCheckedAt], nextCursor? } | NOT_FOUND |
| `identity.attestation.list_issued` | identity.attestation.read_issued | { status?: active\|all, cursor?, limit? (1..50) } | { items: TrustAttestation[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.attestation.added` | P1 | { attestationId, kind, subjectDid, issuerDid, effectiveExpiresAt, origin } |
| `identity.attestation.revoked` | P1 | { attestationId, subjectDid, issuerDid, reason: issuer_revoked\|key_retired\|tombstoned\|expired } |

### Events consumed

| Type | Effect |
|---|---|
| `federation.tombstone.applied` | mark the targeted attestation revoked with reason tombstoned |
| `identity.device_key.revoked` | re-verify issued statements; statements are signed by the account key so they stay valid, and only the displayed signer-device info is refreshed |
| `privacy.deletion.completed` | vault erase - delete all attestations and issued statements |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| IDENTITY_ATTESTATION_SIGNATURE_INVALID | 422 | no | attestation or revocation signature does not verify against the issuer DID |
| IDENTITY_ATTESTATION_KIND_INVALID | 422 | no | issuer and subject do not satisfy the rules of the attestation kind |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command: identity.attestation.issue { "kind": "peer_met_in_person", "subjectDid": "did:key:z6Mk…", "claimKey": "met_in_person", "label": "Met at the Saturday swap meet", "contextRef": { "type": "meetup", "id": "0192f460-…" }, "audience": "subject_only" }
-> { "attestationId": "0192f461-…", "cid": "sha256-Qm…", "syncState": "local_committed", "statement": { "type": "classrup.identity.attestation/v1", "author": "did:key:z6MkIssuer…", "payload": { "subject": "did:key:z6Mk…", "claimKey": "met_in_person" }, "sig": "…" } }
meaning shown to viewers: "Signed by Riverstone (did:key …a1b2c3d4) on 2026-11-04. This shows they said so; it does not prove it is true."
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T06 | contract | PS-057-04.R01, PS-057-04.R02, PS-057-04.R03, PS-057-09.R02 | all commands, queries and events run | outputs, statements and payloads validate against registry schemas; signatures verify |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
