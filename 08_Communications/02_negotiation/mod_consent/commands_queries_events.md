# PS-062-04 — Commands, queries and events: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-04.R01** The vault commands sign and revoke produce signed statements and are called by owning modules or the UI; accept is a vault command invoked by the transport layer for inbound statements.
- **PS-062-04.R02** Each command emits its event in the same IndexedDB transaction as the stored record (CTR-EVT-001 EVT-8).
- **PS-062-04.R03** Verify and list are pure vault queries with no side effects; verify resolves by the dedupe tuple and its result for consent plus revocation is defined in one table - valid (verified consent, no stored decline or revocation), stale (subjectRevisionHash differs from the current revision), revoked (revocation stored while the subject is not committed), conflicted (consent and decline, a revocation stored after the owning module committed, or a peer-reported invalidity), missing (no record).
- **PS-062-04.R04** Statements are registered with F11.S01.M01 (N2): classrup.comms.consent/v1 with kind consent, decline or revocation, signer role = the role the statement key requires per ConsentSubjectPort.partyRole, signed through F16.S02.M03 with context classrup/consent/v1; owning modules echo every received consent statement to all participants before they commit.
- **PS-062-04.R05** The module registers ExportSectionPort (section comms.consents, including firstSeenAt in the signed manifest), DeletionPort (plan, execute, pseudonymize - kept consents get signerDid replaced by the deletion pseudonym when keepEvidence is true and are purged otherwise) and RetentionPurgePort (RET-EVIDENCE) with F10 (N6).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.consent.sign` | comms.consent.sign | [vault command; produces signed statement classrup.comms.consent/v1 through F16.S02.M03] { subjectType, subjectRef, subjectRevision, subjectRevisionHash (ID-3 cid), statementKey, statementLocale, statementTextHash, kind: consent\|decline, readConfirmed: true } | { consentId, signedAtClaim, firstSeenAt, revision: 1, statement } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, COMMS_CONSENT_STATEMENT_UNKNOWN, COMMS_CONSENT_SUBJECT_MISMATCH, COMMS_CONSENT_STALE, RATE_LIMITED | comms.consent.signed | yes (Idempotency-Key) |
| `comms.consent.revoke` | comms.consent.revoke | [vault command; produces signed statement classrup.comms.consent/v1 with kind revocation] { target: { consentId } \| { subjectRef, subjectRevisionHash, statementKey }, expectedRevision } | { revocationId, revokedIds[], revision } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, COMMS_CONSENT_NOT_REVOCABLE | comms.consent.revoked | yes (Idempotency-Key) |
| `comms.consent.accept` | comms.consent.accept | [vault command, internal; verifies a signed statement received from another party] { statement, provenance } | { consentId, status: valid\|quarantined, aliasOf?, quarantineReason? } | VALIDATION_FAILED, COMMS_CONSENT_SIGNATURE_INVALID, COMMS_CONSENT_SUBJECT_MISMATCH, FORBIDDEN, RATE_LIMITED, BLOCKED_PARTY | comms.consent.received, comms.consent.revoked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.consent.verify` | comms.consent.verify | [vault query, pure] { subjectType, subjectRef, subjectRevisionHash, signerDid, statementKey } | { result: valid\|stale\|revoked\|conflicted\|missing, consentId?, aliasIds[], signedAtClaim?, firstSeenAt?, clockSuspect?, keyFreshness: fresh\|stale\|unknown, conflictReason?: decline\|revoked_after_commit\|peer_reported } | VALIDATION_FAILED |
| `comms.consent.list_for_subject` | comms.consent.read | [vault query] { subjectType, subjectRef, limit ≤ 100 } | { items: ConsentStatement[] including aliases } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.consent.signed` | P2 | { consentId, signerDid, subjectType, subjectRef, subjectRevision, subjectRevisionHash, statementKey, statementLocale, kind, revokes? } |
| `comms.consent.revoked` | P2 | { revocationId, revokedIds[], signerDid, subjectType, subjectRef, subjectRevisionHash, statementKey, afterCommit, origin: local\|federated } |
| `comms.consent.received` | P2 | { consentId, signerDid, subjectType, subjectRef, subjectRevision, subjectRevisionHash, statementKey, kind, aliasOf?, firstSeenAt, provenance } |

### Events consumed

| Type | Effect |
|---|---|
| `security.key.registered` | add the key for ownerPrincipal to the verifier key set and re-verify quarantined statements waiting for it (reason key_missing) |
| `security.key.revoked` | record revocationEffectiveFrom for keyId of ownerPrincipal; statements by that key first seen after it are rejected, statements first seen earlier stay valid |
| `identity.device_key.added` | own account only: add the new own device to the local signer's device list shown on the consent detail |
| `identity.device_key.revoked` | own account only: stop offering the revoked own device for signing |
| `privacy.deletion.completed` | replace remaining references to the deleted principal by the payload pseudonym in consents kept as evidence (keepEvidence true); evidence copies in other vaults remain |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_CONSENT_STATEMENT_UNKNOWN | 422 | no | statement key is not in the registry or its text hash does not match the wording for the locale |
| COMMS_CONSENT_SUBJECT_MISMATCH | 409 | no | subject revision hash does not match the canonical bytes of the subject |
| COMMS_CONSENT_STALE | 409 | no | subject has a newer revision than the one being signed |
| COMMS_CONSENT_SIGNATURE_INVALID | 422 | no | signature does not verify under classrup/consent/v1 or the signing key is not active for the signer at first-seen time |
| COMMS_CONSENT_NOT_REVOCABLE | 409 | no | consent is already revoked or the owning module has committed the subject |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.consent.sign
{ "subjectType": "mutiny_cycle", "subjectRef": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "subjectRevision": 3,
  "subjectRevisionHash": "sha256-n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg",
  "statementKey": "consent.mutiny.cycle.commit.v1", "statementLocale": "en",
  "statementTextHash": "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
  "kind": "consent", "readConfirmed": true }
-> { "consentId": "sha256-OnvT4jYKPSnupDb8-35ExzXRF8QtHBg1QgtrmULdTxs", "signedAtClaim": "2026-11-04T10:00:00.000Z", "firstSeenAt": "2026-11-04T10:00:00.000Z", "revision": 1 }
signed bytes = "classrup/consent/v1" 0x00 keyIdDigest(32 bytes) 0x00 JCS(signed fields)
vault query comms.consent.verify  { "subjectType": "mutiny_cycle", "subjectRef": "…", "subjectRevisionHash": "sha256-n4bQ…", "signerDid": "did:key:z6Mk…", "statementKey": "consent.mutiny.cycle.commit.v1" }
-> { "result": "valid", "consentId": "sha256-OnvT…", "aliasIds": [], "keyFreshness": "fresh" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T06 | contract | PS-062-04.R01, PS-062-04.R02, PS-062-04.R03, PS-062-09.R02 | each command and query executes | outputs, statements and event payloads validate against registry schemas; verify results follow the single result table |
| TEST-PS-062-09.T16 | abuse | PS-062-04.R04 | P1 sends a consent to P2 and a decline to P3; the owning modules echo received statements to all participants before commit | both P2 and P3 hold both statements and verify returns conflicted in each |
| TEST-PS-062-09.T18 | integration | PS-062-04.R05, PS-062-07.R04 | P1 deletes the account with keepEvidence true, then repeated with false | kept consents carry the pseudonym instead of signerDid; with false they are purged; copies in P2 unchanged |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
