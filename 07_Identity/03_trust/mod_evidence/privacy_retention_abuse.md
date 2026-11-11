# PS-057-07 — Privacy, retention and abuse: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-07.R01** No KYC or contact data is stored; the relay_email_check attestation records only that the operator said it checked an email on a date, never the address.
- **PS-057-07.R02** Attestations are evidence that a signer asserted a claim; the UI never states that a claim is true or verified, and a signer can be a stranger or a throwaway DID.
- **PS-057-07.R03** Subjects decide whether claims about them are shown publicly by endorsing them, but cannot erase another person's signed statement from other vaults.
- **PS-057-07.R04** The module meets the N6 privacy duties - it registers ExportSectionPort (section identity.attestations), DeletionPort (pseudonymize attestations kept as RET-EVIDENCE, delete the rest) and RetentionPurgePort, classifies fields with F10.S02.M02, calls privacy.consent.check(federation_publish, relayId) before queuing a public attestation or endorsement, and treats privacy.deletion.completed only as final cleanup.
- **PS-057-07.R05** Public statements carry only a blinded contextRef, so deal and meetup ids never leak through attestations.

## Specification

**Data classification**
- TrustAttestation: P1 when public (self_claim or endorsed); subject-only deliveries are end-to-end encrypted (P2); claim labels are free text with a 80 code point limit.
- Operator check notes: at most 140 code points, kept on the relay in audit logs for RET-AUDIT (1 year), never containing the email.

**Retention**
- RET-EVIDENCE (2 years after last related activity) for attestations; revoked and expired kept as history for the same period and pseudonymized on account deletion; local quarantined items 30 days.
- On vault erase all local attestations are deleted or pseudonymized; copies in other vaults and relays remain until signed tombstones or revocations by their issuers arrive.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Attestation mistaken for proof of truth or identity | wording 'Signed by X; this shows they said so', issuer always shown with pseudonym and DID fingerprint, no checkmark icon and no 'verified' string anywhere |
| T02 | Sybil attestation rings (Douceur 2002) where throwaway DIDs vouch for each other | attestations have no numeric reputation effect in MVP, new signers are labelled, per-issuer limit of 10 per 24 h, pairs limited to one active peer attestation |
| T03 | Operator misuse or key compromise of relay_email_check | claims only say this relay's operator says it checked, the signature binds the relay key and origin, key rotation and retired status in the descriptor mark attestations 'signer key retired', viewers can choose to hide a relay's attestations |
| T04 | Harassing or defamatory labels about a person | claims about others arrive subject-only and are shown publicly only with the subject's endorsement; viewers ignore unendorsed public copies; report to relay hosting policy; honest limit - the statement can remain elsewhere |
| T05 | Label impersonates an official verification | reserved-word filter for self-claims and a fixed visual style for self-declared items |
| T06 | Stale or expired claims relied upon | expiry capped per kind and anchored on local first-seen time, last-checked time shown for revocations |
| T07 | Anyone mints a relay badge by signing relay_email_check with a user key | the key must be listed for the named relay origin in the relay key set built from the relay's signed descriptor and the viewer's peers; otherwise the claim is rejected or shown only as a Signed claim |
| T08 | Linking deal or meetup ids through attestations | public statements carry only a blinded contextRef |
| T09 | Relay revokes a user's attestation in other vaults | only the issuer's revocation or an issuer-authored tombstone revokes it; relay tombstones drop only that relay's provenance |
| T10 | False same-owner linkage to frame someone as a shill | same_owner needs signatures by both DIDs |

**Abuse controls**
- Issuer limit 10 attestations per 24 hours; vault intake 100 attestations per hour per transport source; 20 displayed active attestations per subject; limits run through the bus RateLimitPort (F12.S03.M03, N18).
- Operator issue_relay limited to 100 per day per relay and every issuance logged with operator role and subject DID only.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T09 | abuse | PS-057-07.R01, PS-057-09.R03 | inspect all storage, logs and events for emails, phones and documents; relay issue note containing an email address | none stored; note with an email-like string rejected |
| TEST-PS-057-09.T10 | abuse | PS-057-07.R02 | throwaway DID issues 11 attestations in 24 hours and a ring of 5 DIDs vouch for each other | RATE_LIMITED on the 11th; no numeric trust effect and new-signer labels shown |
| TEST-PS-057-09.T16 | e2e | PS-057-07.R02, PS-057-09.R04 | UI strings for every kind in every locale bundle | relay_email_check badge reads 'Email check claimed by relay <host>' with 'this shows they said so'; no UI string contains 'verified' |
| TEST-PS-057-09.T18 | integration | PS-057-01.R03, PS-057-07.R03 | Q sends P a peer claim; P endorses with publish true; P later sets visibility private | endorsement signed by P's device key and queued; viewers display the endorsed claim; the signed statement is unchanged by visibility |
| TEST-PS-057-09.T20 | abuse | PS-057-07.R05 | endorsed public peer claim with a meetup context | the public statement and endorsement carry only blindedRef; the raw meetup id is absent |
| TEST-PS-057-09.T22 | integration | PS-057-07.R04 | F10 export, deletion and retention sweep with stub registries; endorsement publish to a relay without federation_publish consent | section exported; attestations pseudonymized, not deleted; PRECONDITION_FAILED or relay skipped |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S03.M01, F15.S02.M01, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
