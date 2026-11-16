# PS-062-04 — Commands, queries and events: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-04.R01** The vault commands sign and revoke produce signed statements and are called by owning modules or the UI; accept is a vault command invoked by the transport layer for inbound statements.
- **PS-062-04.R02** Each command emits its event in the same IndexedDB transaction as the stored record (CTR-EVT-001 EVT-8).
- **PS-062-04.R03** Verify and list are pure vault queries with no side effects, so any module can call them at any time.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.consent.sign` | comms.consent.sign | [vault command; produces signed statement classrup.comms.consent/v1] { subjectType, subjectRef, subjectRevision, subjectRevisionHash, statementKey, statementTextHash, kind: consent\|decline, readConfirmed: true } | { consentId, signedAtClaim, revision: 1, statement } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, COMMS_CONSENT_STATEMENT_UNKNOWN, COMMS_CONSENT_SUBJECT_MISMATCH, COMMS_CONSENT_STALE, RATE_LIMITED | comms.consent.signed | yes (Idempotency-Key) |
| `comms.consent.revoke` | comms.consent.revoke | [vault command; produces signed statement classrup.comms.consent/v1 with kind revocation] { consentId, expectedRevision } | { consentId, revision, revocationId } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, COMMS_CONSENT_NOT_REVOCABLE | comms.consent.revoked | yes (Idempotency-Key) |
| `comms.consent.accept` | comms.consent.accept | [vault command, internal; verifies a signed statement received from another party] { statement, provenance } | { consentId, status: valid\|quarantined } | VALIDATION_FAILED, COMMS_CONSENT_SIGNATURE_INVALID, COMMS_CONSENT_SUBJECT_MISMATCH, FORBIDDEN, RATE_LIMITED | comms.consent.received | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.consent.verify` | comms.consent.verify | [vault query, pure] { subjectType, subjectRef, subjectRevisionHash, signerDid, statementKey } | { result: valid\|stale\|revoked\|conflicted\|missing, consentId?, signedAtClaim?, clockSuspect? } | VALIDATION_FAILED |
| `comms.consent.list_for_subject` | comms.consent.read | [vault query] { subjectType, subjectRef, limit ≤ 100 } | { items: ConsentStatement[] } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.consent.signed` | P2 | { consentId, signerDid, subjectType, subjectRef, subjectRevision, subjectRevisionHash, statementKey, kind } |
| `comms.consent.revoked` | P2 | { consentId, revocationId, signerDid, subjectType, subjectRef } |
| `comms.consent.received` | P2 | { consentId, signerDid, subjectType, subjectRef, subjectRevisionHash, kind, provenance } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.device_key.revoked` | record the revocation time; consents first seen after it and signed by that key are rejected |
| `identity.device_key.added` | add the key to the signer device list so its signatures verify |
| `privacy.deletion.completed` | erase consent statements of the local vault after export prompts; evidence copies in other vaults remain |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_CONSENT_STATEMENT_UNKNOWN | 422 | no | statement key is not in the registry or its text hash does not match |
| COMMS_CONSENT_SUBJECT_MISMATCH | 409 | no | subject revision hash does not match the canonical bytes of the subject |
| COMMS_CONSENT_STALE | 409 | no | subject has a newer revision than the one being signed |
| COMMS_CONSENT_SIGNATURE_INVALID | 422 | no | signature does not verify or the signing key is not valid for the signer |
| COMMS_CONSENT_NOT_REVOCABLE | 409 | no | consent is already revoked or the owning module has committed the subject |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.consent.sign
{ "subjectType": "mutiny_cycle", "subjectRef": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "subjectRevision": 3,
  "subjectRevisionHash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  "statementKey": "consent.mutiny.cycle.commit.v1", "statementTextHash": "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
  "kind": "consent", "readConfirmed": true }
-> { "consentId": "sha256-3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b", "signedAtClaim": "2026-11-04T10:00:00.000Z", "revision": 1 }
vault query comms.consent.verify  { "subjectType": "mutiny_cycle", "subjectRef": "…", "subjectRevisionHash": "9f86…", "signerDid": "did:key:z6Mk…", "statementKey": "consent.mutiny.cycle.commit.v1" }
-> { "result": "valid", "consentId": "sha256-3a7b…" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T06 | contract | PS-062-04.R01, PS-062-04.R02, PS-062-04.R03, PS-062-09.R02 | each command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-062-09.T14 | a11y | PS-062-04.R01 | confirm sheet with screen reader and keyboard | wording readable, Sign disabled until confirmation, verification result announced, zero serious axe issues |

## Dependencies

Module depends on: F07.S01.M01, F16.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
