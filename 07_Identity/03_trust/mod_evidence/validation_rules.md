# PS-057-02 — Validation rules: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-02.R01** Every attestation is verified for signature, kind rules and field limits before it is displayed.
- **PS-057-02.R02** Free-text labels are restricted to plain text with a reserved-word filter so a label cannot pose as an official verification.
- **PS-057-02.R03** Expiry is anchored on the verifier's own clock and capped per kind.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | signature verifies against issuerDid over JCS bytes and the statement is at most 4 KiB | IDENTITY_ATTESTATION_SIGNATURE_INVALID |
| V02 | kind rules hold - self_claim has issuer equal to subject, peer_met_in_person has issuer different from subject, relay_verified_email is signed by a relay key | IDENTITY_ATTESTATION_KIND_INVALID |
| V03 | label is 1..80 code points of plain text without links, and for self_claim contains none of the reserved words verified, official, certified, government, police | VALIDATION_FAILED |
| V04 | claimedExpiresAt is after claimedIssuedAt, and effectiveExpiresAt is capped at 365 days (180 days for peer_met_in_person) after firstSeenAt | VALIDATION_FAILED |
| V05 | the issuer has issued fewer than 10 attestations in the last 24 hours and the subject has at most 20 active displayed attestations | RATE_LIMITED |
| V06 | one active peer_met_in_person per (issuerDid, subjectDid) pair | CONFLICT_STATE |
| V07 | revocation is signed by the original issuerDid and refers to the attestation cid | IDENTITY_ATTESTATION_SIGNATURE_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T01 | unit | PS-057-01.R01, PS-057-01.R02, PS-057-02.R01 | issue a self_claim and a peer_met_in_person | statements signed and verify; fields match; no personal data fields exist |
| TEST-PS-057-09.T02 | unit | PS-057-02.R01, PS-057-02.R02, PS-057-02.R03 | tampered label, issuer equals subject for a peer claim, relay kind signed by a non-relay key, label with a link, label 'Verified by police' | IDENTITY_ATTESTATION_SIGNATURE_INVALID, IDENTITY_ATTESTATION_KIND_INVALID or VALIDATION_FAILED |
| TEST-PS-057-09.T03 | unit | PS-057-01.R03, PS-057-02.R03 | claimedExpiresAt 10 years ahead | effectiveExpiresAt clamped to 365 days (180 for peer) after first seen |
| TEST-PS-057-09.T10 | abuse | PS-057-07.R03, PS-057-02.R03 | throwaway DID issues 11 attestations in 24 hours and a ring of 5 DIDs vouch for each other | RATE_LIMITED on the 11th; no numeric trust effect and new-signer labels shown |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
