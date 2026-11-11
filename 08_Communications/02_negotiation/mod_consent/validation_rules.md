# PS-062-02 — Validation rules: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-02.R01** Signing validates the subject through its SubjectCanonicalizerPort (current revision, the signer's role, commit state), the wording and the hash before any signature is made.
- **PS-062-02.R02** Inbound statements are validated for structure, signature, key status, role and hash before storage as valid.
- **PS-062-02.R03** Every violation maps to one stable error code.
- **PS-062-02.R04** The commit guard V07 applies only to the local comms.consent.revoke command; inbound revocations are always stored, and verify returns conflicted when the owning module has already committed, so the parties freeze for renegotiation instead of diverging silently.
- **PS-062-02.R05** Validity after a device-key revocation follows one rule: first-seen time is provenance.verifiedAt recorded at the first successful verification, kept through export and import in the signed manifest and never taken from signedAtClaim; a statement first seen after the key's revocationEffectiveFrom is rejected.
- **PS-062-02.R06** Each owning module registers a SubjectCanonicalizerPort for its subjectType; signing and verification for a subjectType without a registered port are refused, and the shared conformance suite checks every registered port.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | payload has exactly the signed field set, subjectRevisionHash is an ID-3 cid (sha256- plus 43 base64url characters), statementTextHash is 64-char lowercase hex, signature decodes to 64 bytes, statementKey matches the key grammar | VALIDATION_FAILED |
| V02 | sign: statementKey exists in the registry, is active for the subjectType, and statementTextHash equals the hash of the registered wording for statementLocale; receive: an unknown key or wording version is quarantined with reason wording_unknown until the registry updates, never rejected | COMMS_CONSENT_STATEMENT_UNKNOWN |
| V03 | subject exists in the local vault and subjectRevisionHash equals the ID-3 cid of SubjectCanonicalizerPort.canonicalBytes(subjectRef, subjectRevision) of the owning module | COMMS_CONSENT_SUBJECT_MISMATCH |
| V04 | sign: subjectRevision equals SubjectCanonicalizerPort.currentRevision(subjectRef) | COMMS_CONSENT_STALE |
| V05 | SubjectCanonicalizerPort.partyRole(subjectRef, signerDid) returns the role the statement key requires (for example participant of the cycle) | FORBIDDEN |
| V06 | F16.S02.M03 verify(envelope, { expectedContext: classrup/consent/v1, expectedBinding: { subjectType, subjectRef, subjectRevision, subjectRevisionHash, statementKey } }, keyStatus, payload = the signed field set) returns accepted true, and the statement is acted on only then; keyStatus is the result of one F16.S02.M02 security.keyrecord.get_status { did: signerDid, publicKey: the public key of signerKeyId, at: firstSeenAt } call, which delegates to F07.S02.M01 KeyStatusPort.keyStatus(signerDid, signerPublicKey, at = firstSeenAt); an accepted result with freshness unknown is stored valid with a stale-key flag that owning modules can require to be refreshed | COMMS_CONSENT_SIGNATURE_INVALID |
| V07 | local comms.consent.revoke only: the target is a valid consent of the local signer (by consentId or dedupe tuple) and SubjectCanonicalizerPort.isCommitted(subjectRef) is false; inbound revocations are never refused by this rule | COMMS_CONSENT_NOT_REVOCABLE |
| V08 | receiving vault cap: at most 20 records per (signerDid, subjectRef) and 200 quarantined statements per vault are kept; UX guard in the signer vault: at most 60 signatures per hour | RATE_LIMITED |
| V09 | the confirmation flag read is true in the sign request | VALIDATION_FAILED |
| V10 | statements from DIDs the local principal blocked are dropped silently (F07.S02.M02 isBlockedEither over local data); a signer blocked by someone else sees no difference | BLOCKED_PARTY |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T01 | unit | PS-062-01.R01, PS-062-01.R02, PS-062-02.R01 | sign consent for cycle revision 3 hash-only and recompute independently JCS({v, ctx, kid, alg, signedAt, payloadHash}) with payloadHash over JCS of the signed field set | signature equals the regenerated header-form known-answer vector shared with F16.S02.M03, the published header bytes and payload hash match, and verify with the payload returns accepted; payload has exactly the listed fields |
| TEST-PS-062-09.T02 | unit | PS-062-02.R02, PS-062-02.R03 | each rule V01 to V10 violated in turn | documented error code returned and nothing stored as valid |
| TEST-PS-062-09.T15 | integration | PS-062-02.R04, PS-062-03.R03 | three vaults: P2 revokes after P1's owning module committed and before P3's committed | P1 stores it and verify returns conflicted so its module freezes; P3 verify returns revoked; a local revoke on the committed subject is refused with COMMS_CONSENT_NOT_REVOCABLE |
| TEST-PS-062-09.T17 | integration | PS-062-02.R05, PS-062-10.R02 | key K of P1 revoked; a statement by K backdated before the revocation reaches P2 afterwards; P2 exports and re-imports after the revocation | the backdated statement is rejected; consents first seen before the revocation stay valid after import because firstSeenAt is restored from the manifest |
| TEST-PS-062-09.T19 | unit | PS-062-02.R06 | sign and verify for a subjectType without a registered SubjectCanonicalizerPort; port reports isCommitted true; partyRole returns none | refused with VALIDATION_FAILED; local revoke refused; FORBIDDEN |
| TEST-PS-062-09.T20 | unit | PS-062-02.R02 | inbound statement with a wording version newer than the registry, then the registry updates | quarantined with wording_unknown, then valid without being re-sent |
| TEST-PS-062-09.T23 | contract | PS-062-01.R05, PS-062-02.R06 | load the v1 statement key registry and run sign and verify for each key against the stub port of its owner | every listed key exists with its subjectType, subjectRef kind, signer role, owning port and wording (decline wording for both mutiny keys and the booking cancel key; the deposit wording states that the owner, not ClassRup, holds the deposit); a mutiny_cycle subjectRevisionHash equals the F02.S01.M04 contentHash cid; a hex-encoded hash is refused with VALIDATION_FAILED; a partyRole other than the key's signer role is refused with FORBIDDEN |
| TEST-PS-062-09.T24 | unit | PS-062-02.R02, PS-062-01.R02 | hash-only envelope verified without its payload, with the payload of another revision, with get_status reporting revoked before firstSeenAt, and accepted with freshness unknown | the first three are not accepted and never stored valid (COMMS_CONSENT_SIGNATURE_INVALID); exactly one security.keyrecord.get_status call with at = firstSeenAt per verification; the last is stored valid with the stale-key flag |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F07.S02.M01, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
