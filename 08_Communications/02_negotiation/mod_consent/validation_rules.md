# PS-062-02 — Validation rules: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-02.R01** Signing validates the subject, the signer's role, the wording and the hash before any signature is made.
- **PS-062-02.R02** Inbound statements are validated for structure, signature, key membership, role and hash before storage as valid.
- **PS-062-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | payload matches the schema, hashes are 64-char lowercase hex, signature decodes to 64 bytes, statementKey matches the key grammar | VALIDATION_FAILED |
| V02 | statementKey exists in the registry, is active for the subjectType, and statementTextHash equals the hash of the registered wording for the signer's locale | COMMS_CONSENT_STATEMENT_UNKNOWN |
| V03 | subject exists in the local vault and subjectRevisionHash equals SHA-256 of the JCS bytes returned by the owning module's canonicalizer for subjectRevision | COMMS_CONSENT_SUBJECT_MISMATCH |
| V04 | subjectRevision equals the current revision of the subject when signing locally | COMMS_CONSENT_STALE |
| V05 | signer is a party to the subject with the role the statement key requires (for example participant of the cycle) | FORBIDDEN |
| V06 | signature verifies for classrup.consent.v1 NUL JCS(payload) with signerKeyId and the key is not revoked as of the statement's first-seen time | COMMS_CONSENT_SIGNATURE_INVALID |
| V07 | revocation refers to an existing valid consent of the same signer and the subject is not yet committed by its owning module | COMMS_CONSENT_NOT_REVOCABLE |
| V08 | the signer has fewer than 20 records on the subject and signs at most 60 statements per hour | RATE_LIMITED |
| V09 | the confirmation flag read is true in the sign request | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T01 | unit | PS-062-01.R01, PS-062-01.R02, PS-062-02.R01 | sign consent for cycle revision 3 and recompute bytes independently with JCS and the domain prefix | signature equals known-answer vector and verifies; payload fields complete |
| TEST-PS-062-09.T02 | unit | PS-062-02.R02, PS-062-02.R03 | each rule V01 to V09 violated in turn | documented error code returned and nothing stored |

## Dependencies

Module depends on: F07.S01.M01, F16.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
