# PS-130-01 — Domain schema: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-01.R01** The envelope contains v 1, ctx, the signer key ID kid, alg ed25519, the signedAt claim, payloadHash, an optional inline payload (canonical JSON) and the base64url 64-byte signature.
- **PS-130-01.R02** The signed bytes are the RFC 8785 JCS bytes of the header object { v, ctx, kid, alg, signedAt, payloadHash }, with payloadHash the CTR-ID-001 ID-3 form sha256-<base64url> of SHA-256 over the JCS bytes of the payload, so context, key, version, algorithm, signing-time claim and payload are covered by every signature.
- **PS-130-01.R03** Contexts follow classrup/<purpose>/v<major>, and the inventory maps each context to its owner module, signer, payload schema ID, maximum size and binding fields, and lists every other signing prefix and format in the system with its owner module.
- **PS-130-01.R04** Challenge and request prefixes bind an audience (relayId or the request's target authority), a single-use nonce and an expiry (expiresAt inside the signed bytes, the RFC 9421 expires parameter, or a challenge expiry of at most 120 s recorded by the issuer), and an inventory entry without all three is refused.
- **PS-130-01.R05** No two inventory entries are prefix-ambiguous, and the F16 header bytes, CTR-FED-001 envelope bytes, RFC 9421 signature bases and classrup-<purpose>:v<n> strings begin with different leading bytes, so no signature made in one format can verify in another.

## Specification

**Note:** No catalog entities. The envelope classrup.security.envelope/v1 is a wire and storage format embedded in other modules' records; the inventory is a frozen table in code, reviewed in the repository.
Envelope contexts (signed bytes = JCS of the header, which begins {"alg":"ed25519","ctx":"<context>"):
| Context | Owner | Signer | Payload and binding | Max bytes |
|---|---|---|---|---|
| classrup/consent/v1 | F08.S02.M02 | device key of the signing principal | consent field set; revision-bound: subjectType, subjectRef, subjectRevision, subjectRevisionHash, statementKey | 65536 |
| classrup/receipt/v1 | F09.S02.M01 | device key of the issuing claim party, linked to its principal | classrup.commerce.receipt/v1 - the payload is its statement { claimCid, dealId, contextCid, amount, method, text? }, kid equals its signingKeyId, and its keyLink (root-signed classrup.identity.device_link/v1 chain or identity-document snapshot) travels with the envelope in the receipt for offline party binding; binds claimCid, dealId and contextCid | 65536 (at least 8 KiB, so a receipt with its keyLink fits) |
| classrup/revocation-list/v1 | F16.S02.M02 | relay key of the publishing relay | { relayId, listSeq, issuedAt, nextUpdateBy, headHash, entryCount } | 4096 |
| classrup/release-hold/v1 | F16.S03.M03 | release key pinned in the running build | { releaseKeyId, heldBuildIds, reason, issuedAt, expiresAt } | 4096 |
Raw string prefixes owned by other modules (signed bytes begin with the prefix): classrup-login:v1:<relayId>:<nonce> (F07.S01.M02; challenge with audience relayId, single-use nonce and issuer-recorded expiry of 120 s); classrup-device-link:v1:<did>:<publicKey>:<nonce>, classrup-device-link-auth:v1 and classrup-handle:v1 (F07.S01.M01); classrup-recovery-notice:v1 and classrup-recovery-dispute:v1 (F07.S01.M03); classrup-review:v1 and classrup-review-ticket:v1 (F07.S03.M01); classrup-attestation:v1, classrup-attestation-cosign:v1 and classrup-attestation-endorsement:v1 (F07.S03.M02); classrup-relay-receipt:v1, classrup-relay-rotate:v1 and classrup-relay-revoke:v1 (F15.S02.M01); classrup-relay-restore:v1 (F15.S03.M03); classrup-backup:v1 and classrup-backup-manifest:v1 (F15.S03.M02); classrup-tenant-config:v1 (F15.S04.M03); classrup-release:v1 (F15.S01.M03).
Other formats: CTR-FED-001 envelopes, signed over JCS of the envelope minus sig and beginning {"author": (F11.S01.M03 signing, F11.S01.M01 type registry, which also lists F16's own envelope types); RFC 9421 HTTP message signatures, whose signature base begins "@method" (F11.S01.M03), with tag classrup/relay-request/v1 for device-to-relay requests (audience @target-uri, nonce, created, expires at most created + 300 s) and the FED-10 profile for relay-to-relay requests.
Removed as unused: classrup/attestation/v1, key-link/v1, key-rotation/v1, key-revoke/v1, login/v1 and export-manifest/v1; classrup/relay-request/v1 survives only as the RFC 9421 tag.


## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T01 | unit | PS-130-01.R01, PS-130-01.R02, PS-130-04.R01 | sign a consent payload inline and verify with expected context and binding | envelope fields as specified; accepted true; signed bytes equal JCS of the six header members and payloadHash equals the ID-3 cid of JCS(payload) |
| TEST-PS-130-09.T03 | property | PS-130-01.R02, PS-130-07.R03 | random payloads signed under context A and verified under B; single mutations of v, kid, alg, signedAt or payloadHash | always accepted false with SECURITY_CONTEXT_MISMATCH; every header mutation fails the signature |
| TEST-PS-130-09.T14 | contract | PS-130-01.R03, PS-130-01.R04, PS-130-01.R05 | repository-wide scan of every signing prefix in module.spec.yaml files; prefix-ambiguity check over all entries; a proposed challenge entry without expiry and one that prefixes an existing entry | every prefix found is in the inventory with its owner and every entry is used; no entry prefixes another; both proposals refused |
| TEST-PS-130-09.T15 | unit | PS-130-04.R02, PS-130-01.R02 | hash-only envelope verified with the right payload, a different payload and no payload | accepted; SECURITY_PAYLOAD_HASH_MISMATCH; SECURITY_PAYLOAD_HASH_MISMATCH |
| TEST-PS-130-09.T20 | contract | PS-130-01.R03 | inventory entry for classrup/receipt/v1 checked against F09.S02.M01 receipt fixtures, one with a 7.5 KiB keyLink chain | payload schema classrup.commerce.receipt/v1 statement, kid equal to signingKeyId, binding fields claimCid, dealId and contextCid, maximum 65536 bytes; the receipt with its keyLink verifies |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
