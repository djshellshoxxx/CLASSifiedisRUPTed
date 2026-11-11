# PS-057-09 — Contract and acceptance tests: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-09.R01** Every requirement is covered by at least one automated test with fixed key pairs and an injected clock.
- **PS-057-09.R02** Signature tests include tampering, wrong issuer and wrong kind negative cases.
- **PS-057-09.R03** Privacy tests prove that no email, phone or document data is stored anywhere in the module.
- **PS-057-09.R04** Accessibility and UI copy tests check the trust list, issue sheet and claims-about-me screens, including that no UI string says 'verified'.

## Specification

See the module test table below (all processes).

**Fixtures:** Principal P, peers Q and R, relay R1 with operator key O listed in its descriptor and a retired key O0, relay R2 whose descriptor is unreachable, new throwaway DID Z, identities A and B of one owner, fixed clock 2026-11-04T10:00:00Z, label corpus (valid, with links, with reserved words).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T01 | unit | PS-057-01.R01, PS-057-01.R02 | issue a self_claim and a peer_met_in_person | statements signed by an active device key and verify; fields match; no personal data fields exist; the peer claim is subject_only |
| TEST-PS-057-09.T02 | unit | PS-057-02.R01, PS-057-02.R02, PS-057-09.R02 | tampered label, issuer equals subject for a peer claim, label with a link, label 'Verified by police', wrong kind | IDENTITY_ATTESTATION_SIGNATURE_INVALID, IDENTITY_ATTESTATION_KIND_INVALID or VALIDATION_FAILED |
| TEST-PS-057-09.T03 | unit | PS-057-02.R03 | claimedExpiresAt 10 years ahead | effectiveExpiresAt clamped to 365 days (180 for peer) after first seen |
| TEST-PS-057-09.T04 | property | PS-057-03.R01, PS-057-03.R02, PS-057-03.R03 | random sequences of receive, endorse, revoke, expire, re-issue and relay tombstones | only declared transitions succeed; revoked and expired are final; re-issue creates a new record |
| TEST-PS-057-09.T05 | integration | PS-057-03.R02, PS-057-06.R03 | revocation received after the subject endorsed and republished the claim | viewer marks revoked with lastChecked time; subject's copy shows revoked on next sync |
| TEST-PS-057-09.T06 | contract | PS-057-04.R01, PS-057-04.R02, PS-057-04.R03 | all commands, queries and events run | outputs, statements, endorsements and payloads validate against registry schemas; signatures verify; events in the same transaction |
| TEST-PS-057-09.T07 | abuse | PS-057-05.R01, PS-057-05.R02, PS-057-05.R03 | non-operator issues a relay attestation; non-issuer revokes; stranger reads a private attestation; issuer publishes a public peer claim without endorsement | FORBIDDEN or NOT_FOUND; private claim never exposed; viewers store the unendorsed claim but do not display it |
| TEST-PS-057-09.T08 | chaos | PS-057-06.R01, PS-057-06.R02, PS-057-06.R03 | duplicate delivery, offline revoke, signing failure | one record; revoked locally with honest outbox state; nothing stored on failed signing |
| TEST-PS-057-09.T09 | abuse | PS-057-07.R01, PS-057-09.R03 | inspect all storage, logs and events for emails, phones and documents; relay issue note containing an email address | none stored; note with an email-like string rejected |
| TEST-PS-057-09.T10 | abuse | PS-057-07.R02 | throwaway DID issues 11 attestations in 24 hours and a ring of 5 DIDs vouch for each other | RATE_LIMITED on the 11th; no numeric trust effect and new-signer labels shown |
| TEST-PS-057-09.T11 | load | PS-057-08.R01, PS-057-08.R02, PS-057-08.R03 | verify 1 000 attestations and list 50 on emulated Moto G | verify p95 <= 8 ms, list p95 <= 50 ms; relay counters exported |
| TEST-PS-057-09.T12 | a11y | PS-057-09.R04 | trust list, issue sheet and claims-about-me screens with axe-core and keyboard only | zero serious or critical issues; signer dialog focus trap works |
| TEST-PS-057-09.T13 | unit | PS-057-09.R01 | traceability run over PS-057 | every requirement maps to a passing test |
| TEST-PS-057-09.T14 | integration | PS-057-10.R01, PS-057-10.R02, PS-057-10.R03 | export, import in a fresh vault, tombstone after import, statement with an unknown ext key | statements re-verified and round-trip; tombstoned attestation becomes revoked; unknown ext ignored |
| TEST-PS-057-09.T15 | abuse | PS-057-02.R02, PS-057-02.R04 | user DID Z signs relay_email_check naming R1; O signs one naming R1; O signs one naming R2 whose descriptor is unreachable | Z rejected with IDENTITY_ATTESTATION_KIND_INVALID; O accepted with the relay badge; R2 shown only as a Signed claim until its descriptor can be fetched |
| TEST-PS-057-09.T16 | e2e | PS-057-07.R02, PS-057-09.R04 | UI strings for every kind in every locale bundle | relay_email_check badge reads 'Email check claimed by relay <host>' with 'this shows they said so'; no UI string contains 'verified' |
| TEST-PS-057-09.T17 | integration | PS-057-02.R05, PS-057-04.R04 | A issues same_owner about B, B co-signs; list_linkage for A and B; a same_owner with only A's signature | linkage returned for both with status active; the single-signature one rejected with IDENTITY_ATTESTATION_KIND_INVALID |
| TEST-PS-057-09.T18 | integration | PS-057-01.R03, PS-057-07.R03 | Q sends P a peer claim; P endorses with publish true; P later sets visibility private | endorsement signed by P's device key and queued; viewers display the endorsed claim; the signed statement is unchanged by visibility |
| TEST-PS-057-09.T19 | abuse | PS-057-03.R04 | a tombstone for Q's attestation signed by origin relay R1, then one signed by Q | after R1's tombstone the attestation stays active and only R1 leaves provenance; Q's tombstone revokes it |
| TEST-PS-057-09.T20 | abuse | PS-057-07.R05 | endorsed public peer claim with a meetup context | the public statement and endorsement carry only blindedRef; the raw meetup id is absent |
| TEST-PS-057-09.T21 | integration | PS-057-02.R04 | federation.peer.removed for a peer relay, and R1's descriptor lists O0 as retired after classrup.federation.key_rotation/v1 | relay key set rebuilt; attestations by the removed relay re-checked; O0 attestations show 'signer key retired' |
| TEST-PS-057-09.T22 | integration | PS-057-07.R04 | F10 export, deletion and retention sweep with stub registries; endorsement publish to a relay without federation_publish consent | section exported; attestations pseudonymized, not deleted; PRECONDITION_FAILED or relay skipped |
| TEST-PS-057-09.T23 | unit | PS-057-01.R02 | an attestation signed by an issuer device key revoked before this vault first saw it, and one first seen before the revocation | the first rejected with IDENTITY_ATTESTATION_SIGNATURE_INVALID; the second stays active |

## Acceptance criteria

- All tests T01-T23 pass in CI.
- No KYC, email, phone or document data is stored or logged by this module (privacy suite).
- Every displayed attestation shows its signer and the wording that it evidences an assertion, not truth, and no UI string calls a claim verified.
- A claim about another person is never displayed publicly without the subject's endorsement, and a relay badge appears only for keys listed in the named relay's descriptor.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S03.M01, F15.S02.M01, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
