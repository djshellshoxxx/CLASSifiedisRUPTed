# PS-071-02 — Validation rules: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-02.R01** Receipt input is validated strictly; unknown fields are rejected with VALIDATION_FAILED.
- **PS-071-02.R02** Role and claim-state rules check that the signer is a party and that the claim status supports the assertion.
- **PS-071-02.R03** Signature verification is exact, so any byte change in the canonical content invalidates the receipt.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | claim exists in this vault and signer is a party of its Deal | NOT_FOUND |
| V02 | payer_asserts_paid requires the signer to be the claim payer and claim status not expired; payee_asserts_received requires the payee and claim status acknowledged, confirmed or final | COMMERCE_RECEIPT_ROLE |
| V03 | statement.claimCid, amount and currency equal the stored claim | COMMERCE_RECEIPT_MISMATCH |
| V04 | text at most 280 code points, plain text | VALIDATION_FAILED |
| V05 | signature is valid Ed25519 over JCS bytes and signerId is a valid did:key | COMMERCE_RECEIPT_SIGNATURE_INVALID |
| V06 | no receipt of the same type by the same signer exists for the claim | CONFLICT_STATE |
| V07 | signedAt is not more than 10 minutes in the future of the local clock | COMMERCE_RECEIPT_SKEW |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T01 | unit | PS-071-01.R01, PS-071-01.R03, PS-071-02.R03 | sign a payee receipt, then flip one byte of statement text | original verifies valid; edited copy fails with COMMERCE_RECEIPT_SIGNATURE_INVALID |
| TEST-PS-071-09.T02 | unit | PS-071-02.R01, PS-071-02.R02 | rules V01 to V07 violated in turn | documented error code returned and nothing stored |
| TEST-PS-071-09.T04 | unit | PS-071-01.R03, PS-071-02.R03 | receipt for claim X replayed against claim Y | COMMERCE_RECEIPT_MISMATCH |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
