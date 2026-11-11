# PS-057-04 — Commands, queries and events: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-04.R01** issue, revoke, endorse and set_visibility are vault commands; issue, revoke and endorse produce the signed statements classrup.identity.attestation/v1, classrup.identity.attestation_revocation/v1 and classrup.identity.attestation_endorsement/v1 signed by a device key; receive is the vault intake of someone else's statement.
- **PS-057-04.R02** issue_relay is a relay command signed with the relay key that names the relay origin, is delivered only to the subject end-to-end encrypted, and stores no personal data beyond the subject DID and date.
- **PS-057-04.R03** Every command emits its events in the same transaction as the state change.
- **PS-057-04.R04** identity.attestation.list_linkage returns the same_owner links of a DID with their status for key-linkage checks (N11).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.attestation.issue` | identity.attestation.issue | { kind: self_claim\|peer_met_in_person\|third_party\|same_owner, subjectDid, claimKey, label, contextRef?, validityDays?, audience: public (self_claim only)\|subject_only, targetRelays? } | { attestationId, cid, statement: classrup.identity.attestation/v1, syncState: local_committed } | VALIDATION_FAILED, IDENTITY_ATTESTATION_KIND_INVALID, CONFLICT_STATE, BLOCKED_PARTY, PRECONDITION_FAILED, RATE_LIMITED | identity.attestation.added | yes (Idempotency-Key) |
| `identity.attestation.receive` | identity.attestation.receive | { statement: classrup.identity.attestation/v1 or classrup.identity.attestation_endorsement/v1, provenance } | { attestationId, status, displayable: boolean, effectiveExpiresAt } | IDENTITY_ATTESTATION_SIGNATURE_INVALID, IDENTITY_ATTESTATION_KIND_INVALID, VALIDATION_FAILED, DEPENDENCY_UNAVAILABLE, RATE_LIMITED | identity.attestation.added | yes (Idempotency-Key) |
| `identity.attestation.endorse` | identity.attestation.endorse | { attestationId, publish: boolean, targetRelays?, expectedRevision } | { attestationId, revision, endorsement: classrup.identity.attestation_endorsement/v1, syncState: local_committed } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, PRECONDITION_FAILED |  | yes (Idempotency-Key) |
| `identity.attestation.revoke` | identity.attestation.revoke | { attestationId, expectedRevision } | { attestationId, revision, revocation: classrup.identity.attestation_revocation/v1 } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | identity.attestation.revoked | yes (Idempotency-Key) |
| `identity.attestation.set_visibility` | identity.attestation.set_visibility | { attestationId, visibility: public\|contacts\|private, expectedRevision } | { attestationId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `identity.attestation.issue_relay` | identity.attestation.issue_relay | { subjectDid, kind: relay_email_check, validityDays? (1..365, default 365), checkNote? (0..140 code points, no email) } | { attestationId, cid, statement: classrup.identity.attestation/v1 (issuerRelayOrigin set, audience subject_only) } | VALIDATION_FAILED, CONFLICT_STATE, FORBIDDEN, RATE_LIMITED | identity.attestation.added | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.attestation.list_for_subject` | identity.attestation.read_view | { subjectDid, includeInactive?: boolean, cursor?, limit? (1..50) } | { items: [TrustAttestation with signer pseudonym, fingerprint, endorsement state and lastCheckedAt], nextCursor? } | NOT_FOUND |
| `identity.attestation.list_issued` | identity.attestation.read_issued | { status?: active\|all, cursor?, limit? (1..50) } | { items: TrustAttestation[], nextCursor? } |  |
| `identity.attestation.list_linkage` | identity.attestation.read_linkage | { did, includeInactive?: boolean } | { items: [{ otherDid, attestationCid, status: active\|revoked\|expired }] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.attestation.added` | P1 | { attestationId, kind, subjectDid, issuerDid, effectiveExpiresAt, displayable, origin } |
| `identity.attestation.revoked` | P1 | { attestationId, kind, subjectDid, issuerDid, reason: issuer_revoked\|key_retired\|tombstoned\|expired } |

### Events consumed

| Type | Effect |
|---|---|
| `federation.tombstone.applied` | mark the targeted attestation revoked with reason tombstoned only when the tombstone author equals issuerDid and its signer key was active; a tombstone signed by an origin relay only drops that relay from provenance and the attestation stays active |
| `identity.portable_doc.published` | origin received - re-verify attestations, endorsements and cosignatures signed by keys of that DID; statements first seen before a revocation stay valid, later ones are rejected, quarantined ones re-verify |
| `identity.device_key.revoked` | own principal only - statements this vault issued stay valid for viewers who first saw them before the revocation; refresh the displayed signer device and warn that the revoked key cannot sign new ones |
| `federation.peer.added` | add the peer relay key to the relay key set and re-check relay_email_check attestations naming that relay |
| `federation.peer.removed` | remove the peer relay key from the relay key set unless the viewer selected that relay, and re-check affected relay_email_check attestations |
| `privacy.deletion.completed` | final cleanup only - the DeletionPort steps already revoked own public attestations where chosen, deleted the rest and pseudonymized attestations kept as evidence |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| IDENTITY_ATTESTATION_SIGNATURE_INVALID | 422 | no | attestation, revocation, endorsement or cosignature signature does not verify with an active key of the stated signer |
| IDENTITY_ATTESTATION_KIND_INVALID | 422 | no | issuer, subject, cosignature or relay key do not satisfy the rules of the attestation kind |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles (N2): classrup.identity.attestation/v1 - a device key of issuerDid active in its document, or for relay_email_check the relay key listed for issuerRelayOrigin; classrup.identity.attestation_revocation/v1 - the original issuer; classrup.identity.attestation_endorsement/v1 and the same_owner cosignature - a device key of subjectDid. Relay key set - descriptors from /.well-known/classrup-relay.json of F15.S02.M01 fetched over HTTPS from issuerRelayOrigin, peer records of F11.S03.M01, key records of F16.S02.M02, and rotations via classrup.federation.key_rotation/v1 (F11.S03.M01); retired keys keep verifying old statements with 'signer key retired'. Display rule - the badge for relay_email_check reads 'Email check claimed by relay <host>' followed by 'this shows they said so', and no UI string for any kind says 'verified'. Statements from blocked DIDs are dropped silently (N7).

### Example

```
vault command: identity.attestation.issue { "kind": "peer_met_in_person", "subjectDid": "did:key:z6Mk…", "claimKey": "met_in_person", "label": "Met at the Saturday swap meet", "contextRef": { "type": "meetup", "id": "0192f460-…" }, "audience": "subject_only" }
-> { "attestationId": "0192f461-…", "cid": "sha256-Qm…", "syncState": "local_committed", "statement": { "type": "classrup.identity.attestation/v1", "author": "did:key:z6MkIssuer…", "keyId": "…device…", "payload": { "subject": "did:key:z6Mk…", "claimKey": "met_in_person", "contextRef": { "type": "meetup", "blindedRef": "…" } }, "sig": "…" } }
subject vault: identity.attestation.endorse { "attestationId": "0192f462-…", "publish": true, "expectedRevision": 1 } -> endorsement queued to the subject's relays
meaning shown to viewers: "Signed by Riverstone (fingerprint 7Qx2 9mKp R4tW 8vNe) on 2026-11-04. This shows they said so; it does not prove it is true."
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T06 | contract | PS-057-04.R01, PS-057-04.R02, PS-057-04.R03 | all commands, queries and events run | outputs, statements, endorsements and payloads validate against registry schemas; signatures verify; events in the same transaction |
| TEST-PS-057-09.T17 | integration | PS-057-02.R05, PS-057-04.R04 | A issues same_owner about B, B co-signs; list_linkage for A and B; a same_owner with only A's signature | linkage returned for both with status active; the single-signature one rejected with IDENTITY_ATTESTATION_KIND_INVALID |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S03.M01, F15.S02.M01, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
