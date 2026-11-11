# PS-057-02 — Validation rules: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-02.R01** Every attestation is verified for signature, signer key status, kind rules and field limits before it is displayed.
- **PS-057-02.R02** Free-text labels are restricted to plain text with a reserved-word filter so a label cannot pose as an official verification.
- **PS-057-02.R03** Expiry is anchored on the verifier's own clock and capped per kind.
- **PS-057-02.R04** The relay key set used to check relay_email_check is built from the signed descriptors of the viewer's chosen relays and peers (F15.S02.M01 descriptor, F11.S03.M01 peer records, F16.S02.M02 key records) and every affected attestation is re-checked when the set changes.
- **PS-057-02.R05** same_owner attestations require valid signatures by both DIDs, and endorsements must be signed by the subject.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | the envelope signature verifies per F11.S01.M03 with ext.signerKey a device key that the issuer's latest verified document does not mark revoked at receipt, whatever createdAt claims (F07.S02.M01 key_status at receiver time), or for relay_email_check the relay key, and the statement is at most 4 KiB | IDENTITY_ATTESTATION_SIGNATURE_INVALID |
| V02 | kind rules hold - self_claim has issuer equal to subject; peer_met_in_person, third_party and same_owner have issuer different from subject; same_owner carries a valid cosignature by the subject; relay_email_check names issuerRelayOrigin and its key is listed active for that origin in the relay key set, a key absent from a fetched descriptor being rejected | IDENTITY_ATTESTATION_KIND_INVALID |
| V03 | label is 1..80 code points of plain text without links, and for self_claim contains none of the reserved words verified, official, certified, government, police | VALIDATION_FAILED |
| V04 | claimedExpiresAt is after claimedIssuedAt, and effectiveExpiresAt is capped at 365 days (180 days for peer_met_in_person) after firstSeenAt | VALIDATION_FAILED |
| V05 | the issuer has issued fewer than 10 attestations in the last 24 hours and the subject has at most 20 active displayed attestations | RATE_LIMITED |
| V06 | one active peer_met_in_person and one active same_owner per (issuerDid, subjectDid) pair | CONFLICT_STATE |
| V07 | revocation is signed by a device key of the original issuerDid not revoked at receipt (or the relay key) and refers to the attestation cid | IDENTITY_ATTESTATION_SIGNATURE_INVALID |
| V08 | issued non-self attestations use audience subject_only; a received public non-self claim without a valid subject endorsement is stored but never displayed | VALIDATION_FAILED |
| V09 | an endorsement or cosignature is signed by an active device key of subjectDid over the attestation cid with prefix classrup-attestation-endorsement:v1 or classrup-attestation-cosign:v1 | IDENTITY_ATTESTATION_SIGNATURE_INVALID |
| V10 | public statements and endorsements carry only the blinded contextRef; the raw context id appears only in the subject-only delivery | VALIDATION_FAILED |
| V11 | a public attestation or endorsement is queued to a relay only after privacy.consent.check(federation_publish, relayId) is granted; revocations are always sent | PRECONDITION_FAILED |
| V12 | relay_email_check whose relay descriptor cannot be fetched is shown only as a Signed claim (third_party display) until the relay key set can verify it | DEPENDENCY_UNAVAILABLE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T02 | unit | PS-057-02.R01, PS-057-02.R02, PS-057-09.R02 | tampered label, issuer equals subject for a peer claim, label with a link, label 'Verified by police', wrong kind | IDENTITY_ATTESTATION_SIGNATURE_INVALID, IDENTITY_ATTESTATION_KIND_INVALID or VALIDATION_FAILED |
| TEST-PS-057-09.T03 | unit | PS-057-02.R03 | claimedExpiresAt 10 years ahead | effectiveExpiresAt clamped to 365 days (180 for peer) after first seen |
| TEST-PS-057-09.T15 | abuse | PS-057-02.R02, PS-057-02.R04 | user DID Z signs relay_email_check naming R1; O signs one naming R1; O signs one naming R2 whose descriptor is unreachable | Z rejected with IDENTITY_ATTESTATION_KIND_INVALID; O accepted with the relay badge; R2 shown only as a Signed claim until its descriptor can be fetched |
| TEST-PS-057-09.T17 | integration | PS-057-02.R05, PS-057-04.R04 | A issues same_owner about B, B co-signs; list_linkage for A and B; a same_owner with only A's signature | linkage returned for both with status active; the single-signature one rejected with IDENTITY_ATTESTATION_KIND_INVALID |
| TEST-PS-057-09.T21 | integration | PS-057-02.R04 | federation.peer.removed for a peer relay, and R1's descriptor lists O0 as retired after classrup.federation.key_rotation/v1 | relay key set rebuilt; attestations by the removed relay re-checked; O0 attestations show 'signer key retired' |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S03.M01, F15.S02.M01, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
