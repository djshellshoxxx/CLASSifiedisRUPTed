# PS-057-01 — Domain schema: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-01.R01** A TrustAttestation stores kind, subject, issuer, claim label, validity, the signed statement fields and provenance; it stores no email, phone, document or biometric data.
- **PS-057-01.R02** Every attestation carries the issuer's Ed25519 signature over JCS bytes and is verifiable offline against the issuer DID.
- **PS-057-01.R03** Visibility is a local setting of the subject and never alters the signed statement.

## Specification

### TrustAttestation

Schema `classrup.identity.attestation/v1` · storage **relay+device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| kind | enum — self_claim \| peer_met_in_person \| relay_verified_email \| third_party |
| subjectDid | did — the DID the claim is about |
| issuerDid | did — signer; equals subjectDid for self_claim; a relay key DID for relay_verified_email |
| claimKey | string — 1..40 characters from a fixed vocabulary or custom:<slug> for self_claim and third_party |
| label | string — 1..80 code points, plain text, no links, no reserved official words for self_claim |
| contextRef? | object — { type: meetup\|deal, id: uuidv7, localEvidence: boolean } |
| claimedIssuedAt | timestamp — issuer's claim |
| claimedExpiresAt | timestamp — issuer's claim |
| effectiveExpiresAt | timestamp — min(claimedExpiresAt, firstSeenAt plus the kind's maximum validity) |
| firstSeenAt | timestamp — local clock when this vault first saw the statement |
| origin | enum — issued \| received |
| provenance? | object — { originRelay?, via, receivedAt, verifiedAt } |
| cid | string — sha256-base64url of JCS(statement without sig) |
| sig | string — Ed25519 signature by the issuer key over JCS bytes |
| visibility | enum — public \| contacts \| private; local to the subject, default private for received, public for issued self_claim |
| syncState? | enum — local_committed \| prepared \| transport_acknowledged \| peer_accepted (issued statements) |
| status | enum — active \| revoked \| expired |
| revocation? | object — { statementCid, reason: issuer_revoked\|key_retired\|tombstoned, receivedAt } |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- The signature verifies against issuerDid over JCS bytes of the statement without sig.
- issuerDid equals subjectDid exactly when kind is self_claim.
- effectiveExpiresAt is at most 365 days after firstSeenAt (180 days for peer_met_in_person).
- No field holds an email, phone number, address or identity document data.

### Storage DDL

```sql
CREATE TABLE identity_attestation (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, kind TEXT NOT NULL, subject_did TEXT NOT NULL, issuer_did TEXT NOT NULL,
  cid TEXT NOT NULL, status TEXT NOT NULL, effective_expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_attestation_cid ON identity_attestation(tenant_id, cid);
CREATE INDEX identity_attestation_subject ON identity_attestation(tenant_id, subject_did, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T01 | unit | PS-057-01.R01, PS-057-01.R02, PS-057-02.R01 | issue a self_claim and a peer_met_in_person | statements signed and verify; fields match; no personal data fields exist |
| TEST-PS-057-09.T03 | unit | PS-057-01.R03, PS-057-02.R03 | claimedExpiresAt 10 years ahead | effectiveExpiresAt clamped to 365 days (180 for peer) after first seen |
| TEST-PS-057-09.T12 | a11y | PS-057-01.R01, PS-057-03.R01 | trust list and issue sheet with axe-core and keyboard only | zero serious or critical issues; signer dialog focus trap works |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
