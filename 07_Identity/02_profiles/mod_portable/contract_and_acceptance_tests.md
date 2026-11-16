# PS-055-09 — Contract and acceptance tests: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-09.R01** Every requirement is covered by at least one automated test with fixed key pairs, JCS test vectors and an injected clock.
- **PS-055-09.R02** did:key encoding is verified against the W3C did:key Ed25519 test behaviour (prefix z6Mk, round trip).
- **PS-055-09.R03** Fork, rollback and quota behaviour are tested with deterministic fixtures.

## Specification

See the module test table below (all processes).

**Fixtures:** Account key pairs K1 and K2, device keys D1..D3, documents seq 1..4 for K1, a forked seq 3, a stolen device key, fixed clock 2026-11-04T10:00:00Z, relay harness with quotas.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T01 | unit | PS-055-01.R01, PS-055-01.R02, PS-055-02.R01 | issue seq 1 then seq 2 for a fixed account | statement signature verifies over JCS bytes, did starts with did:key:z6Mk, cid computed per ID-3, size under 8 KiB |
| TEST-PS-055-09.T02 | property | PS-055-01.R02, PS-055-02.R01 | 1 000 random Ed25519 keys | did:key encode and decode round trip; every did starts with z6Mk |
| TEST-PS-055-09.T03 | unit | PS-055-02.R01, PS-055-02.R02, PS-055-02.R03 | tampered field, wrong signing key, 8.5 KiB document, 21 device keys, http relay URL, issuedAt +20 min | IDENTITY_DOC_SIGNATURE_INVALID or VALIDATION_FAILED each time; nothing stored as current |
| TEST-PS-055-09.T04 | integration | PS-055-03.R01, PS-055-03.R02 | receive seq 2, then seq 3, then a replay of seq 1, then a forked seq 3 | current moves forward; replay stays history; fork marks contested; nothing is deleted |
| TEST-PS-055-09.T05 | integration | PS-055-03.R03, PS-055-02.R03 | resolve contested by receiving seq 4 chained from one branch and accepting | chosen branch current, other superseded as evidence |
| TEST-PS-055-09.T06 | property | PS-055-03.R01, PS-055-03.R02, PS-055-03.R03 | random sequences of issue, receive, device events | only declared transitions succeed; exactly one current per uncontested DID |
| TEST-PS-055-09.T07 | contract | PS-055-04.R01, PS-055-04.R02, PS-055-04.R03, PS-055-09.R02 | commands, queries and the event run | outputs, statement and payload validate against registry schemas |
| TEST-PS-055-09.T08 | integration | PS-055-04.R03, PS-055-05.R01 | device key added and pseudonym changed events | own current document becomes stale; reissue creates seq plus 1 and supersedes |
| TEST-PS-055-09.T09 | abuse | PS-055-05.R01, PS-055-05.R02, PS-055-05.R03 | locked vault issues; blocked DID's document received; operator edits a stored document | FORBIDDEN; silently dropped; edit impossible because signature would fail |
| TEST-PS-055-09.T10 | chaos | PS-055-06.R01, PS-055-06.R02, PS-055-06.R03 | duplicate delivery, crash after sign but before commit, one of three relays down | one document per cid; no half-committed seq; per-relay states shown |
| TEST-PS-055-09.T11 | abuse | PS-055-07.R01, PS-055-07.R02, PS-055-07.R03 | inspect document for P3 fields and private keys; stolen device key tries to sign a document; relay receives 11 documents per hour for one DID | no private data; device-key signature rejected; 11th RATE_LIMITED |
| TEST-PS-055-09.T12 | load | PS-055-08.R01, PS-055-08.R02, PS-055-08.R03 | 1 000 verifications on emulated Moto G and 50 reads per second on relay | <= 10 ms device, <= 5 ms relay, read p95 <= 150 ms |
| TEST-PS-055-09.T13 | a11y | PS-055-04.R03, PS-055-01.R03 | identity document and contact screens with axe-core | zero serious or critical issues; contested warning announced |
| TEST-PS-055-09.T14 | unit | PS-055-09.R01, PS-055-09.R03 | traceability run over PS-055 | every requirement maps to a passing test |
| TEST-PS-055-09.T15 | integration | PS-055-10.R01, PS-055-10.R02, PS-055-10.R03 | export, import in a fresh vault, relay backup restore | documents round-trip with provenance; invalid signatures rejected on import |

## Acceptance criteria

- All tests T01-T15 pass in CI.
- A forked or rolled-back identity document is never silently accepted (fork and rollback tests).
- No document contains private keys or P3 data and no UI text claims real-world identity verification.

## Dependencies

Module depends on: F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
