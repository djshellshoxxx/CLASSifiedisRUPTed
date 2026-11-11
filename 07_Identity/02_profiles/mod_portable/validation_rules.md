# PS-055-02 — Validation rules: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-02.R01** Every document is verified for DID derivation, signature, size, possession proofs, chain and field limits before it is stored as anything other than quarantine.
- **PS-055-02.R02** Clock claims are checked with explicit tolerance and never trusted for ordering; seq orders versions.
- **PS-055-02.R03** Relay publication adds quotas and URL checks.
- **PS-055-02.R04** First contact, chain gaps and recovery-driven revocations have explicit rules - trust on first use, a 24 hour gap buffer with fetches from the listed relays, and a 72 hour wait from this vault's first sight of the recovery notice.
- **PS-055-02.R05** Revocations are a grow-only union - a key once seen revoked stays revoked, a resolving document must list every revocation of every competing branch, and the deviceKeys cap is met by moving older revocations to key hashes rather than dropping them.
- **PS-055-02.R06** Key status is evaluated at the receiver's time - a key the latest verified document marks revoked is refused whatever createdAt claims; when a revocation is learned later, statements first seen at or after its effective time are quarantined (replacing plain first-seen acceptance); the effective time is the claimed revokesEffectiveAt clamped to no earlier than earliestEvidenceAt minus 30 days and no later than earliestEvidenceAt, clamped values are labelled, and a revocation is applied whatever its age.
- **PS-055-02.R07** Own documents list only the relays that F11.S03.M01 reports as selected with listInIdentityDoc true, at most 5.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | did is a did:key with multicodec 0xed01 and the signature verifies against that key over JCS bytes of the document without sig | IDENTITY_DOC_SIGNATURE_INVALID |
| V02 | document size is at most 8 192 bytes, deviceKeys at most 20 entries of which at most 10 active, revokedKeyHashes at most 64, relays at most 5 HTTPS URLs without credentials | VALIDATION_FAILED |
| V03 | chain - with a stored current document seq is stored seq plus 1 and prev equals its cid; a lower seq is stored as history, a higher seq is buffered as gap_pending, and with no stored document the highest valid document is accepted on first contact (trust on first use, firstSeenAt recorded) | IDENTITY_DOC_CHAIN_INVALID |
| V04 | issuedAt is not more than 10 minutes ahead of the verifier's clock and expiresAt equals issuedAt plus 180 days | VALIDATION_FAILED |
| V05 | for an own document, deviceKeys holds every active key of F07.S01.M01 plus the newest revoked keys up to 20 entries in total, every other key revoked in the last 180 days is in revokedKeyHashes, and pseudonym equals the Account pseudonym; the entry cap wins, and beyond 64 hashes the oldest roll off, which verifiers that saw them do not forget (revokedUnion) | CONFLICT_STATE |
| V06 | relay only - at most 10 publications per hour per DID and 100 per hour per IP /24 | RATE_LIMITED |
| V07 | every active deviceKeys entry carries a possession signature by that key over classrup-device-link:v1:<did>:<publicKey>:<linkNonce> | IDENTITY_LINK_INVALID |
| V08 | a gap_pending document is accepted as current only when the missing versions arrive and chain, or after 24 hours if signed by the same DID key and no conflicting version of any intermediate seq is known; its revocations apply at once, its additions only on acceptance | IDENTITY_DOC_CHAIN_INVALID |
| V09 | a document that newly revokes keys with revokeReason recovery is applied only 72 hours after this vault's first sight of the matching recovery notice; with no notice seen within 24 hours, or an issuedAt before the notice's notBefore claim, the DID becomes contested | CONFLICT_STATE |
| V10 | a document resolving a contested DID chains from one competing version and lists as revoked, or in revokedKeyHashes, every key revoked in any competing branch; otherwise the DID stays contested | IDENTITY_DOC_CHAIN_INVALID |
| V11 | a later document that lists as active a key in revokedUnion is a rollback and makes the DID contested | IDENTITY_DOC_CHAIN_INVALID |
| V12 | issue runs only on the root device of the local principal | IDENTITY_ROOT_KEY_REQUIRED |
| V13 | every revoked entry's revokesEffectiveAt is an RFC 3339 UTC timestamp; the effective time is clamped into earliestEvidenceAt minus 30 days to earliestEvidenceAt (never measured from issuedAt or a signedAt claim) and labelled clamped when moved; revocations in any verified version - history, gap_pending and contested included - join revokedUnion at once, and no document is refused because a revocation arrives late | VALIDATION_FAILED |
| V14 | an own document's relays equal the relays ListedRelaysPort reports (F11.S03.M01 selected relays with listInIdentityDoc true, at most 5) | CONFLICT_STATE |
| V15 | relay publish - each accompanying classrup.security.keyrevocation/v1 names the document's DID and a key it lists as revoked or removed, and its signer role holds per F07.S01.M01 V11 against the stored versions (the key itself or the root key; another device key only as pending) | SECURITY_KEY_UNAUTHORIZED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T01 | unit | PS-055-01.R01, PS-055-01.R02, PS-055-02.R01 | issue seq 1 then seq 2 for a fixed account on the root device | statement signed by the root key verifies over JCS bytes, did starts with did:key:z6Mk, cid computed per ID-3, possession signatures present, size under 8 KiB |
| TEST-PS-055-09.T03 | unit | PS-055-02.R01, PS-055-02.R02, PS-055-02.R03 | tampered field, wrong signing key, document signed by a device key, 8.5 KiB document, 21 entries, 11 active keys, http relay URL, issuedAt +20 min, relay receives 11 documents in an hour for one DID | IDENTITY_DOC_SIGNATURE_INVALID, VALIDATION_FAILED or RATE_LIMITED each time; nothing stored as current |
| TEST-PS-055-09.T05 | integration | PS-055-03.R02, PS-055-02.R05 | resolve a contested DID with seq 4 chained from one branch that lists the union of both branches' revocations, and with one that omits branch B's revocation of D2 | the first becomes current after identity.portable_doc.resolve; the second is refused with IDENTITY_DOC_CHAIN_INVALID and the DID stays contested |
| TEST-PS-055-09.T16 | integration | PS-055-02.R04 | first contact with a DID through a relay that holds only seq 21..25 | seq 25 accepted as current on first use with firstSeenAt recorded; no chain error |
| TEST-PS-055-09.T17 | integration | PS-055-02.R04, PS-055-02.R05 | stored seq 3, then seq 5 that revokes D2 arrives; seq 4 unavailable for 24 h; later seq 4 arrives | D2 treated as revoked at once; seq 5 gap_pending then current with gap true after 24 h; seq 4 stored as history and the fork check passes |
| TEST-PS-055-09.T18 | integration | PS-055-02.R04 | revoking document with revokeReason recovery whose notice was first seen 10 h earlier; a revoking document with no notice for 24 h; one whose issuedAt precedes the notice's notBefore claim | first recovery_pending until 72 h after the notice's first sight then current; second and third contested with missing_notice and early_revocation |
| TEST-PS-055-09.T19 | unit | PS-055-02.R05 | own document with 10 active and 11 revoked keys; received document with 21 entries | 20 entries plus 1 key hash, valid and under 8 KiB; the received one VALIDATION_FAILED |
| TEST-PS-055-09.T20 | abuse | PS-055-01.R02, PS-055-02.R01 | received document lists an active key without a possession signature, and one whose signature is over another DID | IDENTITY_LINK_INVALID; nothing stored as current |
| TEST-PS-055-09.T26 | abuse | PS-055-02.R05, PS-055-07.R01 | a later document lists revoked key D1 as active again | rollback detected; DID contested; D1 stays revoked in key_status |
| TEST-PS-055-09.T28 | integration | PS-055-02.R06, PS-055-02.R03 | statement by D2 with backdated createdAt after the revoking seq 5 is current; revocation of D2 learned later with records first seen before and after its effective time; seq 5 claiming revokesEffectiveAt 90 days before receipt; a lower-seq history version carrying a revocation | the first refused at receipt; on learning, key_status at firstSeenAt quarantines only the later record; the effective time is clamped to receipt minus 30 days and labelled; the history revocation joins revokedUnion; no document refused as late |
| TEST-PS-055-09.T29 | unit | PS-055-02.R07 | issue with ListedRelaysPort reporting 3 listed relays, then 6 selected relays of which 5 listed, then a stale relays list | the document lists exactly the 3 and then the 5 listed relays; a list differing from ListedRelaysPort is refused with CONFLICT_STATE |
| TEST-PS-055-09.T31 | integration | PS-055-04.R04, PS-055-02.R06 | host relay H receives publish with seq 5 and two keyrevocation statements, one signed by the revoked key and one by an unrelated key; key_set and find_by_key called in-process and over HTTP | the valid revocation stored and returned in revocationCids with the key in removedKeys and revokedKeys; the other SECURITY_KEY_UNAUTHORIZED; HTTP linkage reads refused |

## Dependencies

Module depends on: F07.S01.M01, F11.S01.M03, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
