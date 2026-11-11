# PS-062-01 — Domain schema: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-01.R01** A ConsentStatement stores exactly the signed fields v, type, tenantId, signerDid, signerKeyId, subjectType, subjectRef, subjectRevision, subjectRevisionHash (CTR-ID-001 ID-3 cid form sha256-<base64url>), statementKey, statementLocale, statementTextHash, kind, revokes? and signedAtClaim, plus the signature envelope, provenance with first-seen time and the derived status, with revision per CTR-ID-001.
- **PS-062-01.R02** The signed bytes are those of the F16.S02.M03 envelope classrup.security.envelope/v1 - the RFC 8785 JCS bytes of the header {v, ctx, kid, alg, signedAt, payloadHash} with ctx classrup/consent/v1, kid the signer key ID and payloadHash = sha256-<base64url>(SHA-256(JCS(signed field set))) - signed hash-only with the signed field set stored beside the envelope as its payload, so a consent signature can never validate as another statement type, and the regenerated known-answer vectors publish these exact header bytes and payload hashes.
- **PS-062-01.R03** ConsentStatements are P2 evidence kept under RET-EVIDENCE, are immutable after storage apart from the derived status, and carry provenance for statements received from other vaults.
- **PS-062-01.R04** id is the CTR-ID-001 ID-3 cid of the JCS bytes of the signed fields and envelope; among non-revoked records with the same dedupe tuple (signerDid, subjectRef, subjectRevisionHash, statementKey, kind) every vault keeps the lexicographically lowest cid as the record and stores the others as aliases.
- **PS-062-01.R05** The v1 statement key registry ships these keys, each with consent wording per locale (plus decline wording where the owner signs declines), its subjectType, subjectRef kind, the signer role SubjectCanonicalizerPort.partyRole must return and the owner whose registered port canonicalizes the subject - consent.bazaar.offer.accept.v1 (bazaar_offer, offerId, listing author; F01.S04.M01, JCS of the offer statement); consent.bazaar.negotiation.accept.v1 (bazaar_negotiation, negotiationId, the accepting buyer or seller; F01.S04.M02, JCS of the round statement); consent.mutiny.proposal.accept.v1 (mutiny_proposal, proposal subjectId, party) and consent.mutiny.cycle.commit.v1 (mutiny_cycle, cycle subjectId, participant), both with decline wording and canonicalized by F02.S01.M04 canonicalBytes, so subjectRevisionHash equals that revision's contentHash cid; consent.services.booking.accept.v1 (services_booking, quoteId, client), consent.services.booking.cancel.v1 with decline wording and consent.services.booking.resume.v1 (services_booking, bookingId, client or provider; F03.S02.M01); consent.rentals.reservation.request.v1 (rentals_reservation, reservationId, renter) and consent.rentals.reservation.confirm.v1 (rentals_reservation, reservationId, owner; F05.S01.M01); consent.rentals.deposit.agree.v1 (rentals_deposit, depositId, renter; F05.S01.M02), whose registered wording states that the owner, not ClassRup, holds the deposit; consent.comms.meetup.agree.v1 (comms_meetup, meetupId, party; F08.S03.M03).

## Specification

### ConsentStatement

Schema `classrup.comms.consent/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | string — sha256-<base64url> cid (ID-3) of the signed statement, content addressed |
| v | int — 1, signed |
| type | string — classrup.comms.consent/v1, signed |
| tenantId | uuidv7 — tenant scope, signed |
| signerDid | did:key — principal that signed; replaced by the deletion pseudonym in the deleting user's own kept evidence |
| signerKeyId | string — device Ed25519 key that produced the signature; equals envelope kid, which the signed header covers |
| subjectType | enum — bazaar_offer \| bazaar_negotiation \| mutiny_proposal \| mutiny_cycle \| services_booking \| rentals_reservation \| rentals_deposit \| comms_meetup |
| subjectRef | uuidv7 — record ID in the owning module |
| subjectRevision | int — revision of the subject at signing |
| subjectRevisionHash | string — sha256-<base64url> cid (ID-3) of SubjectCanonicalizerPort.canonicalBytes of the subject at that revision; for mutiny subjects it is the F02.S01.M04 contentHash itself, never a hex form |
| statementKey | string — registry key consent.<slug>.<subject>.<action>.v1 such as consent.mutiny.cycle.commit.v1; lowercase dotted, ≤ 80 chars |
| statementLocale | string — BCP 47 locale of the wording shown to the signer, signed |
| statementTextHash | string — SHA-256 lowercase hex (64 chars) of the exact wording shown in statementLocale |
| signedAtClaim | timestamp — signer clock, RFC 3339 UTC, a claim |
| kind | enum — consent \| decline \| revocation |
| revokes? | object — revocation only: { consentId } or the dedupe tuple { subjectRef, subjectRevisionHash, statementKey } |
| envelope | object — hash-only classrup.security.envelope/v1 { v: 1, ctx: classrup/consent/v1, kid (= signerKeyId), alg: ed25519, signedAt, payloadHash (sha256-<base64url> of SHA-256 over JCS of the signed field set), sig (64 bytes base64url over JCS of the six header members) }; the signed field set stored beside it is the payload passed to verify |
| status | enum — quarantined \| valid \| revoked \| erased; decline and revocation records are valid once verified and are never revoked themselves |
| aliasOf? | string — set on a duplicate: cid of the kept record of the same dedupe tuple |
| quarantineReason? | enum — subject_missing \| key_missing \| wording_unknown \| signature_invalid \| role_mismatch |
| clockSuspect | boolean — signedAtClaim differs from firstSeenAt by more than 24 h |
| provenance | object — { originRelay?, via[], receivedAt, verifiedAt } stored for statements received from others |
| firstSeenAt | timestamp — provenance.verifiedAt of the first successful verification in this vault (own signing time for local statements); exported in the signed manifest and kept on import |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- id equals the ID-3 cid, so two statements with equal content are the same record; among non-revoked duplicates of one dedupe tuple the lowest cid is the record and the others have aliasOf set.
- status valid implies F16.S02.M03 verify returned accepted for the envelope with the stored payload, expected context classrup/consent/v1, the expected binding and the key status that security.keyrecord.get_status returned for signerDid at firstSeenAt, and subjectRevisionHash matched the owning module's SubjectCanonicalizerPort.canonicalBytes.
- A revocation is stored as its own record with revokes set; the revoked consent rows only have their status changed to revoked, never deleted.
- At most 20 records per (signerDid, subjectRef) are stored to bound abuse.
- firstSeenAt is never derived from signedAtClaim and survives export and import unchanged.
- Field classes are annotated per F10.S02.M02 (DIDs, hashes and keys P2; no subject content is ever stored here).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T01 | unit | PS-062-01.R01, PS-062-01.R02, PS-062-02.R01 | sign consent for cycle revision 3 hash-only and recompute independently JCS({v, ctx, kid, alg, signedAt, payloadHash}) with payloadHash over JCS of the signed field set | signature equals the regenerated header-form known-answer vector shared with F16.S02.M03, the published header bytes and payload hash match, and verify with the payload returns accepted; payload has exactly the listed fields |
| TEST-PS-062-09.T03 | property | PS-062-01.R03, PS-062-03.R01 | random sequences of sign, revoke, accept, subject revisions | revoked never returns to valid; id equals cid; verify result depends only on stored statements |
| TEST-PS-062-09.T04 | unit | PS-062-01.R02, PS-062-07.R01 | cross-protocol attempt using a login challenge signature as a consent and a consent signature as a login proof | both rejected by the F16.S02.M03 context check |
| TEST-PS-062-09.T09 | integration | PS-062-06.R04, PS-062-01.R04 | P1 signs the same consent on both devices; P2 and P3 receive the two copies in opposite orders; P1 then revokes by dedupe tuple | P2 and P3 both keep the lowest cid with the other as alias; the revocation revokes both cids in both vaults |
| TEST-PS-062-09.T23 | contract | PS-062-01.R05, PS-062-02.R06 | load the v1 statement key registry and run sign and verify for each key against the stub port of its owner | every listed key exists with its subjectType, subjectRef kind, signer role, owning port and wording (decline wording for both mutiny keys and the booking cancel key; the deposit wording states that the owner, not ClassRup, holds the deposit); a mutiny_cycle subjectRevisionHash equals the F02.S01.M04 contentHash cid; a hex-encoded hash is refused with VALIDATION_FAILED; a partyRole other than the key's signer role is refused with FORBIDDEN |
| TEST-PS-062-09.T24 | unit | PS-062-02.R02, PS-062-01.R02 | hash-only envelope verified without its payload, with the payload of another revision, with get_status reporting revoked before firstSeenAt, and accepted with freshness unknown | the first three are not accepted and never stored valid (COMMS_CONSENT_SIGNATURE_INVALID); exactly one security.keyrecord.get_status call with at = firstSeenAt per verification; the last is stored valid with the stale-key flag |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F07.S02.M01, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001, CTR-IOX-001, CTR-UX-001. Predecessor: [module SPEC](SPEC.md).
