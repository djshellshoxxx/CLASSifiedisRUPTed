# PS-062-07 — Privacy, retention and abuse: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-07.R01** Consents are P2 evidence; they contain DIDs, hashes and wording keys, never the subject content, so sending them reveals only that a key holder agreed to a hash.
- **PS-062-07.R02** Retention is RET-EVIDENCE (2 years after last related activity) and deletion of a vault does not delete copies held by counterparties, which the UI states before signing.
- **PS-062-07.R03** Pseudonymity is not anonymity because the signer DID is linkable across statements, and the sign sheet says so.

## Specification

**Data classification**
- ConsentStatement: P2, visible to parties of the subject and the signer.
- Statement key registry and wording texts: P0, shipped with the app and versioned.

**Retention**
- Consent statements: RET-EVIDENCE; legal hold per F10.S01.M02 prevents purge.
- Quarantined inbound statements: erased after 7 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Replay of a consent on a modified subject | signature covers the exact JCS hash of the revision; a changed subject has a different hash so verify returns stale |
| T02 | Cross-protocol signature reuse | domain-separated context classrup.consent.v1 NUL prefix; login and other signatures use different prefixes (CTR-CAP-001 login string) |
| T03 | Forged consent by non-party | role check against the subject and key membership check against the signer's device list; failure quarantines |
| T04 | Backdated signing time to win an ordering dispute | signedAtClaim is only a claim; ordering between consent and revocation is never decided by it and relay receipt time is evidence of the relay clock only |
| T05 | Coerced or accidental signature | explicit read confirmation, wording displayed with the exact revision, revocation available until commit, and the UI explains that consent is not delivery or payment |
| T06 | Compromised device signs consents | device key revocation statements invalidate later claims; consents signed before revocation stay valid, which is disclosed |

**Abuse controls**
- Limits of 20 records per signer and subject and 60 signatures per hour per vault bound spam and DoS.
- Inbound statements from blocked signers are dropped silently; others from unknown signers wait in quarantine.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T04 | unit | PS-062-01.R02, PS-062-07.R01 | cross-protocol attempt using a login challenge signature as a consent and a consent signature as a login proof | both rejected by domain separation |
| TEST-PS-062-09.T10 | abuse | PS-062-07.R01, PS-062-07.R02, PS-062-07.R03 | clock claim 3 days off; 21st statement on one subject; inspect exported records | clockSuspect true, RATE_LIMITED, no subject content in any record |

## Dependencies

Module depends on: F07.S01.M01, F16.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
