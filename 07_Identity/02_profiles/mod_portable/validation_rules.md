# PS-055-02 — Validation rules: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-02.R01** Every document is verified for DID derivation, signature, size, chain and field limits before it is stored as anything other than quarantine.
- **PS-055-02.R02** Clock claims are checked with explicit tolerance and never trusted for ordering; seq orders versions.
- **PS-055-02.R03** Relay publication adds quotas and URL checks.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | did is a did:key with multicodec 0xed01 and the signature verifies against that key over JCS bytes of the document without sig | IDENTITY_DOC_SIGNATURE_INVALID |
| V02 | document size is at most 8 192 bytes, deviceKeys at most 20 entries, relays at most 5 HTTPS URLs without credentials | VALIDATION_FAILED |
| V03 | seq is exactly stored seq plus 1 and prev equals the cid of the stored current version, otherwise the document is stored as history or contested | IDENTITY_DOC_CHAIN_INVALID |
| V04 | issuedAt is not more than 10 minutes ahead of the verifier's clock and expiresAt equals issuedAt plus 180 days | VALIDATION_FAILED |
| V05 | for an own document, deviceKeys equals the active keys in F07.S01.M01 plus keys revoked within the last 180 days, and pseudonym equals the Account pseudonym | CONFLICT_STATE |
| V06 | relay only - at most 10 publications per hour per DID and 100 per hour per IP /24 | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T01 | unit | PS-055-01.R01, PS-055-01.R02, PS-055-02.R01 | issue seq 1 then seq 2 for a fixed account | statement signature verifies over JCS bytes, did starts with did:key:z6Mk, cid computed per ID-3, size under 8 KiB |
| TEST-PS-055-09.T02 | property | PS-055-01.R02, PS-055-02.R01 | 1 000 random Ed25519 keys | did:key encode and decode round trip; every did starts with z6Mk |
| TEST-PS-055-09.T03 | unit | PS-055-02.R01, PS-055-02.R02, PS-055-02.R03 | tampered field, wrong signing key, 8.5 KiB document, 21 device keys, http relay URL, issuedAt +20 min | IDENTITY_DOC_SIGNATURE_INVALID or VALIDATION_FAILED each time; nothing stored as current |
| TEST-PS-055-09.T05 | integration | PS-055-03.R03, PS-055-02.R03 | resolve contested by receiving seq 4 chained from one branch and accepting | chosen branch current, other superseded as evidence |

## Dependencies

Module depends on: F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
