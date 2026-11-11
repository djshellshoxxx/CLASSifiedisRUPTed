# PS-062-01 — Domain schema: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-01.R01** A ConsentStatement stores signer DID and device key ID, subject type and reference, subject revision number and the SHA-256 hex of the JCS bytes of that revision, statement key and version, the SHA-256 of the exact rendered wording, a signing time claim and the Ed25519 signature, with tenant and revision per CTR-ID-001.
- **PS-062-01.R02** The signed bytes are the UTF-8 string classrup.consent.v1 followed by a zero byte followed by the RFC 8785 JCS serialization of the payload fields, so a signature made for consent can never validate as another statement type (CTR-FED-001 FED-2 domain separation).
- **PS-062-01.R03** ConsentStatements are P2 evidence kept under RET-EVIDENCE, are immutable after storage apart from the derived status, and carry provenance for statements received from other vaults.

## Specification

### ConsentStatement

Schema `classrup.comms.consent/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | string — sha256 cid of the signed statement envelope, content addressed |
| tenantId | uuidv7 — tenant scope |
| signerDid | did:key — principal that signed |
| signerKeyId | string — device Ed25519 key that produced the signature, listed in the signer's device list |
| subjectType | enum — bazaar_offer \| bazaar_negotiation \| mutiny_proposal \| mutiny_cycle \| services_booking \| rentals_reservation \| rentals_deposit \| comms_meetup |
| subjectRef | uuidv7 — record ID in the owning module |
| subjectRevision | int — revision of the subject at signing |
| subjectRevisionHash | string — SHA-256 hex (64 chars) of the JCS bytes of the subject at that revision |
| statementKey | string — registry key such as consent.mutiny.cycle.commit.v1; lowercase dotted, ≤ 80 chars |
| statementTextHash | string — SHA-256 hex of the exact wording shown to the signer in the signer's locale |
| signedAtClaim | timestamp — signer clock, RFC 3339 UTC, a claim |
| signature | bytes — Ed25519 64 bytes base64url over classrup.consent.v1 NUL JCS(payload) |
| kind | enum — consent \| decline \| revocation |
| revokes? | string — id of the consent this revocation refers to; required when kind is revocation |
| status | enum — valid \| revoked \| quarantined |
| clockSuspect | boolean — signedAtClaim differs from receivedAt by more than 24 h |
| provenance | object — { originRelay?, via[], receivedAt, verifiedAt } stored for statements received from others |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- id equals the SHA-256 cid of the envelope, so two statements with equal content are the same record.
- status valid implies the signature verified against signerKeyId, signerKeyId belonged to signerDid, and subjectRevisionHash was computed by the owning module's canonicalizer.
- A revocation is stored as its own record with revokes set; the original consent row only has its status changed to revoked, never deleted.
- At most 20 records per (signerDid, subjectRef) are stored to bound abuse.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T01 | unit | PS-062-01.R01, PS-062-01.R02, PS-062-02.R01 | sign consent for cycle revision 3 and recompute bytes independently with JCS and the domain prefix | signature equals known-answer vector and verifies; payload fields complete |
| TEST-PS-062-09.T03 | property | PS-062-01.R03, PS-062-03.R01 | random sequences of sign, revoke, accept, subject revisions | revoked never returns to valid; id equals cid; verify result depends only on stored statements |
| TEST-PS-062-09.T04 | unit | PS-062-01.R02, PS-062-07.R01 | cross-protocol attempt using a login challenge signature as a consent and a consent signature as a login proof | both rejected by domain separation |

## Dependencies

Module depends on: F07.S01.M01, F16.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001. Predecessor: [module SPEC](SPEC.md).
