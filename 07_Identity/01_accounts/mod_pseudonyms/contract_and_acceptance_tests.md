# PS-052-09 — Contract and acceptance tests: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-09.R01** Every requirement is covered by at least one automated test with injected clock, ID generator and fixed key pairs.
- **PS-052-09.R02** Pseudonym tests run the UTS 39 conformance vectors for skeleton and a corpus of confusable and mixed-script samples.
- **PS-052-09.R03** Statement tests verify signatures with RFC 8032 vectors and domain-separation negative cases.
- **PS-052-09.R04** Accessibility and UI copy tests check the identity and device screens with axe-core and verify that the honest-limit texts (offline guessing, no global uniqueness, revocation reaching others only on delivery, stolen root device) are present.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixed Ed25519 key pairs - root R, devices A1, A2, A3 of account A, device B1 of account B; pseudonym corpus (valid, mixed script, homoglyph pairs 'paypal' and Cyrillic lookalike, RTL override, zero-width); pinned confusables data 16.0.0; fixed clock 2026-11-04T10:00:00Z; relays R1 and R2 with registry enabled; RecoveryKitStatusPort and KeyStatusPort stubs.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T01 | unit | PS-052-01.R01, PS-052-01.R04, PS-052-04.R03 | create account with a valid pseudonym on device A1 | Account stored with did:key, rootDevice true and rootKeyRef only on A1, no private key in records; identity.account.created and identity.device_key.added emitted in the same transaction |
| TEST-PS-052-09.T02 | unit | PS-052-02.R01 | pseudonym corpus - too short, 33 code points, spaces, all digits, mixed Latin and Cyrillic, RTL override, zero-width joiner | IDENTITY_PSEUDONYM_INVALID for each; valid CJK and Latin samples accepted |
| TEST-PS-052-09.T03 | property | PS-052-02.R01, PS-052-09.R02 | UTS 39 conformance vectors, confusable pairs and 10 000 random NFKC-equivalent strings | skeletons equal the vectors; equal skeletons for confusable pairs; normalization is idempotent |
| TEST-PS-052-09.T04 | unit | PS-052-02.R01 | reserved names and their homoglyph forms | IDENTITY_PSEUDONYM_RESERVED for each |
| TEST-PS-052-09.T05 | integration | PS-052-01.R03, PS-052-02.R03, PS-052-03.R03 | two DIDs claim confusable handles on one relay; release then reclaim within and after 30 days | second claim IDENTITY_PSEUDONYM_TAKEN or CONFUSABLE; only the former DID can reclaim within 30 days; row purged after; the vault never reports global uniqueness |
| TEST-PS-052-09.T06 | integration | PS-052-03.R01, PS-052-02.R03 | change pseudonym twice within 30 days in the vault and on a registry | vault asks for confirmation and keeps the Account active with revision bumped; registry returns IDENTITY_PSEUDONYM_COOLDOWN |
| TEST-PS-052-09.T07 | unit | PS-052-01.R02, PS-052-02.R02, PS-052-02.R04 | add device with a valid dual-signed link; stale link (11 min); link signed by a device key; missing possession signature; reused offer nonce; another user's device key B1 listed under A | success first, then IDENTITY_LINK_INVALID for every other case |
| TEST-PS-052-09.T08 | integration | PS-052-03.R02, PS-052-04.R05 | revoke the last device with and without a verified kit (RecoveryKitStatusPort stub); add an 11th device; re-add a revoked key | IDENTITY_LAST_DEVICE_KEY without kit and allowed with kit; IDENTITY_DEVICE_LIMIT; a revoked key never becomes active again |
| TEST-PS-052-09.T09 | contract | PS-052-04.R01, PS-052-04.R02, PS-052-04.R03, PS-052-04.R04 | each command, query and event run | outputs, statements and events validate against registry schemas; device_key events carry the DID; statement signatures verify per RFC 8032 |
| TEST-PS-052-09.T10 | abuse | PS-052-05.R01, PS-052-05.R02, PS-052-05.R03 | locked vault mutates; claim signed by a key not active in the DID's document; operator tries to create a DID on the registry; 21 availability checks in a minute | FORBIDDEN, UNAUTHENTICATED or VALIDATION_FAILED; no registry row created; 21st check RATE_LIMITED |
| TEST-PS-052-09.T11 | integration | PS-052-06.R01, PS-052-06.R02, PS-052-06.R03 | replay the same Idempotency-Key; two tabs edit; A2 and A3 revoke each other concurrently; keystore write fails during creation | one result; CONFLICT_REVISION; both keys contested and nothing revoked silently; outbox state never above the reached state; nothing persisted on failure |
| TEST-PS-052-09.T12 | abuse | PS-052-07.R01, PS-052-07.R02 | scan storage, logs, events and exports for private keys, emails and passwords | none found; the root key appears only inside the encrypted keystore |
| TEST-PS-052-09.T13 | load | PS-052-08.R01, PS-052-08.R02, PS-052-08.R03 | 50 claims per second for 5 minutes on a relay; account creation on emulated Moto G; 32 code point skeletons | p95 <= 300 ms on relay and <= 2 s creation; skeleton <= 5 ms; registry metrics exported |
| TEST-PS-052-09.T14 | a11y | PS-052-09.R04 | create identity, devices and handle screens with axe-core and keyboard only | zero serious or critical issues; validation messages announced; QR flow has a text code |
| TEST-PS-052-09.T15 | unit | PS-052-09.R01 | traceability run over PS-052 | every requirement maps to a passing test |
| TEST-PS-052-09.T16 | integration | PS-052-10.R01, PS-052-10.R02, PS-052-10.R03 | export, import into a fresh vault, second-principal import, Unicode data bump migration and rollback | public data and statements round-trip; private keys only in the encrypted bundle; CONFLICT_STATE for a second principal; skeletons recomputed and restored on rollback |
| TEST-PS-052-09.T17 | abuse | PS-052-02.R02, PS-052-09.R03 | a valid signature over a device_link presented as handle_claim, as a relay login message and as a keyrevocation, and the reverse | rejected each time because the domain-separated prefixes differ |
| TEST-PS-052-09.T18 | abuse | PS-052-02.R04 | claim from relay R1 replayed to R2; old release replayed after a reclaim; claim with claimedAt 11 minutes old | UNAUTHENTICATED for the wrong relay, CONFLICT_REVISION for the old release, EXPIRED for the stale claim; registries unchanged |
| TEST-PS-052-09.T19 | abuse | PS-052-02.R05, PS-052-03.R02 | stolen A3 revokes A1 and A2 | both revocation_pending for 7 days; A1's counter-revocation of A3 makes A1 and A3 contested; a revocation signed by contested A3 is refused with SECURITY_KEY_UNAUTHORIZED; the root key decision ends the contest |
| TEST-PS-052-09.T20 | abuse | PS-052-01.R04, PS-052-05.R04 | A2 signs a profile with a backdated createdAt after its revocation; verifier V1 holds the revoking document, verifier V2 first saw the profile after revokesEffectiveAt and learns of the revocation later, verifier V3 first saw an older profile before revokesEffectiveAt | V1 refuses it (KeyStatusPort at receiver time); V2 quarantines it on learning the revocation; V3 keeps its profile with a revoked-signer marker and the revocation date shown as a claim |
| TEST-PS-052-09.T21 | property | PS-052-01.R05 | fingerprints of 10 000 random keys | 16 base58btc characters from SHA-256 of the raw key, no shared z6Mk prefix, no collisions, 8-word form decodes to the same 88 bits |
| TEST-PS-052-09.T22 | unit | PS-052-07.R03 | identity.pseudonym.check on a relay for a taken and a confusable candidate, and locally for a contact lookalike | relay output has only reason codes and taken, never the colliding handle, DID or registration id; the local warning names only a known contact |
| TEST-PS-052-09.T23 | e2e | PS-052-09.R04 | UI copy check of the create identity, devices and handle screens | offline-guessing warning, 'unique only on this relay', 'revocation reaches others when delivered' and stolen-root-device texts are present in every locale bundle |
| TEST-PS-052-09.T24 | integration | PS-052-07.R04 | F10 export section, DeletionPort steps sign, revoke_keys and destroy_keys run in order by a recording F10.S01.M04 stub, retention sweep; handle claim without federation_publish consent; privacy.deletion.completed delivered | sections identity.account and identity.device_keys exported; handles released in sign; one account_deleted keyrevocation per registered device key listing the final statement cids (at most 120); keys destroyed only in destroy_keys; privacy.deletion.completed removes leftovers and never touches keys; claim not sent without consent |
| TEST-PS-052-09.T25 | unit | PS-052-04.R05 | registerRecoveredKey with the root seed and a verified latest document, at 10 active keys, and without a document | Account rebuilt with rootDevice true and a recovery device_link; IDENTITY_DEVICE_LIMIT with nothing stored; without a document the key is added and no other key is known for revocation |
| TEST-PS-052-09.T26 | unit | PS-052-05.R04, PS-052-02.R05 | linked device A2 tries identity.device_key.add and confirms another key's revocation | IDENTITY_ROOT_KEY_REQUIRED for both; A2 can still sign routine statements and revoke itself |
| TEST-PS-052-09.T27 | integration | PS-052-04.R06 | A1 revoked on the root device; relays R1 (consented, listed in the document) and R2 (not consented) | the keyrevocation statement is queued with the reissued document to R1 only; on R1 identity.portable_doc.key_set and find_by_key return A1 as revoked with the revocation cid and A1 as a key removed from the document |
| TEST-PS-052-09.T28 | integration | PS-052-04.R04 | on root device A1 the principal links A3 and later revokes it; the vault on linked device A2 receives the device_link and the keyrevocation through identity.device_key.receive | A2 emits identity.device_key.added and identity.device_key.revoked with actor.kind federated, provenance { signerKey, statementCid } and origin other_device; A1's own events carry origin this_device and actor.kind user |
| TEST-PS-052-09.T29 | unit | PS-052-04.R01, PS-052-02.R05 | identity.device_key.revoke with reason superseded for the old key after a device rotation, and a received revocation with reason account_deleted and finalCids | old key revoked with revokeReason superseded and identity.device_key.revoked carries it; the account_deleted revocation is recorded with its finalCids |

## Acceptance criteria

- All tests T01-T29 pass in CI.
- No private key, passphrase or email is ever present in module storage, events, logs or relay payloads (privacy suite), and the root key exists only on the root device keystore and in the kit.
- Homoglyph and mixed-script pseudonym samples are rejected or warned according to the rules, and no claim of global pseudonym uniqueness appears in the UI or docs.
- A stolen linked device cannot revoke the legitimate devices on its own, and the UI states that a stolen root device or kit can still sign as the account.

## Dependencies

Module depends on: F16.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
