# PS-062-07 — Privacy, retention and abuse: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-07.R01** Consents are P2 evidence; they contain DIDs, hashes and wording keys, never the subject content, so sending them reveals only that a key holder agreed to a hash.
- **PS-062-07.R02** Retention is RET-EVIDENCE (2 years after last related activity) and deletion of a vault does not delete copies held by counterparties, which the UI states before signing.
- **PS-062-07.R03** Pseudonymity is not anonymity because the signer DID is linkable across statements, and the sign sheet says so.
- **PS-062-07.R04** Privacy duties (N6): fields are classified per F10.S02.M02, ExportSectionPort, DeletionPort and RetentionPurgePort are registered, and on principal deletion kept consents are pseudonymized (signerDid replaced by the deletion pseudonym) instead of erased, unless the user chose not to keep evidence.

## Specification

**Data classification**
- ConsentStatement: P2, visible to parties of the subject and the signer.
- Statement key registry and wording texts: P0, shipped with the app and versioned per locale.

**Retention**
- Consent statements: RET-EVIDENCE; legal hold per F10.S01.M02 prevents purge; pseudonymized, not erased, on the signer's own account deletion with keepEvidence.
- Quarantined inbound statements: erased after 7 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Replay of a consent on a modified subject | signature covers the exact ID-3 cid of the revision; a changed subject has a different hash so verify returns stale |
| T02 | Cross-protocol signature reuse | F16.S02.M03 envelope with context classrup/consent/v1 and the signer key-ID digest inside the signed bytes; login and other signatures use different registered contexts |
| T03 | Forged consent by non-party | role check through ConsentSubjectPort.partyRole and key status check through F16.S02.M02; failure quarantines |
| T04 | Backdated signing time to win an ordering dispute | signedAtClaim is only a claim; ordering between consent and revocation is never decided by it and relay receipt time is evidence of the relay clock only |
| T05 | Coerced or accidental signature | explicit read confirmation, wording displayed with the exact revision, revocation available until commit, and the UI explains that consent is not delivery or payment |
| T06 | Compromised device signs consents, possibly backdated | validity uses first-seen time recorded by the verifier, never signedAtClaim; statements first seen after revocationEffectiveFrom are rejected; consents first seen before revocation stay valid, which is disclosed |
| T07 | Signer equivocation - different statements to different parties | owning modules echo every received consent statement to all participants before commit; each vault then holds consent and decline and verify returns conflicted |
| T08 | Duplicate divergence - vaults keep different duplicates so a revocation misses | lowest-cid rule in every vault and revocations that target the dedupe tuple |

**Abuse controls**
- Receiver caps of 20 records per signer and subject and 200 quarantined statements per vault bound spam and DoS; the 60 signatures per hour limit in the signer vault is a UX guard.
- Inbound statements from DIDs the local principal blocked are dropped silently; others from unknown signers wait in quarantine.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T04 | unit | PS-062-01.R02, PS-062-07.R01 | cross-protocol attempt using a login challenge signature as a consent and a consent signature as a login proof | both rejected by the F16.S02.M03 context check |
| TEST-PS-062-09.T10 | abuse | PS-062-07.R01, PS-062-07.R02, PS-062-07.R03 | clock claim 3 days off; 21st statement on one subject; inspect exported records | clockSuspect true, RATE_LIMITED, no subject content in any record |
| TEST-PS-062-09.T18 | integration | PS-062-04.R05, PS-062-07.R04 | P1 deletes the account with keepEvidence true, then repeated with false | kept consents carry the pseudonym instead of signerDid; with false they are purged; copies in P2 unchanged |
| TEST-PS-062-09.T22 | unit | PS-062-07.R03, PS-062-07.R02 | render the sign sheet in en and de | text states that pseudonymity is not anonymity, that consent evidences assertion not delivery or payment, and that copies held by counterparties are not deleted with the vault |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
