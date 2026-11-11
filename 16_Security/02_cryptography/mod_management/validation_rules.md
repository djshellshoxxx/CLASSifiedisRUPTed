# PS-129-02 — Validation rules: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-02.R01** Registration and revocation statements are validated for schema, signatures, authority of the signer and limits before storage.
- **PS-129-02.R02** Revocation effective dates are bounded so an attacker cannot rewrite history beyond 30 days.
- **PS-129-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement matches classrup.security.keyrecord/v1 or keyrevocation/v1 and public key is a valid point of the declared algorithm | VALIDATION_FAILED |
| V02 | registration is signed by the new key itself and by an active key of the same principal or by the relay for relay keys | SECURITY_KEY_UNAUTHORIZED |
| V03 | revocation is signed by the revoked key, an active key of the same principal, or the principal's recovery key | SECURITY_KEY_UNAUTHORIZED |
| V04 | revocationEffectiveFrom lies within 30 days before the receipt time and not in the future | VALIDATION_FAILED |
| V05 | principal has at most 10 active device keys on this relay | SECURITY_KEY_LIMIT |
| V06 | the key is not already revoked, and a successor key is not already revoked | CONFLICT_STATE |
| V07 | expectedRevision matches the stored KeyRecord revision | CONFLICT_REVISION |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T01 | unit | PS-129-01.R01, PS-129-01.R02, PS-129-01.R03, PS-129-02.R01 | register K2 with link statement signed by K1 and K2 | KeyRecord stored active, keyId equals thumbprint, event emitted |
| TEST-PS-129-09.T02 | unit | PS-129-02.R02, PS-129-02.R03 | each rule V02–V07 violated | documented error code and nothing stored |
| TEST-PS-129-09.T09 | abuse | PS-129-07.R03, PS-129-02.R01 | 11th device key; 21st registration in a day; 51st revocation | SECURITY_KEY_LIMIT, RATE_LIMITED, RATE_LIMITED; oversized statement rejected |
| TEST-PS-129-09.T12 | integration | PS-129-02.R03, PS-129-07.R01 | peer relay unreachable for 8 days | freshness class unknown; high-stakes verify returns the warning |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
