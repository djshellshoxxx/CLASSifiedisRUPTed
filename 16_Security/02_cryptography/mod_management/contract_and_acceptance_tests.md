# PS-129-09 — Contract and acceptance tests: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-129-09.R02** Revocation ordering, freshness and contested-key behavior are covered by property and chaos tests.
- **PS-129-09.R03** Contract tests check statements and events against the schema registry.

## Specification

See the module test table below (all processes).

**Fixtures:** Principal P with root key Pr and device keys K1, K2, K3, counterparty Q with key Kq, relays X and Y with signed list heads, peer relay Z, KeyStatusPort, IdentityRefreshPort and PeerKeyPort stubs, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T01 | unit | PS-129-01.R01, PS-129-01.R02, PS-129-01.R04, PS-129-04.R02 | identity.portable_doc.published (received) adding Kq for Q; identity.device_key.added for own K2 | counterparty and own KeyRecords stored active with authority f07_identity, keyId equals thumbprint, security.key.registered carries publicKey |
| TEST-PS-129-09.T02 | unit | PS-129-02.R01, PS-129-02.R03 | each rule V01–V09 violated | documented error code and nothing stored |
| TEST-PS-129-09.T03 | property | PS-129-01.R03, PS-129-03.R01, PS-129-09.R02 | random sequences of revocations, pending periods, counter-revocations, root decisions, expiries and purges | revoked and expired never change; a revoked key never returns, also after its KeyRecord is purged |
| TEST-PS-129-09.T04 | integration | PS-129-03.R03, PS-129-06.R03 | expiry sweep missed for a VAPID key; revocation of peer key Z arrives before federation.peer.added | verification refuses the expired key; Z's hash is in the revoked-key set and the key is recorded revoked when it appears |
| TEST-PS-129-09.T05 | integration | PS-129-03.R02, PS-129-03.R04 | F07 reports K3 revoking K1 (pending), K1 counter-revoking K3 (contested) and a root decision; a test injects a revocation without any F07 event | the cache mirrors revocation_pending for 7 days, contested and the root outcome; the injected change is refused |
| TEST-PS-129-09.T06 | contract | PS-129-04.R01, PS-129-04.R05, PS-129-09.R03 | commands, queries, events and the revocation list head | validate against registry schemas; the head verifies with the relay key under classrup/revocation-list/v1 and its entries reference identity documents |
| TEST-PS-129-09.T07 | integration | PS-129-04.R03 | identity.device_key.added and revoked, identity.portable_doc.published received twice, federation.peer.added and removed, platform.relay_identity.rotated | one record each; statuses correct; peer key read through PeerKeyPort; retired relay key expired at the rotation time |
| TEST-PS-129-09.T08 | abuse | PS-129-05.R01, PS-129-05.R02, PS-129-05.R03 | vault principal calls security.keyrecord.revoke for an own device key; member registers a VAPID key; anonymous reads a status; stolen K3 tries to add a new device key K9 without a root-signed link | FORBIDDEN (identity.device_key.revoke is the path); FORBIDDEN; public status returned; SECURITY_KEY_UNAUTHORIZED |
| TEST-PS-129-09.T09 | abuse | PS-129-07.R03, PS-129-02.R01 | 11th active device key in a document; 21st relay-owned key; 51st revocation from one source in a day; oversized statement; X25519 agreement key presented by a relay for a device | SECURITY_KEY_LIMIT; SECURITY_KEY_LIMIT; RATE_LIMITED; PAYLOAD_TOO_LARGE; SECURITY_KEY_UNAUTHORIZED with nothing stored |
| TEST-PS-129-09.T10 | chaos | PS-129-06.R01, PS-129-06.R02, PS-129-06.R03 | publish fails after a local VAPID revocation; replay of the same Idempotency-Key | local revocation stands; outbox retries; one record and one revoked-key entry |
| TEST-PS-129-09.T11 | integration | PS-129-02.R02 | revocation first received 45 days after issuance with a relay receipt at issuance; a revocation claiming effectiveFrom 60 days before its relay receipt; a statement by the revoked key first seen after the effective time | recorded revoked, never dropped; second effectiveFrom clamped to receipt minus 30 days and labelled; the later statement is refused |
| TEST-PS-129-09.T12 | abuse | PS-129-07.R03, PS-129-02.R03 | relay X replays an older signed list head with lower listSeq; high-stakes get_status with only relay X confirming | SECURITY_REVOCATION_LIST_STALE recorded, freshness stays at the stored head; freshnessClass stale until relay Y confirms |
| TEST-PS-129-09.T13 | load | PS-129-08.R01, PS-129-08.R02, PS-129-08.R03 | 1 000 status queries per second for 5 minutes; list of 100 000 revocations | p95 targets met; list served ≤ 2 s; replay and age metrics exported |
| TEST-PS-129-09.T14 | unit | PS-129-09.R01 | traceability tool run | every PS-129 requirement maps to a passing test |
| TEST-PS-129-09.T15 | integration | PS-129-10.R01, PS-129-10.R02, PS-129-10.R03 | export key records, import into a fresh vault, restore relay backup | statuses, revoked-key set and statements preserved; imported counterparty freshness reset to unknown |
| TEST-PS-129-09.T16 | integration | PS-129-04.R04, PS-129-01.R05 | get for a keyId; get_status for a user key; lookup of an agreement key | publicKey, algorithm and purpose returned; KeyStatusPort called exactly once with (did, publicKey, at) and freshness added; no agreement record exists |
| TEST-PS-129-09.T17 | unit | PS-129-07.R01 | content scan of a published revocation list | only key hashes, DIDs, document references, reasons and times; no IPs, handles, labels or notes |
| TEST-PS-129-09.T18 | integration | PS-129-07.R02 | purge a revoked KeyRecord after RET-EVIDENCE, then present the same key again | KeyRecord gone; revoked-key set entry kept; CONFLICT_STATE |
| TEST-PS-129-09.T19 | integration | PS-129-01.R06, PS-129-04.R07 | relay records P's account_deleted revocation of K1 listing cids c1 and c2 through record_revocation, then receives statements c1 and c3 signed by K1; get_status with statementCid c1 and c3; F07 later reports K1 revoked by the root key for compromise | c1 finalListed true and accepted by F16.S02.M03 verify; c3 finalListed false and refused with SECURITY_KEY_REVOKED; after the compromise report c1 finalListed false |
| TEST-PS-129-09.T20 | unit | PS-129-01.R06, PS-129-02.R01 | account_deleted revocation with 121 cids; finalCids on a revocation with reason lost; a valid one with 120 cids serialized as a CTR-FED-001 envelope | VALIDATION_FAILED twice; the 120-cid statement verifies and stays under the 8 KiB relay statement limit |
| TEST-PS-129-09.T21 | contract | PS-129-04.R06 | security.key.revoked for a VAPID key and for a device key; a consumer stub that matches on purpose | both payloads carry keyId, purpose and relationship; the stub expires the VAPID subscriptions without a get_status call |
| TEST-PS-129-09.T22 | unit | PS-129-01.R07 | own key list, counterparty key detail, relay operator view and revoke confirmation rendered for F07.S01.M01 fingerprint vectors | every fingerprint equals fingerprintOf (16 base58btc characters, or the 8-word form on request); no keyId or did:key prefix is shown |
| TEST-PS-129-09.T23 | unit | PS-129-02.R01, PS-129-03.R02 | revocation signed by the root key decrypted from a recovery kit; by another active device key, then confirmed by the root key; by the revoked key itself; two device keys revoking each other | immediate; pending until the root confirmation, then revoked; immediate; both contested until a root-key decision |

## Acceptance criteria

- All tests T01–T23 pass in CI.
- A revoked key can never become active again, also after its record is purged, and verification always reports freshness of revocation knowledge from list issuedAt.
- User-key status never differs from F07.S02.M01, and a stolen linked device key cannot revoke or add keys on its own.

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
