# PS-057-01 — Domain schema: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-01.R01** A TrustAttestation stores kind, subject, issuer, claim label, validity, the signed statement fields, endorsement and provenance; it stores no email, phone, document or biometric data.
- **PS-057-01.R02** Every attestation carries the issuer's Ed25519 envelope signature (F11.S01.M03) by a device key in ext.signerKey that the issuer's latest verified portable document does not mark revoked at this vault's receipt (a relay key from the relay key set for relay_email_check), is quarantined when a revocation learned later took effect before this vault first saw it, and is verifiable offline.
- **PS-057-01.R03** Visibility is a local setting of the subject and never alters the signed statement; public display of a claim about another person requires the subject's endorsement countersignature, and a same_owner link requires signatures by both DIDs.

## Specification

### TrustAttestation

Schema `classrup.identity.attestation/v1` · storage **relay+device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| kind | enum — self_claim \| peer_met_in_person \| relay_email_check \| third_party \| same_owner |
| subjectDid | did — the DID the claim is about |
| issuerDid | did — signer; equals subjectDid for self_claim; the relay key did:key for relay_email_check |
| issuerRelayOrigin? | string — HTTPS origin of the issuing relay, relay_email_check only, bound into the signed payload |
| signerKey | string — ext.signerKey, a device key of issuerDid not revoked in its latest verified document at receipt, or the relay key |
| claimKey | string — 1..40 characters from a fixed vocabulary or custom:<slug> for self_claim and third_party |
| label | string — 1..80 code points, plain text, no links, no reserved official words for self_claim |
| contextRef? | object — { type: meetup\|deal, blindedRef (base64url SHA-256 of JCS({ id, issuerDid, subjectDid })), localEvidence: boolean }; the raw id appears only in the subject-only delivery |
| cosignature? | object — same_owner only; { did: subjectDid, keyId, sig } by an active device key of the subject over the attestation cid with prefix classrup-attestation-cosign:v1, delivered inside the subject's classrup.identity.attestation_endorsement/v1, so the issuer's and the subject's keys both sign |
| endorsement? | object — { statementCid, keyId } of the subject's classrup.identity.attestation_endorsement/v1 countersignature |
| audience | enum — subject_only \| public; every kind except self_claim is issued subject_only |
| claimedIssuedAt | timestamp — issuer's claim |
| claimedExpiresAt | timestamp — issuer's claim |
| effectiveExpiresAt | timestamp — min(claimedExpiresAt, firstSeenAt plus the kind's maximum validity) |
| firstSeenAt | timestamp — local clock when this vault first saw the statement |
| origin | enum — issued \| received |
| provenance? | object — { originRelay?, via, receivedAt, verifiedAt } |
| relayKeyCheck? | object — relay_email_check only; { result: listed\|retired\|not_listed\|unverifiable, checkedAt } |
| cid | string — per F11.S01.M03, sha256- plus base64url(SHA-256(JCS(envelope minus sig and cid))), computed by the StatementPublisherPort for issued statements |
| sig | string — Ed25519 signature by signerKey over JCS(envelope minus sig) per F11.S01.M03; the envelope type classrup.identity.attestation/v1 separates it from other statement types |
| visibility | enum — public \| contacts \| private; local to the subject, default private for received, public for issued self_claim |
| syncState? | enum — local_committed \| prepared \| transport_acknowledged \| peer_accepted (issued statements) |
| status | enum — active \| revoked \| expired |
| revocation? | object — { statementCid, reason: issuer_revoked\|key_retired\|tombstoned, receivedAt } |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- The envelope signature verifies with signerKey per F11.S01.M03, signerKey was not revoked for issuerDid (or was listed for issuerRelayOrigin) at receipt, and no revocation learned later took effect at or before firstSeenAt.
- issuerDid equals subjectDid exactly when kind is self_claim; a same_owner attestation has issuer different from subject and a valid cosignature by the subject.
- A non-self claim is displayed publicly only with a valid endorsement by the subject (same_owner counts its cosignature).
- effectiveExpiresAt is at most 365 days after firstSeenAt (180 days for peer_met_in_person).
- No field holds an email, phone number, address or identity document data, and public statements carry only the blinded contextRef.

### Storage DDL

```sql
CREATE TABLE identity_attestation (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, kind TEXT NOT NULL, subject_did TEXT NOT NULL, issuer_did TEXT NOT NULL,
  cid TEXT NOT NULL, status TEXT NOT NULL, effective_expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_attestation_cid ON identity_attestation(tenant_id, cid);
CREATE INDEX identity_attestation_subject ON identity_attestation(tenant_id, subject_did, status);
CREATE INDEX identity_attestation_linkage ON identity_attestation(tenant_id, kind, issuer_did, subject_did) WHERE kind = 'same_owner';
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T01 | unit | PS-057-01.R01, PS-057-01.R02 | issue a self_claim and a peer_met_in_person | statements signed by an active device key and verify; fields match; no personal data fields exist; the peer claim is subject_only |
| TEST-PS-057-09.T18 | integration | PS-057-01.R03, PS-057-07.R03 | Q sends P a peer claim; P endorses with publish true; P later sets visibility private | endorsement signed by P's device key and queued; viewers display the endorsed claim; the signed statement is unchanged by visibility |
| TEST-PS-057-09.T23 | unit | PS-057-01.R02 | an attestation signed by an issuer device key that the latest verified document already marks revoked, with a backdated createdAt; the revocation learned later for one attestation first seen after its effective time and one first seen before it | the first rejected with IDENTITY_ATTESTATION_SIGNATURE_INVALID; on learning, the later-seen one quarantined and the earlier-seen one stays active with a revoked-signer marker |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S03.M01, F15.S02.M01, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
