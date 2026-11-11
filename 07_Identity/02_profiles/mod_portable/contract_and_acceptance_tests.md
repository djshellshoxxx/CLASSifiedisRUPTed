# PS-055-09 — Contract and acceptance tests: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-09.R01** Every requirement is covered by at least one automated test with fixed key pairs, JCS test vectors and an injected clock.
- **PS-055-09.R02** did:key encoding is verified against the W3C did:key Ed25519 test behaviour (prefix z6Mk, round trip).
- **PS-055-09.R03** Fork, rollback, gap, recovery-wait and quota behaviour are tested with deterministic fixtures.
- **PS-055-09.R04** Accessibility and UI copy tests cover the identity document and contact screens, including contested, gap, recovery pending and expired warnings and the no-recall notice.

## Specification

See the module test table below (all processes).

**Fixtures:** Root key pairs K1 and K2, device keys D1..D12, documents seq 1..25 for K1, a forked seq 3, a stolen device key, a recovery notice and its revoking document, fixed clock 2026-11-04T10:00:00Z, relay harness with quotas and a relay holding only seq 21..25, BlockFilterPort stub.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T01 | unit | PS-055-01.R01, PS-055-01.R02, PS-055-02.R01 | issue seq 1 then seq 2 for a fixed account on the root device | statement signed by the root key verifies over JCS bytes, did starts with did:key:z6Mk, cid computed per ID-3, possession signatures present, size under 8 KiB |
| TEST-PS-055-09.T02 | property | PS-055-09.R02 | 1 000 random Ed25519 keys | did:key encode and decode round trip; every did starts with z6Mk |
| TEST-PS-055-09.T03 | unit | PS-055-02.R01, PS-055-02.R02, PS-055-02.R03 | tampered field, wrong signing key, document signed by a device key, 8.5 KiB document, 21 entries, 11 active keys, http relay URL, issuedAt +20 min, relay receives 11 documents in an hour for one DID | IDENTITY_DOC_SIGNATURE_INVALID, VALIDATION_FAILED or RATE_LIMITED each time; nothing stored as current |
| TEST-PS-055-09.T04 | integration | PS-055-03.R01, PS-055-03.R03 | receive seq 2, then seq 3, then a replay of seq 1, then a forked seq 3 | current moves forward; replay stored as history; fork marks contested; nothing is deleted |
| TEST-PS-055-09.T05 | integration | PS-055-03.R02, PS-055-02.R05 | resolve a contested DID with seq 4 chained from one branch that lists the union of both branches' revocations, and with one that omits branch B's revocation of D2 | the first becomes current after identity.portable_doc.resolve; the second is refused with IDENTITY_DOC_CHAIN_INVALID and the DID stays contested |
| TEST-PS-055-09.T06 | property | PS-055-01.R03, PS-055-03.R01, PS-055-03.R02, PS-055-03.R03, PS-055-09.R03 | random sequences of issue, receive (lower, equal, plus 1, gap, fork, recovery), expiry and device events | only declared transitions succeed; at most one current or expired per uncontested DID; lower seq stored as history; revokedUnion never shrinks; a resolving document that omits any branch revocation never resolves a fork |
| TEST-PS-055-09.T07 | contract | PS-055-04.R01, PS-055-04.R02 | commands, queries and the event run | outputs, statement and payload validate against registry schemas; published carries origin, status, addedKeys and revokedKeys |
| TEST-PS-055-09.T08 | integration | PS-055-03.R01, PS-055-04.R02 | own device key added, pseudonym changed, and 150 days pass | own current document becomes stale each time; reissue creates seq plus 1, supersedes it and emits published with origin own |
| TEST-PS-055-09.T09 | abuse | PS-055-05.R01, PS-055-05.R02, PS-055-05.R03 | locked vault or non-root device issues; blocked DID's document received; operator edits a stored document | FORBIDDEN or IDENTITY_ROOT_KEY_REQUIRED; blocked document dropped silently with no error; edit impossible because the signature fails |
| TEST-PS-055-09.T10 | chaos | PS-055-06.R01, PS-055-06.R02, PS-055-06.R03 | duplicate delivery, crash after sign but before commit, one of three relays down | one document per cid; no half-committed seq; per-relay states shown; both fork versions kept |
| TEST-PS-055-09.T11 | abuse | PS-055-07.R01, PS-055-07.R03 | inspect documents for P3 fields and private keys; relay asked to rewrite a document; tombstone for the own document | no private data; rewrite impossible; relay removes it within 24 h |
| TEST-PS-055-09.T12 | load | PS-055-08.R01, PS-055-08.R02, PS-055-08.R03 | 1 000 verifications on emulated Moto G and 50 reads per second on relay | <= 10 ms device, <= 5 ms relay, read p95 <= 150 ms; metrics exported without DIDs |
| TEST-PS-055-09.T13 | a11y | PS-055-09.R04 | identity document and contact screens with axe-core | zero serious or critical issues; contested, gap and recovery pending warnings announced |
| TEST-PS-055-09.T14 | unit | PS-055-09.R01 | traceability run over PS-055 | every requirement maps to a passing test |
| TEST-PS-055-09.T15 | integration | PS-055-10.R01, PS-055-10.R02, PS-055-10.R03 | export, import in a fresh vault, relay backup restore, and a document with an unknown ext key | documents round-trip with provenance and firstSeenAt; invalid signatures rejected on import; unknown ext keys ignored and covered by the signature |
| TEST-PS-055-09.T16 | integration | PS-055-02.R04 | first contact with a DID through a relay that holds only seq 21..25 | seq 25 accepted as current on first use with firstSeenAt recorded; no chain error |
| TEST-PS-055-09.T17 | integration | PS-055-02.R04, PS-055-02.R05 | stored seq 3, then seq 5 that revokes D2 arrives; seq 4 unavailable for 24 h; later seq 4 arrives | D2 treated as revoked at once; seq 5 gap_pending then current with gap true after 24 h; seq 4 stored as history and the fork check passes |
| TEST-PS-055-09.T18 | integration | PS-055-02.R04 | revoking document with revokeReason recovery whose notice was first seen 10 h earlier; a revoking document with no notice for 24 h; one whose issuedAt precedes the notice's notBefore claim | first recovery_pending until 72 h after the notice's first sight then current; second and third contested with missing_notice and early_revocation |
| TEST-PS-055-09.T19 | unit | PS-055-02.R05 | own document with 10 active and 11 revoked keys; received document with 21 entries | 20 entries plus 1 key hash, valid and under 8 KiB; the received one VALIDATION_FAILED |
| TEST-PS-055-09.T20 | abuse | PS-055-01.R02, PS-055-02.R01 | received document lists an active key without a possession signature, and one whose signature is over another DID | IDENTITY_LINK_INVALID; nothing stored as current |
| TEST-PS-055-09.T21 | contract | PS-055-04.R04 | key_set, find_by_key and key_status at points in time with active, revoked, pending and contested keys | outputs validate and match the fixtures; key_status at a time before the revocation was learned returns active |
| TEST-PS-055-09.T22 | integration | PS-055-04.R05, PS-055-04.R03 | receive a counterparty document that adds D3 and revokes D1; the same document again; issue with one relay lacking federation_publish consent | published with origin received, addedKeys [D3] and revokedKeys [D1]; nothing emitted for the duplicate; the relay without consent is skipped and shown |
| TEST-PS-055-09.T23 | integration | PS-055-03.R01 | a received current document passes expiresAt; then a newer document arrives | status expired and key_status flags it; the newer one supersedes the expired one |
| TEST-PS-055-09.T24 | integration | PS-055-07.R04 | F10 export section, deletion plan and retention sweep with stub registries | section identity.portable_docs exported; own document tombstoned on selected relays; received documents deleted; superseded versions kept as evidence are pseudonymized |
| TEST-PS-055-09.T25 | e2e | PS-055-07.R02, PS-055-09.R04 | UI copy check before first publication and on the contact identity screen | no-recall notice shown before the first publication; 'first seen by this device' and recovery pending texts present |
| TEST-PS-055-09.T26 | abuse | PS-055-02.R05, PS-055-07.R01 | a later document lists revoked key D1 as active again | rollback detected; DID contested; D1 stays revoked in key_status |

## Acceptance criteria

- All tests T01-T26 pass in CI.
- A forked or rolled-back identity document is never silently accepted and no resolution can bring back a revoked key (fork, rollback and union tests).
- No document contains private keys or P3 data and no UI text claims real-world identity verification.
- Recovery-driven revocations are never applied by a verifying vault before 72 hours after its own first sight of the notice.

## Dependencies

Module depends on: F07.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
